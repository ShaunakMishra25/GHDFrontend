import { api, getPaginated } from './api';
import { ApiResponse, Category, Product } from '../types/api';

export const productService = {
  async listCategories(): Promise<Category[]> {
    const { data } = await api.get<ApiResponse<Category[]>>('/categories');
    return data.data;
  },

  async listProducts(params?: {
    category_id?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Product[]; total: number }> {
    return getPaginated<Product>('/products', params);
  },

  async getProduct(id: number): Promise<Product> {
    const { data } = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return data.data;
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    const { data } = await api.post<ApiResponse<Product>>('/products', product);
    return data.data;
  },

  async updateProduct(id: number, product: Partial<Product>): Promise<Product> {
    const { data } = await api.put<ApiResponse<Product>>(`/products/${id}`, product);
    return data.data;
  },

  async deleteProduct(id: number): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  async createCategory(category: Partial<Category>): Promise<Category> {
    const { data } = await api.post<ApiResponse<Category>>('/categories', category);
    return data.data;
  },

  async updateCategory(id: number, category: Partial<Category>): Promise<Category> {
    const { data } = await api.put<ApiResponse<Category>>(`/categories/${id}`, category);
    return data.data;
  },

  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};
