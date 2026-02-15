
import { InventoryItem, Order, OrderItem, CustomerDetails, OrderStatus, AdminSettings, PackConfig } from '../types';

const BASE_URL = '/api';

function getAuthHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('adminToken');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, { ...options, headers: { ...getAuthHeaders(), ...(options.headers || {}) } });
  if (res.status === 401 && sessionStorage.getItem('adminToken')) {
    sessionStorage.removeItem('adminToken');
    window.location.reload();
  }
  return res;
}

export const api = {
  getInventory: async (): Promise<InventoryItem[]> => {
    const res = await fetch(`${BASE_URL}/inventory`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch inventory from Postgres');
    }
    return await res.json();
  },

  getLiveActivity: async (lang: 'ar' | 'en'): Promise<string[]> => {
    const res = await fetch(`${BASE_URL}/activity?lang=${lang}`);
    if (!res.ok) {
      throw new Error('Failed to fetch live activity');
    }
    return await res.json();
  },

  createOrder: async (data: {
    language: 'ar' | 'en';
    packSize: number;
    items: OrderItem[];
    customer: CustomerDetails;
  }): Promise<Order> => {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || (data.language === 'ar' ? 'فشل إتمام الطلب في قاعدة البيانات' : 'Failed to save order to database'));
    }

    return await res.json();
  },

  adminLogin: async (username: string, password: string): Promise<string> => {
    const res = await fetch(`${BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error('Invalid credentials');
    const data = await res.json();
    sessionStorage.setItem('adminToken', data.token);
    return data.token;
  },

  adminLogout: async (): Promise<void> => {
    await fetch(`${BASE_URL}/admin/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    }).catch(() => {});
    sessionStorage.removeItem('adminToken');
  },

  getAdminOrders: async (): Promise<Order[]> => {
    const res = await adminFetch(`${BASE_URL}/admin/orders`);
    if (!res.ok) throw new Error('Failed to fetch admin orders');
    return await res.json();
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<void> => {
    const res = await adminFetch(`${BASE_URL}/admin/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update order status');
  },

  updateStock: async (colorCode: string, stock: number): Promise<void> => {
    const res = await adminFetch(`${BASE_URL}/admin/inventory/${colorCode}`, {
      method: 'PUT',
      body: JSON.stringify({ stock })
    });
    if (!res.ok) throw new Error('Failed to update stock');
  },

  updateInventoryNames: async (colorCode: string, nameAr: string, nameEn: string): Promise<void> => {
    const res = await adminFetch(`${BASE_URL}/admin/inventory/${colorCode}`, {
      method: 'PUT',
      body: JSON.stringify({ nameAr, nameEn })
    });
    if (!res.ok) throw new Error('Failed to update names');
  },

  getSettings: async (): Promise<AdminSettings> => {
    const res = await adminFetch(`${BASE_URL}/admin/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return await res.json();
  },

  updateSettings: async (settings: Partial<AdminSettings>): Promise<void> => {
    const res = await adminFetch(`${BASE_URL}/admin/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
  },

  getPublicSettings: async (): Promise<AdminSettings> => {
    const res = await fetch(`${BASE_URL}/settings/public`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return await res.json();
  },

  getPacks: async (): Promise<PackConfig[]> => {
    const res = await fetch(`${BASE_URL}/packs`);
    if (!res.ok) throw new Error('Failed to fetch pack configs');
    return await res.json();
  },

  updatePack: async (size: number, data: Partial<PackConfig>): Promise<void> => {
    const res = await adminFetch(`${BASE_URL}/admin/packs/${size}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update pack config');
  },

  updateInventoryItem: async (colorCode: string, data: { nameAr?: string; nameEn?: string; hex?: string }): Promise<void> => {
    const res = await adminFetch(`${BASE_URL}/admin/inventory/${colorCode}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update inventory item');
  },

  getImages: async (): Promise<any[]> => {
    const res = await fetch(`${BASE_URL}/images`);
    if (!res.ok) throw new Error('Failed to fetch images');
    return await res.json();
  },

  saveImage: async (data: { category: string; ref_key: string; image_url: string; sort_order?: number }): Promise<void> => {
    const res = await adminFetch(`${BASE_URL}/admin/images`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to save image');
  },

  deleteImage: async (id: string): Promise<void> => {
    const res = await adminFetch(`${BASE_URL}/admin/images/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete image');
  },

  requestUploadUrl: async (file: { name: string; size: number; type: string }): Promise<{ uploadURL: string; objectPath: string }> => {
    const res = await fetch(`${BASE_URL}/uploads/request-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type })
    });
    if (!res.ok) throw new Error('Failed to get upload URL');
    return await res.json();
  }
};
