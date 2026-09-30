export type Category = 'Stationery' | 'Xerox' | 'Printing' | 'Money Transfer';

export interface Item {
  id: string;
  name: string;
  category: Category;
  price: number;
  unit: string;
  inStock?: boolean;
  description?: string;
}

export interface CartLine {
  itemId: string;
  name: string;
  price: number;
  qty: number;
  unit?: string;
  category?: Category;
}

export type OrderStatus = 'pending' | 'paid' | 'completed' | 'cancelled';
export type OrderKind = 'order' | 'money_transfer';
export type PaymentMethod = 'cash' | 'upi' | 'card';

export interface Order {
  id: string;
  receiptNumber: string;
  createdAt: number;
  updatedAt?: number;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  note?: string;
  lines: CartLine[];
  subtotal: number;
  transferAmount?: number;
  serviceFee?: number;
  total: number;
  status: OrderStatus;
  kind: OrderKind;
  paymentMethod: PaymentMethod;
  upiRef?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  createdAt: number;
}

export interface DatabaseUser extends User {
  lastLoginAt?: number | null;
  status: string;
}

export interface BackendDatabaseInfo {
  engine: string;
  filePath: string;
  sizeBytes: number;
  totalUsers: number;
  totalLogins: number;
  hashingAlgorithm: string;
  status: string;
}

export interface LoginAuditRecord {
  id: string;
  user_id: string;
  identifier: string;
  success: number;
  timestamp: number;
  ip_address?: string | null;
  user_agent?: string | null;
}

export interface JmDbUserCredential {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  password: string;
  created_at: number;
  last_login_at?: number | null;
  status: string;
}

export interface JmDbResponse {
  content: string;
  credentials: JmDbUserCredential[];
}

export interface DatabaseStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  totalUsers: number;
  totalItems: number;
  lastUpdated: number;
}

export interface ChatQuickAction {
  label: string;
  actionType: 'whatsapp' | 'query' | 'view_shop' | 'view_account';
  payload?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: number;
  quickActions?: ChatQuickAction[];
  isError?: boolean;
}
