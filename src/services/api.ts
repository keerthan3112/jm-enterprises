import { Item, Order, User, DatabaseStats, OrderStatus, ChatQuickAction, DatabaseUser, BackendDatabaseInfo, LoginAuditRecord, JmDbResponse } from '../types';

const TOKEN_KEY = 'jm_auth_token_v2';
const USER_KEY = 'jm_auth_user_v2';

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthSession = (token: string, user: User) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const data = await res.json();
      if (data && data.error) {
        errorMsg = data.error;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Items
  async getItems(): Promise<Item[]> {
    return request<Item[]>('/api/items');
  },

  async addItem(item: Omit<Item, 'id'>): Promise<Item> {
    return request<Item>('/api/items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async updateItem(id: string, updates: Partial<Item>): Promise<Item> {
    return request<Item>(`/api/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteItem(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/items/${id}`, {
      method: 'DELETE',
    });
  },

  // Orders
  async getOrders(params?: { phone?: string; customerId?: string }): Promise<Order[]> {
    const query = new URLSearchParams();
    if (params?.phone) query.set('phone', params.phone);
    if (params?.customerId) query.set('customerId', params.customerId);
    const qs = query.toString();
    return request<Order[]>(`/api/orders${qs ? `?${qs}` : ''}`);
  },

  async getOrderById(id: string): Promise<Order> {
    return request<Order>(`/api/orders/${encodeURIComponent(id)}`);
  },

  async createOrder(data: {
    customerId?: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    note?: string;
    lines: Array<{ itemId: string; name: string; price: number; qty: number; category?: string }>;
    kind: 'order' | 'money_transfer';
    transferAmount?: number;
    serviceFee?: number;
    subtotal: number;
    total: number;
    paymentMethod: 'cash' | 'upi' | 'card';
    upiRef?: string;
    status?: OrderStatus;
  }): Promise<Order> {
    return request<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    return request<Order>(`/api/orders/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Auth
  async register(params: { name: string; email: string; phone: string; password: string }): Promise<{ user: User; token: string }> {
    const res = await request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    setAuthSession(res.token, res.user);
    return res;
  },

  async login(identifier: string, password: string): Promise<{ user: User; token: string }> {
    const res = await request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    setAuthSession(res.token, res.user);
    return res;
  },

  async getCurrentUser(): Promise<User | null> {
    const token = getAuthToken();
    if (!token) return null;
    try {
      const res = await request<{ user: User }>('/api/auth/me');
      if (res?.user) {
        setAuthSession(token, res.user);
        return res.user;
      }
      return null;
    } catch {
      clearAuthSession();
      return null;
    }
  },

  // Stats
  async getStats(): Promise<DatabaseStats> {
    return request<DatabaseStats>('/api/stats');
  },

  async resetDatabase(): Promise<{ success: boolean; stats: DatabaseStats }> {
    return request<{ success: boolean; stats: DatabaseStats }>('/api/admin/reset-db', {
      method: 'POST',
    });
  },

  async resetBillCounter(startAt: number = 0): Promise<{ success: boolean; nextBillNumber: string }> {
    return request<{ success: boolean; nextBillNumber: string }>('/api/admin/reset-bill-counter', {
      method: 'POST',
      body: JSON.stringify({ startAt }),
    });
  },

  // Backend User Database (SQLite ACID Credential Storage)
  async getDatabaseUsers(): Promise<DatabaseUser[]> {
    return request<DatabaseUser[]>('/api/admin/users');
  },

  async getDatabaseInfo(): Promise<BackendDatabaseInfo> {
    return request<BackendDatabaseInfo>('/api/admin/database-info');
  },

  async getLoginAuditLogs(): Promise<LoginAuditRecord[]> {
    return request<LoginAuditRecord[]>('/api/admin/audit-logs');
  },

  async deleteDatabaseUser(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/admin/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async resetUserPassword(id: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/admin/users/${encodeURIComponent(id)}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  },

  async getJmDb(): Promise<JmDbResponse> {
    return request<JmDbResponse>('/api/admin/jm-db');
  },

  async clearRegisteredUsers(): Promise<{ success: boolean; message: string; removedCount: number }> {
    return request<{ success: boolean; message: string; removedCount: number }>('/api/admin/clear-registered-users', {
      method: 'POST',
    });
  },

  // Customer Help Bot (AI-powered + Store Knowledge)
  async askHelpBot(
    message: string, 
    history: Array<{ role: 'user' | 'model'; text: string }> = []
  ): Promise<{ reply: string; quickActions?: ChatQuickAction[] }> {
    return request<{ reply: string; quickActions?: ChatQuickAction[] }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    });
  },
};
