
export type Language = 'ar' | 'en';

export interface InventoryItem {
  colorCode: string;
  nameAr: string;
  nameEn: string;
  hex: string;
  sortOrder: number;
  stock: number;
  updatedAt: string;
}

export interface PackConfig {
  size: number;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  badge: string;
  sortOrder: number;
}

export interface OrderItem {
  colorCode: string;
  qty: number;
}

export interface CustomerDetails {
  name: string;
  mobile: string;
  city: string;
  address: string;
  preferredTime: 'Morning' | 'Evening';
}

export type OrderStatus = 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELED';

export interface Order {
  id: string;
  orderCode: string;
  language: Language;
  packSize: number;
  items: OrderItem[];
  customer: CustomerDetails;
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
}

export interface AdminSettings {
  pack_prices: Record<string, number>;
  delivery_fee: number;
  min_order: number;
  whatsapp_number: string;
  store_active: boolean;
}
