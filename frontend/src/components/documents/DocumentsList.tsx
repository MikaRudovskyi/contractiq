import React, { useState } from 'react';
import { Search, Upload, FileText, File, Shield, Receipt, ClipboardCheck } from 'lucide-react';
import { documentsApi } from '../../services/documentsApi';
import { useApiData } from '../../hooks/useApiData';
import { StatusBadge } from '../common/StatusBadge';
import { formatDate, fileSize, isExpiringSoon, isExpired } from '../../utils/format';
import { UploadDocumentForm } from './UploadDocumentForm';
import { ReviewDocumentForm } from './ReviewDocumentForm';
import type { Document, DocumentType } from '../../types';

const TYPE_LABELS: Record<DocumentType, string> = {
  contract: 'Договір', license: 'Ліцензія', insurance: 'Страхування',
  tax_certificate: 'Податкова довідка', work_order: 'Акт робіт',
  completion_act: 'Акт приймання', invoice: 'Рахунок', other: 'Інше',
};

const TYPE_ICONS: Record<DocumentType, React.ReactNode> = {
  contract: <FileText size={16} />, license: <Shield size={16} />,
  insurance: <Shield size={16} />, tax_certificate: <Receipt size={16} />,
  work_order: <ClipboardCheck size={16} />, completion_act: <ClipboardCheck size={16} />,
  invoice: <Receipt size={16} />, other: <File size={16} />,
};

export const DocumentsList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<Document | null>(null);

  const { data: documents, loading, error, refetch } = useApiData(
    () => documentsApi.list({
      search: search || undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
    }),
    [search, typeFilter]
  );

  const expiringSoonCount = (documents ?? []).filter(d => d.expiresAt && isExpiringSoon(d.expiresAt)).length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Документи</h1>
          <p className="page-subtitle">
            {documents ? `${documents.length} документів · ${expiringSoonCount} закінчуються незабаром` : 'Завантаження…'}
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setUploadOpen(true)}><Upload size={14} /> Завантажити документ</button>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <div className="input-wrap" style={{ flex: 1, maxWidth: 320 }}>
            <Search size={14} className="input-icon" />
            <input
              type="search"
              className="input-with-icon"
              style={{ width: '100%' }}
              placeholder="Пошук за назвою, підрядником…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="all">Всі типи</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {error ? (
          <div className="empty-state">
            <div className="empty-state-title" style={{ color: 'var(--danger)' }}>Помилка завантаження</div>
            <div className="empty-state-desc">{error}</div>
          </div>
        ) : loading ? (
          <div className="empty-state"><div className="empty-state-desc">Завантаження…</div></div>
        ) : !documents || documents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Search size={36} /></div>
            <div className="empty-state-title">Нічого не знайдено</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Документ</th>
                <th>Тип</th>
                <th>Підрядник</th>
                <th>Статус</th>
                <th>Термін дії</th>
                <th>Розмір</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(d => {
                const expSoon = d.expiresAt && isExpiringSoon(d.expiresAt);
                const exp = d.expiresAt && isExpired(d.expiresAt);
                return (
                  <tr key={d.id} onClick={() => setReviewTarget(d)}>
                    <td>
                      <div className="flex items-center gap-8">
                        <div style={{ color: 'var(--ink-40)' }}>{TYPE_ICONS[d.type]}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{d.title}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--ink-40)' }}>{d.fileName}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="tag">{TYPE_LABELS[d.type] ?? d.type}</span></td>
                    <td style={{ fontSize: 13 }}>{d.contractorName ?? '—'}</td>
                    <td><StatusBadge status={d.status} /></td>
                    <td>
                      {d.expiresAt ? (
                        <span className={`text-sm ${exp ? 'text-danger font-semibold' : expSoon ? 'text-warning font-semibold' : 'text-muted'}`}>
                          {formatDate(d.expiresAt)}
                        </span>
                      ) : <span className="text-muted text-sm">—</span>}
                    </td>
                    <td className="text-sm text-muted">{fileSize(d.fileSize)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <UploadDocumentForm open={uploadOpen} onClose={() => setUploadOpen(false)} onCreated={refetch} />
      <ReviewDocumentForm open={!!reviewTarget} onClose={() => setReviewTarget(null)} onUpdated={refetch} document={reviewTarget} />
    </div>
  );
};
