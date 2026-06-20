import { api } from './apiClient';
import { toUiStatus } from '../utils/statusCase';
import type { ApiContract } from './apiTypes';
import type { Contract } from '../types';

function mapContract(c: ApiContract): Contract {
  return {
    id: c.id,
    number: c.number,
    title: c.title,
    contractorId: c.contractorId,
    contractorName: c.contractorName,
    status: toUiStatus(c.status) as Contract['status'],
    type: toUiStatus(c.type) as Contract['type'],
    totalValue: c.totalValue,
    paidAmount: c.paidAmount,
    startDate: c.startDate,
    endDate: c.endDate,
    managerId: c.managerId ?? '',
    managerName: c.managerName ?? '',
    projectId: c.projectId ?? undefined,
    projectName: c.projectName ?? undefined,
    completionPercent: c.completionPercent,
    tags: c.tags,
    workOrdersCount: c.workOrdersCount,
    documentsCount: c.documentsCount,
    createdAt: c.createdAt,
  };
}

export interface ContractFilters {
  search?: string;
  status?: string;
  contractorId?: string;
}

export const contractsApi = {
  async list(filters: ContractFilters = {}): Promise<Contract[]> {
    const data = await api.get<ApiContract[]>('/contracts', { ...filters });
    return data.map(mapContract);
  },

  async getById(id: string): Promise<Contract> {
    const data = await api.get<ApiContract>(`/contracts/${id}`);
    return mapContract(data);
  },

  async create(payload: {
    number: string;
    title: string;
    contractorId: string;
    type: string;
    totalValue: number;
    startDate: string;
    endDate: string;
    projectId?: string;
    tags?: string[];
  }): Promise<Contract> {
    const data = await api.post<ApiContract>('/contracts', payload);
    return mapContract(data);
  },

  async update(id: string, payload: Partial<{
    title: string;
    status: string;
    totalValue: number;
    endDate: string;
    completionPercent: number;
    tags: string[];
  }>): Promise<Contract> {
    const data = await api.patch<ApiContract>(`/contracts/${id}`, payload);
    return mapContract(data);
  },
};
