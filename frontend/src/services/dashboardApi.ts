import { api } from './apiClient';
import { toUiStatus } from '../utils/statusCase';
import type { ApiDashboardStats, ApiChartPoint, ApiActivityItem } from './apiTypes';
import type { DashboardStats, ChartDataPoint, ActivityItem } from '../types';

function mapStats(s: ApiDashboardStats): DashboardStats {
  return {
    activeContractors: s.activeContractors,
    activeContracts: s.activeContracts,
    pendingWorkOrders: s.pendingWorkOrders,
    overduePayments: s.overduePayments,
    totalContractValue: s.totalContractValue,
    paidThisMonth: s.paidThisMonth,
    documentsExpiringSoon: s.documentsExpiringSoon,
    contractsEndingSoon: s.contractsEndingSoon,
  };
}

function mapChartPoint(c: ApiChartPoint): ChartDataPoint {
  return { month: c.month, paid: c.paid, scheduled: c.scheduled };
}

function mapActivity(a: ApiActivityItem): ActivityItem {
  return {
    id: a.id,
    type: toUiStatus(a.type) as ActivityItem['type'],
    action: a.action,
    subject: a.subject,
    actor: a.actor,
    timestamp: a.timestamp,
  };
}

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    const data = await api.get<ApiDashboardStats>('/dashboard/stats');
    return mapStats(data);
  },

  async getPaymentsChart(months = 6): Promise<ChartDataPoint[]> {
    const data = await api.get<ApiChartPoint[]>('/dashboard/payments-chart', { months });
    return data.map(mapChartPoint);
  },

  async getActivity(take = 10): Promise<ActivityItem[]> {
    const data = await api.get<ApiActivityItem[]>('/dashboard/activity', { take });
    return data.map(mapActivity);
  },
};
