import { api } from './apiClient';
import { toUiStatus } from '../utils/statusCase';
import type { ApiContractor } from './apiTypes';
import type { Contractor } from '../types';

function mapContractor(c: ApiContractor): Contractor {
  return {
    id: c.id,
    name: c.name,
    legalName: c.legalName,
    code: c.code,
    status: toUiStatus(c.status) as Contractor['status'],
    category: toUiStatus(c.category) as Contractor['category'],
    tags: c.tags,
    contactPerson: c.contactPerson,
    email: c.email,
    phone: c.phone,
    rating: c.rating,
    activeContracts: c.activeContracts,
    totalPaid: c.totalPaid,
    pendingAmount: c.pendingAmount,
    documentsExpiring: c.documentsExpiring,
    region: c.region,
    notes: c.notes ?? undefined,
    createdAt: c.createdAt,
  };
}

export interface ContractorFilters {
  search?: string;
  status?: string;
  category?: string;
}

export const contractorsApi = {
  async list(filters: ContractorFilters = {}): Promise<Contractor[]> {
    const data = await api.get<ApiContractor[]>('/contractors', { ...filters });
    return data.map(mapContractor);
  },

  async getById(id: string): Promise<Contractor> {
    const data = await api.get<ApiContractor>(`/contractors/${id}`);
    return mapContractor(data);
  },

  async create(payload: {
    name: string;
    legalName: string;
    code: string;
    category: string;
    contactPerson: string;
    email: string;
    phone: string;
    region: string;
    tags?: string[];
    notes?: string;
  }): Promise<Contractor> {
    const data = await api.post<ApiContractor>('/contractors', payload);
    return mapContractor(data);
  },

  async update(id: string, payload: Partial<{
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    status: string;
    category: string;
    tags: string[];
    notes: string;
  }>): Promise<Contractor> {
    const data = await api.patch<ApiContractor>(`/contractors/${id}`, payload);
    return mapContractor(data);
  },

  async remove(id: string): Promise<void> {
    await api.delete<void>(`/contractors/${id}`);
  },
};
