import { PrismaClient } from '@prisma/client';

// Type definitions from Prisma
export type Models = PrismaClient;

// Generic API client for ZenStack endpoints
export class ApiClient {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(baseUrl = '/api/model') {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // CRUD operations
  async findMany<T>(model: string, query?: any): Promise<T[]> {
    const queryString = query ? `?${new URLSearchParams(query).toString()}` : '';
    return this.request<T[]>(`/${model}${queryString}`);
  }

  async findOne<T>(model: string, id: string, query?: any): Promise<T> {
    const queryString = query ? `?${new URLSearchParams(query).toString()}` : '';
    return this.request<T>(`/${model}/${id}${queryString}`);
  }

  async create<T>(model: string, data: any): Promise<T> {
    return this.request<T>(`/${model}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update<T>(model: string, id: string, data: any): Promise<T> {
    return this.request<T>(`/${model}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(model: string, id: string): Promise<T> {
    return this.request<T>(`/${model}/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();