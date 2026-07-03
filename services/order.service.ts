import { api, getPaginated } from './api';
import { ApiResponse, Order, Address, NotificationItem, DashboardStats } from '../types/api';

export const orderService = {
  async getCart() {
    const { data } = await api.get('/cart');
    return data.data;
  },

  async addToCart(productId: number, quantity: number) {
    const { data } = await api.post('/cart/items', { product_id: productId, quantity });
    return data.data;
  },

  async updateCartItem(itemId: number, quantity: number) {
    const { data } = await api.put(`/cart/items/${itemId}`, { quantity });
    return data.data;
  },

  async removeCartItem(itemId: number) {
    await api.delete(`/cart/items/${itemId}`);
  },

  async clearCart() {
    await api.delete('/cart');
  },

  async listAddresses(): Promise<Address[]> {
    const { data } = await api.get<ApiResponse<Address[]>>('/addresses');
    return data.data;
  },

  async createAddress(address: Partial<Address>): Promise<Address> {
    const { data } = await api.post<ApiResponse<Address>>('/addresses', address);
    return data.data;
  },

  async updateAddress(id: number, address: Partial<Address>): Promise<Address> {
    const { data } = await api.put<ApiResponse<Address>>(`/addresses/${id}`, address);
    return data.data;
  },

  async deleteAddress(id: number): Promise<void> {
    await api.delete(`/addresses/${id}`);
  },

  async createOrder(addressId: number, notes?: string): Promise<Order> {
    const { data } = await api.post<ApiResponse<Order>>('/orders', { address_id: addressId, notes });
    return data.data;
  },

  async listOrders(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Order[]; total: number }> {
    return getPaginated<Order>('/orders', params);
  },

  async getOrder(id: number): Promise<Order> {
    const { data } = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return data.data;
  },

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const { data } = await api.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status });
    return data.data;
  },

  async initiatePayment(orderId: number) {
    const { data } = await api.post('/payments/initiate', { order_id: orderId });
    return data.data;
  },

  async verifyPayment(params: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) {
    const { data } = await api.post('/payments/verify', params);
    return data.data;
  },

  async getDashboard(): Promise<DashboardStats> {
    const { data } = await api.get<ApiResponse<DashboardStats>>('/admin/dashboard');
    return data.data;
  },

  async listNotifications(params?: {
    limit?: number;
    offset?: number;
  }): Promise<{ data: NotificationItem[]; total: number }> {
    return getPaginated<NotificationItem>('/notifications', params);
  },
};
