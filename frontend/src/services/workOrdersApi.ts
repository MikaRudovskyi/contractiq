import { api } from './apiClient';
import { toUiStatus } from '../utils/statusCase';
import type { ApiWorkOrder } from './apiTypes';
import type { WorkOrder } from '../types';

function mapWorkOrder(w: ApiWorkOrder): WorkOrder {
  return {
    id: w.id,
    contractId: w.contractId,
    contractNumber: w.contractNumber,
    contractorName: w.contractorName,
    title: w.title,
    description: w.description,
    status: toUiStatus(w.status) as WorkOrder['status'],
    amount: w.amount,
    submittedAt: w.submittedAt,
    deadline: w.deadline,
    reviewedAt: w.reviewedAt ?? undefined,
    reviewedBy: w.reviewedByName ?? undefined,
    attachments: w.attachmentsCount,
    notes: w.notes ?? undefined,
  };
}

export interface WorkOrderFilters {
  status?: string;
  contractId?: string;
}

export const workOrdersApi = {
  async list(filters: WorkOrderFilters = {}): Promise<WorkOrder[]> {
    const data = await api.get<ApiWorkOrder[]>('/work-orders', { ...filters });
    return data.map(mapWorkOrder);
  },

  async getById(id: string): Promise<WorkOrder> {
    const data = await api.get<ApiWorkOrder>(`/work-orders/${id}`);
    return mapWorkOrder(data);
  },

  async create(payload: {
    contractId: string;
    title: string;
    description: string;
    amount: number;
    deadline: string;
  }): Promise<WorkOrder> {
    const data = await api.post<ApiWorkOrder>('/work-orders', payload);
    return mapWorkOrder(data);
  },

  async accept(id: string): Promise<WorkOrder> {
    const data = await api.post<ApiWorkOrder>(`/work-orders/${id}/review`, { decision: 'accept' });
    return mapWorkOrder(data);
  },

  async reject(id: string, notes: string): Promise<WorkOrder> {
    const data = await api.post<ApiWorkOrder>(`/work-orders/${id}/review`, { decision: 'reject', notes });
    return mapWorkOrder(data);
  },
};
