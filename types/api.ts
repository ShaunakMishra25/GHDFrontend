export interface AppError {
  code: string;
  message: string;
  user_msg: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: AppError;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    offset: number;
    limit: number;
    total: number;
  };
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface User {
  id: number;
  phone: string;
  name: string;
  role: 'customer' | 'admin';
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

export interface Category {
  id: number;
  name_hi: string;
  name_en: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: number;
  category_id: number;
  name_hi: string;
  name_en: string;
  description_hi: string;
  description_en: string;
  price: number;
  unit: string;
  image_url: string;
  is_active: boolean;
  stock_qty: number;
}

export interface CartItem {
  id: number;
  product_id: number;
  name_hi: string;
  name_en: string;
  price: number;
  quantity: number;
  unit: string;
  image_url: string;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  delivery_charge: number;
  total: number;
  item_count: number;
}

export interface Address {
  id: number;
  label: string;
  full_address: string;
  landmark: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'accepted'
  | 'preparing'
  | 'dispatched'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: number;
  user_id: number;
  address_id: number;
  address_text: string;
  status: OrderStatus;
  subtotal: number;
  delivery_charge: number;
  total: number;
  notes: string;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface InitiatePaymentResponse {
  razorpay_order_id: string;
  amount: number;
  currency: string;
  key: string;
}

export interface DashboardStats {
  today_order_count: number;
  today_revenue: number;
  pending_order_count: number;
  dispatched_order_count: number;
  total_users: number;
  total_orders: number;
  active_products: number;
  status_counts: Record<string, number>;
  today_orders: OrderBrief[];
}

export interface OrderBrief {
  id: number;
  status: OrderStatus;
  total: number;
  user_name: string;
  user_phone: string;
  address_text: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  order_id?: number;
  title: string;
  body: string;
  status: string;
  created_at: string;
}
