import { api } from './apiClient';
import { toUiStatus } from '../utils/statusCase';
import type { ApiPayment } from './apiTypes';
import type { Payment } from '../types';

function mapPayment(p: ApiPayment): Payment {
  return {
    id: p.id,
    contractId: p.contractId,
    contractNumber: p.contractNumber,
    contractorId: p.contractorId,
    contractorName: p.contractorName,
    workOrderId: p.workOrderId ?? undefined,
    amount: p.amount,
    status: toUiStatus(p.status) as Payment['status'],
    scheduledDate: p.scheduledDate,
    paidDate: p.paidDate ?? undefined,
    description: p.description,
    invoiceNumber: p.invoiceNumber ?? undefined,
    approvedBy: p.approvedByName ?? undefined,
    createdAt: p.createdAt,
  };
}

export interface PaymentFilters {
  status?: string;
  contractorId?: string;
  search?: string;
}

export const paymentsApi = {
  async list(filters: PaymentFilters = {}): Promise<Payment[]> {
    const data = await api.get<ApiPayment[]>('/payments', { ...filters });
    return data.map(mapPayment);
  },

  async getById(id: string): Promise<Payment> {
    const data = await api.get<ApiPayment>(`/payments/${id}`);
    return mapPayment(data);
  },

  async create(payload: {
    contractId: string;
    contractorId: string;
    workOrderId?: string;
    amount: number;
    scheduledDate: string;
    description: string;
    invoiceNumber?: string;
  }): Promise<Payment> {
    const data = await api.post<ApiPayment>('/payments', payload);
    return mapPayment(data);
  },

  async updateStatus(id: string, status: string, paidDate?: string): Promise<Payment> {
    const data = await api.patch<ApiPayment>(`/payments/${id}/status`, { status, paidDate });
    return mapPayment(data);
  },
};
