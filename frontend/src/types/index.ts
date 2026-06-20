export type ContractorStatus = 'active' | 'suspended' | 'pending' | 'blacklisted';
export type ContractStatus = 'draft' | 'active' | 'completed' | 'disputed' | 'terminated';
export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type PaymentStatus = 'scheduled' | 'processing' | 'paid' | 'overdue' | 'disputed';
export type WorkOrderStatus = 'open' | 'in_progress' | 'review' | 'accepted' | 'rejected';
export type UserRole = 'admin' | 'manager' | 'viewer' | 'finance';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Contractor {
  id: string;
  name: string;
  legalName: string;
  code: string; // ЄДРПОУ / tax code
  status: ContractorStatus;
  category: ContractorCategory;
  tags: string[];
  contactPerson: string;
  email: string;
  phone: string;
  rating: number; // 1-5
  activeContracts: number;
  totalPaid: number;
  pendingAmount: number;
  documentsExpiring: number;
  createdAt: string;
  region: string;
  notes?: string;
}

export type ContractorCategory =
  | 'construction'
  | 'electrical'
  | 'plumbing'
  | 'hvac'
  | 'it'
  | 'logistics'
  | 'cleaning'
  | 'security'
  | 'design'
  | 'other';

export interface Contract {
  id: string;
  number: string;
  title: string;
  contractorId: string;
  contractorName: string;
  status: ContractStatus;
  type: 'fixed' | 'time_material' | 'milestone';
  totalValue: number;
  paidAmount: number;
  startDate: string;
  endDate: string;
  managerId: string;
  managerName: string;
  projectId?: string;
  projectName?: string;
  completionPercent: number;
  tags: string[];
  workOrdersCount: number;
  documentsCount: number;
  createdAt: string;
}

export interface WorkOrder {
  id: string;
  contractId: string;
  contractNumber: string;
  contractorName: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  amount: number;
  submittedAt: string;
  deadline: string;
  reviewedAt?: string;
  reviewedBy?: string;
  attachments: number;
  notes?: string;
}

export interface Document {
  id: string;
  contractorId?: string;
  contractId?: string;
  contractorName?: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  uploadedAt: string;
  expiresAt?: string;
  uploadedBy: string;
  fileSize: number;
  fileName: string;
  notes?: string;
}

export type DocumentType =
  | 'contract'
  | 'license'
  | 'insurance'
  | 'tax_certificate'
  | 'work_order'
  | 'completion_act'
  | 'invoice'
  | 'other';

export interface Payment {
  id: string;
  contractId: string;
  contractNumber: string;
  contractorId: string;
  contractorName: string;
  workOrderId?: string;
  amount: number;
  status: PaymentStatus;
  scheduledDate: string;
  paidDate?: string;
  description: string;
  invoiceNumber?: string;
  approvedBy?: string;
  createdAt: string;
}

export interface DashboardStats {
  activeContractors: number;
  activeContracts: number;
  pendingWorkOrders: number;
  overduePayments: number;
  totalContractValue: number;
  paidThisMonth: number;
  documentsExpiringSoon: number;
  contractsEndingSoon: number;
}

export interface ChartDataPoint {
  month: string;
  paid: number;
  scheduled: number;
}

export interface ActivityItem {
  id: string;
  type: 'payment' | 'document' | 'contract' | 'work_order' | 'contractor';
  action: string;
  subject: string;
  actor: string;
  timestamp: string;
  link?: string;
}

export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  search: string;
  status: string[];
  category: string[];
  dateFrom: string;
  dateTo: string;
  tags: string[];
}
