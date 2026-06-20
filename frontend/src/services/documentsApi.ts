import { api, downloadFile } from './apiClient';
import { toUiStatus } from '../utils/statusCase';
import type { ApiDocument } from './apiTypes';
import type { Document } from '../types';

function mapDocument(d: ApiDocument): Document {
  return {
    id: d.id,
    contractorId: d.contractorId ?? undefined,
    contractId: d.contractId ?? undefined,
    contractorName: d.contractorName ?? undefined,
    title: d.title,
    type: toUiStatus(d.type) as Document['type'],
    status: toUiStatus(d.status) as Document['status'],
    uploadedAt: d.uploadedAt,
    expiresAt: d.expiresAt ?? undefined,
    uploadedBy: d.uploadedByName ?? '',
    fileSize: d.fileSizeBytes,
    fileName: d.fileName,
    notes: d.notes ?? undefined,
  };
}

export interface DocumentFilters {
  type?: string;
  search?: string;
  expiringSoon?: boolean;
  contractorId?: string;
}

export const documentsApi = {
  async list(filters: DocumentFilters = {}): Promise<Document[]> {
    const data = await api.get<ApiDocument[]>('/documents', { ...filters });
    return data.map(mapDocument);
  },

  async getById(id: string): Promise<Document> {
    const data = await api.get<ApiDocument>(`/documents/${id}`);
    return mapDocument(data);
  },

  async upload(payload: {
    file: File;
    title: string;
    type: string;
    contractorId?: string;
    contractId?: string;
    expiresAt?: string;
    notes?: string;
  }): Promise<Document> {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('title', payload.title);
    formData.append('type', payload.type);
    if (payload.contractorId) formData.append('contractorId', payload.contractorId);
    if (payload.contractId) formData.append('contractId', payload.contractId);
    if (payload.expiresAt) formData.append('expiresAt', payload.expiresAt);
    if (payload.notes) formData.append('notes', payload.notes);

    const data = await api.uploadFile<ApiDocument>('/documents/upload', formData);
    return mapDocument(data);
  },

  async download(id: string, fileName: string): Promise<void> {
    const blob = await downloadFile(`/documents/${id}/download`);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  },

  async approve(id: string): Promise<Document> {
    const data = await api.post<ApiDocument>(`/documents/${id}/review`, { decision: 'approve' });
    return mapDocument(data);
  },

  async reject(id: string): Promise<Document> {
    const data = await api.post<ApiDocument>(`/documents/${id}/review`, { decision: 'reject' });
    return mapDocument(data);
  },
};
