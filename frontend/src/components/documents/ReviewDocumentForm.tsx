import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Modal } from '../common/Modal';
import { documentsApi } from '../../services/documentsApi';
import { ApiError } from '../../services/apiClient';
import { StatusBadge } from '../common/StatusBadge';
import { formatDate, fileSize } from '../../utils/format';
import type { Document } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  document: Document | null;
}

export const ReviewDocumentForm: React.FC<Props> = ({ open, onClose, onUpdated, document }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!document) return null;

  const handleDownload = async () => {
    setError(null);
    try {
      await documentsApi.download(document.id, document.fileName);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не вдалося завантажити файл');
    }
  };

  const handleDecision = async (decision: 'approve' | 'reject') => {
    setError(null);
    setSubmitting(true);
    try {
      if (decision === 'approve') await documentsApi.approve(document.id);
      else await documentsApi.reject(document.id);
      onUpdated();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не вдалося оновити статус документа');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={document.title} width={460}>
      <div className="flex flex-col gap-12">
        {error && <div className="alert-strip danger">{error}</div>}

        <div className="flex items-center justify-between">
          <span className="text-muted text-sm">Підрядник</span>
          <span className="font-medium">{document.contractorName ?? '—'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted text-sm">Файл</span>
          <span className="font-medium">{document.fileName} ({fileSize(document.fileSize)})</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted text-sm">Завантажено</span>
          <span className="font-medium">{formatDate(document.uploadedAt)}</span>
        </div>
        {document.expiresAt && (
          <div className="flex items-center justify-between">
            <span className="text-muted text-sm">Термін дії</span>
            <span className="font-medium">{formatDate(document.expiresAt)}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-muted text-sm">Поточний статус</span>
          <StatusBadge status={document.status} />
        </div>

        {document.notes && (
          <div className="text-sm text-muted" style={{ padding: 8, background: 'var(--ink-05)', borderRadius: 6 }}>
            {document.notes}
          </div>
        )}

        <div className="divider" />

        <div className="flex gap-8" style={{ justifyContent: 'space-between' }}>
          <button type="button" className="btn btn-secondary" onClick={handleDownload}>
            <Download size={14} /> Завантажити файл
          </button>
          <div className="flex gap-8">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Закрити</button>
            <button
              type="button" className="btn btn-danger" disabled={submitting}
              onClick={() => handleDecision('reject')}
            >
              Відхилити
            </button>
            <button
              type="button" className="btn btn-primary" disabled={submitting}
              onClick={() => handleDecision('approve')}
            >
              Затвердити
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
