// Типи відповідей API — точно відповідають DTO з C# backend (camelCase JSON).
// Backend повертає enum-и як рядки з великої букви (напр. "Active", "Paid"),
// тому для UI ці значення нормалізуються через mapStatus() у відповідних *Api.ts файлах.

export interface ApiContractor {
  id: string;
  name: string;
  legalName: string;
  code: string;
  status: string; // "Pending" | "Active" | "Suspended" | "Blacklisted"
  category: string;
  tags: string[];
  contactPerson: string;
  email: string;
  phone: string;
  rating: number;
  activeContracts: number;
  totalPaid: number;
  pendingAmount: number;
  documentsExpiring: number;
  region: string;
  notes: string | null;
  createdAt: string;
}

export interface ApiContract {
  id: string;
  number: string;
  title: string;
  contractorId: string;
  contractorName: string;
  status: string;
  type: string;
  totalValue: number;
  paidAmount: number;
  startDate: string;
  endDate: string;
  managerId: string | null;
  managerName: string | null;
  projectId: string | null;
  projectName: string | null;
  completionPercent: number;
  tags: string[];
  workOrdersCount: number;
  documentsCount: number;
  createdAt: string;
}

export interface ApiWorkOrder {
  id: string;
  contractId: string;
  contractNumber: string;
  contractorName: string;
  title: string;
  description: string;
  status: string;
  amount: number;
  submittedAt: string;
  deadline: string;
  reviewedAt: string | null;
  reviewedByName: string | null;
  attachmentsCount: number;
  notes: string | null;
}

export interface ApiDocument {
  id: string;
  contractorId: string | null;
  contractId: string | null;
  contractorName: string | null;
  title: string;
  type: string;
  status: string;
  uploadedAt: string;
  expiresAt: string | null;
  uploadedByName: string | null;
  fileSizeBytes: number;
  fileName: string;
  notes: string | null;
}

export interface ApiPayment {
  id: string;
  contractId: string;
  contractNumber: string;
  contractorId: string;
  contractorName: string;
  workOrderId: string | null;
  amount: number;
  status: string;
  scheduledDate: string;
  paidDate: string | null;
  description: string;
  invoiceNumber: string | null;
  approvedByName: string | null;
  createdAt: string;
}

export interface ApiDashboardStats {
  activeContractors: number;
  activeContracts: number;
  pendingWorkOrders: number;
  overduePayments: number;
  totalContractValue: number;
  paidThisMonth: number;
  documentsExpiringSoon: number;
  contractsEndingSoon: number;
}

export interface ApiChartPoint {
  month: string;
  paid: number;
  scheduled: number;
}

export interface ApiActivityItem {
  id: string;
  type: string;
  action: string;
  subject: string;
  actor: string;
  timestamp: string;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface ApiAuthResponse {
  token: string;
  user: ApiUser;
}
