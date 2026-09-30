import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { db, verifyPassword } from './server/db.js';
import { userDb, verifyPassword as verifyUserPassword } from './server/userDatabase.js';
import { handleCustomerChat } from './server/aiChat.js';
import { Order, OrderStatus, User } from './src/types.js';

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());

// Token helper
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'jm-enterprises-secret-token-key-2026';

function generateToken(userId: string, role: string): string {
  const payload = `${userId}:${role}:${Date.now()}`;
  const hmac = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64');
}

function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    const raw = Buffer.from(token, 'base64').toString('utf-8');
    const [userId, role, timestampStr, hmac] = raw.split(':');
    if (!userId || !role || !timestampStr || !hmac) return null;
    const expected = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(`${userId}:${role}:${timestampStr}`)
      .digest('hex');
    if (hmac !== expected) return null;
    return { userId, role };
  } catch {
    return null;
  }
}

// Auth Middleware
function extractUser(req: Request): { userId: string; role: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  return verifyToken(token);
}

// ----------------- API ROUTES -----------------

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  const stats = db.getStats();
  res.json({
    status: 'ok',
    app: 'JM Enterprises Store API',
    stats,
  });
});

// Customer Help Bot API (fully local Smart Knowledge Base)
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body || {};
    const result = await handleCustomerChat(message || '', history || []);
    res.json(result);
  } catch (err) {
    console.error('Customer help bot error:', err);
    res.status(500).json({
      reply: 'Hello! I am having trouble connecting to the network right now, but you can chat directly with the store owner on WhatsApp at 8747991688.',
      quickActions: [
        { label: 'Chat on WhatsApp', actionType: 'whatsapp', payload: req.body?.message || '' }
      ]
    });
  }
});

// Auth: Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !password || (!email && !phone)) {
      res.status(400).json({ error: 'Name, password, and at least email or phone are required.' });
      return;
    }

    if (typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();

    // Check uniqueness in backend user database
    if (cleanEmail) {
      const existing = userDb.findUserByEmailOrPhone(cleanEmail) || db.findUserByEmailOrPhone(cleanEmail);
      if (existing) {
        res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
        return;
      }
    }

    if (cleanPhone) {
      const existing = userDb.findUserByEmailOrPhone(cleanPhone) || db.findUserByEmailOrPhone(cleanPhone);
      if (existing) {
        res.status(409).json({ error: 'An account with this phone already exists. Please log in.' });
        return;
      }
    }

    // Persist securely to backend SQLite user database with PBKDF2-SHA512
    const user = userDb.createUser({
      name,
      email: cleanEmail || `${cleanPhone}@customer.jmenterprises.local`,
      phone: cleanPhone || 'Not provided',
      password,
      role: 'customer',
    });

    // Also mirror to memory/JSON store for cross-compatibility
    try {
      db.createUser({
        name,
        email: cleanEmail || `${cleanPhone}@customer.jmenterprises.local`,
        phone: cleanPhone || 'Not provided',
        password,
        role: 'customer',
      });
    } catch {}

    // Record registration audit log
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    userDb.recordLoginAudit(user.id, cleanEmail || cleanPhone, true, clientIp, userAgent);

    const token = generateToken(user.id, user.role);
    res.status(201).json({ user, token });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Registration failed' });
  }
});

// Auth: Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      res.status(400).json({ error: 'Identifier (Email/Phone/Username) and password are required.' });
      return;
    }

    const cleanIdentifier = String(identifier).trim();
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    // 1. Look up in backend SQLite database
    let dbUser = userDb.findUserByEmailOrPhone(cleanIdentifier);
    let isLegacy = false;

    // 2. Fallback lookup in memory/JSON db if not yet in SQLite
    if (!dbUser) {
      const legacyUser = db.findUserByEmailOrPhone(cleanIdentifier);
      if (legacyUser) {
        isLegacy = true;
        // Verify with legacy hasher
        const validLegacy = verifyPassword(password, legacyUser.passwordHash, legacyUser.salt);
        if (!validLegacy) {
          userDb.recordLoginAudit(legacyUser.id, cleanIdentifier, false, clientIp, userAgent);
          res.status(401).json({ error: 'Invalid password. Please check and try again.' });
          return;
        }
        // Auto-migrate credentials into SQLite with standard PBKDF2-SHA512
        const safeUser = userDb.createUser({
          name: legacyUser.name,
          email: legacyUser.email,
          phone: legacyUser.phone,
          password,
          role: legacyUser.role,
        });
        userDb.recordLoginAudit(safeUser.id, cleanIdentifier, true, clientIp, userAgent);
        const token = generateToken(safeUser.id, safeUser.role);
        res.json({ user: safeUser, token });
        return;
      }
    }

    if (!dbUser) {
      userDb.recordLoginAudit('unknown', cleanIdentifier, false, clientIp, userAgent);
      res.status(401).json({ error: 'Invalid credentials. User not found in database.' });
      return;
    }

    // Verify password hash
    const isValid = verifyUserPassword(password, dbUser.password_hash, dbUser.salt);
    if (!isValid) {
      userDb.recordLoginAudit(dbUser.id, cleanIdentifier, false, clientIp, userAgent);
      res.status(401).json({ error: 'Invalid password. Please check and try again.' });
      return;
    }

    // Update login timestamp and audit trail
    userDb.updateLastLogin(dbUser.id);
    userDb.recordLoginAudit(dbUser.id, cleanIdentifier, true, clientIp, userAgent);

    const token = generateToken(dbUser.id, dbUser.role);
    const safeUser: User = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      phone: dbUser.phone,
      role: dbUser.role,
      createdAt: dbUser.created_at,
    };
    res.json({ user: safeUser, token });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Login failed' });
  }
});

// Auth: Me
app.get('/api/auth/me', (req: Request, res: Response) => {
  const auth = extractUser(req);
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized. Valid token required.' });
    return;
  }
  const user = userDb.findUserById(auth.userId) || db.findUserById(auth.userId);
  if (!user) {
    res.status(404).json({ error: 'User session not found.' });
    return;
  }
  const safeUser: User = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: (user as any).created_at || (user as any).createdAt || Date.now(),
  };
  res.json({ user: safeUser });
});

// Items Catalog (CRUD)
app.get('/api/items', (req: Request, res: Response) => {
  res.json(db.getItems());
});

app.post('/api/items', (req: Request, res: Response) => {
  const auth = extractUser(req);
  if (auth && auth.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  const { name, category, price, unit, inStock, description } = req.body;
  if (!name || !category || price === undefined) {
    res.status(400).json({ error: 'Name, category, and price are required.' });
    return;
  }
  const item = db.addItem({
    name,
    category,
    price: Number(price),
    unit: unit || 'per piece',
    inStock: inStock !== undefined ? Boolean(inStock) : true,
    description: description || '',
  });
  res.status(201).json(item);
});

app.put('/api/items/:id', (req: Request, res: Response) => {
  const auth = extractUser(req);
  if (auth && auth.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  const { id } = req.params;
  const updated = db.updateItem(id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  res.json(updated);
});

app.delete('/api/items/:id', (req: Request, res: Response) => {
  const auth = extractUser(req);
  if (auth && auth.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  const { id } = req.params;
  const deleted = db.deleteItem(id);
  if (!deleted) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  res.json({ success: true, message: 'Item deleted' });
});

// Orders & Receipts (Database)
app.get('/api/orders', (req: Request, res: Response) => {
  const auth = extractUser(req);
  const phone = req.query.phone as string | undefined;
  const customerId = req.query.customerId as string | undefined;

  let orders = db.getOrders();

  if (auth && auth.role === 'customer') {
    orders = orders.filter(
      (o) => o.customerId === auth.userId || (phone && o.customerPhone === phone)
    );
  } else if (customerId) {
    orders = orders.filter((o) => o.customerId === customerId);
  } else if (phone) {
    orders = orders.filter((o) => o.customerPhone === phone);
  }

  res.json(orders);
});

app.get('/api/orders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const order = db.getOrderById(id);
  if (!order) {
    res.status(404).json({ error: 'Receipt not found' });
    return;
  }
  res.json(order);
});

app.post('/api/orders', (req: Request, res: Response) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      note,
      lines,
      kind,
      transferAmount,
      serviceFee,
      total,
      subtotal,
      paymentMethod,
    } = req.body;

    if (!customerName || !customerPhone) {
      res.status(400).json({ error: 'Customer name and phone number are required.' });
      return;
    }

    if (kind === 'order' && (!lines || lines.length === 0)) {
      res.status(400).json({ error: 'Cart cannot be empty.' });
      return;
    }

    const auth = extractUser(req);
    const resolvedCustomerId = auth?.userId || req.body.customerId;

    const newOrder = db.createOrder({
      customerId: resolvedCustomerId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail?.trim(),
      note: note?.trim(),
      lines: lines || [],
      subtotal: Number(subtotal || 0),
      transferAmount: transferAmount ? Number(transferAmount) : undefined,
      serviceFee: serviceFee ? Number(serviceFee) : undefined,
      total: Number(total || 0),
      status: req.body.status || 'pending',
      kind: kind === 'money_transfer' ? 'money_transfer' : 'order',
      paymentMethod: paymentMethod || 'cash',
      upiRef: req.body.upiRef ? String(req.body.upiRef).trim() : undefined,
    });

    res.status(201).json(newOrder);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create order' });
  }
});

app.patch('/api/orders/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: OrderStatus };
  const validStatuses: OrderStatus[] = ['pending', 'paid', 'completed', 'cancelled'];
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  const updated = db.updateOrderStatus(id, status);
  if (!updated) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.json(updated);
});

// Admin Stats
app.get('/api/stats', (req: Request, res: Response) => {
  res.json(db.getStats());
});

// Admin: Reset database to initial defaults
app.post('/api/admin/reset-db', (req: Request, res: Response) => {
  const auth = extractUser(req);
  if (auth && auth.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  const fresh = db.resetToDefaults();
  res.json({ success: true, message: 'Database reset to defaults', stats: db.getStats() });
});

// Admin: Reset bill counter (e.g. to start from 001)
app.post('/api/admin/reset-bill-counter', (req: Request, res: Response) => {
  const auth = extractUser(req);
  if (auth && auth.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  const startAt = typeof req.body?.startAt === 'number' ? req.body.startAt : 0;
  db.resetBillSequence(startAt);
  res.json({ 
    success: true, 
    message: `Bill counter reset. Next bill will be #${String(startAt + 1).padStart(3, '0')}`,
    nextBillNumber: String(startAt + 1).padStart(3, '0')
  });
});

// Admin: User Credentials Database Management (SQLite ACID store)
app.get('/api/admin/users', (req: Request, res: Response) => {
  const auth = extractUser(req);
  if (auth && auth.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  const users = userDb.getAllUsers();
  res.json(users);
});

app.get('/api/admin/database-info', (req: Request, res: Response) => {
  const auth = extractUser(req);
  if (auth && auth.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  const info = userDb.getDatabaseInfo();
  res.json(info);
});

app.get('/api/admin/audit-logs', (req: Request, res: Response) => {
  const auth = extractUser(req);
  if (auth && auth.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  const logs = userDb.getRecentAuditLogs(50);
  res.json(logs);
});

app.delete('/api/admin/users/:id', (req: Request, res: Response) => {
  const auth = extractUser(req);
  if (auth && auth.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  try {
    const { id } = req.params;
    const success = userDb.deleteUser(id);
    if (!success) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ success: true, message: 'User credentials removed from database' });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to delete user' });
  }
});

app.post('/api/admin/users/:id/reset-password', (req: Request, res: Response) => {
  const auth = extractUser(req);
  if (auth && auth.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    return;
  }
  const success = userDb.resetPassword(id, newPassword);
  if (!success) {
    res.status(404).json({ error: 'User not found in database' });
    return;
  }
  res.json({ success: true, message: 'Password reset successfully in database' });
});

// Admin: Clear registered users (preserves administrator account)
app.post('/api/admin/clear-registered-users', (req: Request, res: Response) => {
  const auth = extractUser(req);
  if (auth && auth.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  try {
    const userDbResult = userDb.clearRegisteredUsers();
    db.clearRegisteredUsers();
    res.json({
      success: true,
      message: `Database cleared successfully. Removed ${userDbResult.removedCount} registered user accounts. Administrator preserved.`,
      removedCount: userDbResult.removedCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to clear registered users from database' });
  }
});

// View jm.db reference file content and user credentials list
app.get('/api/admin/jm-db', (req: Request, res: Response) => {
  const auth = extractUser(req);
  if (auth && auth.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  const content = userDb.getJmDbContent();
  const credentials = userDb.getJmDbCredentials();
  res.json({ content, credentials });
});

// Download jm.db file directly
app.get('/api/admin/jm-db/download', (req: Request, res: Response) => {
  const auth = extractUser(req);
  if (auth && auth.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  const jmDbPath = path.join(process.cwd(), 'jm.db');
  if (!fs.existsSync(jmDbPath)) {
    userDb.syncJmDbFile();
  }
  res.download(jmDbPath, 'jm.db');
});

// Direct text endpoint to view jm.db in browser / curl
app.get('/jm.db', (req: Request, res: Response) => {
  const jmDbPath = path.join(process.cwd(), 'jm.db');
  if (!fs.existsSync(jmDbPath)) {
    userDb.syncJmDbFile();
  }
  res.type('text/plain; charset=utf-8').sendFile(jmDbPath);
});

// ----------------- VITE / STATIC SERVING -----------------

async function startServer() {
  // Serve public folder statically (favicons, brand logo images, etc.)
  app.use(express.static(path.join(process.cwd(), 'public')));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

  const server = app.listen(PORT, host, () => {
    const localUrl = `http://localhost:${PORT}`;
    console.log('');
    console.log('==============================================');
    console.log(' JM Enterprises is running');
    console.log(` Local:  ${localUrl}`);
    console.log('==============================================');
    console.log('');
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\nPort ${PORT} is already in use.`);
      console.error(`Close the application using port ${PORT}, or start with another port:`);
      console.error(process.env.NODE_ENV === 'production' ? 'Render sets PORT automatically.' : `Windows CMD: set PORT=3001 && npm run dev`);
    } else {
      console.error('Server error:', err);
    }
    process.exit(1);
  });
}

startServer().catch((err) => {
  console.error('\nFailed to start JM Enterprises.');
  console.error(err);
  process.exit(1);
});
