import React, { useState } from 'react';
import { Check, X, Paperclip, Clock, Plus } from 'lucide-react';
import { workOrdersApi } from '../../services/workOrdersApi';
import { useApiData } from '../../hooks/useApiData';
import { StatusBadge } from '../common/StatusBadge';
import { formatMoney, formatDate, daysUntil } from '../../utils/format';
import { CreateWorkOrderForm } from './CreateWorkOrderForm';
import type { WorkOrderStatus } from '../../types';

const COLUMNS: { key: WorkOrderStatus; label: string }[] = [
  { key: 'open', label: 'На розгляді' },
  { key: 'review', label: 'Перевірка' },
  { key: 'accepted', label: 'Прийнято' },
  { key: 'rejected', label: 'Відхилено' },
];

export const WorkOrdersBoard: React.FC = () => {
  const [view, setView] = useState<'board' | 'list'>('board');
  const [createOpen, setCreateOpen] = useState(false);
  const { data: workOrders, loading, error, refetch } = useApiData(
    () => workOrdersApi.list(), []
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleAccept = async (id: string) => {
    setBusyId(id);
    setActionError(null);
    try {
      await workOrdersApi.accept(id);
      refetch();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Не вдалося прийняти акт');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    const notes = window.prompt('Вкажіть причину відхилення (мінімум 10 символів):');
    if (!notes) return;
    setBusyId(id);
    setActionError(null);
    try {
      await workOrdersApi.reject(id, notes);
      refetch();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Не вдалося відхилити акт');
    } finally {
      setBusyId(null);
    }
  };

  const items = workOrders ?? [];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Акти виконаних робіт</h1>
          <p className="page-subtitle">
            {workOrders
              ? `${items.length} актів · ${items.filter(w => w.status === 'open' || w.status === 'review').length} очікують дії`
              : 'Завантаження…'}
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}><Plus size={14} /> Новий акт</button>
        </div>
      </div>

      {actionError && (
        <div className="alert-strip danger" style={{ marginBottom: 16 }}>
          {actionError}
        </div>
      )}

      <div className="tabs">
        <span className={`tab-item ${view === 'board' ? 'active' : ''}`} onClick={() => setView('board')}>Канбан</span>
        <span className={`tab-item ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>Список</span>
      </div>

      {error ? (
        <div className="empty-state">
          <div className="empty-state-title" style={{ color: 'var(--danger)' }}>Помилка завантаження</div>
          <div className="empty-state-desc">{error}</div>
        </div>
      ) : loading ? (
        <div className="empty-state"><div className="empty-state-desc">Завантаження…</div></div>
      ) : view === 'board' ? (
        <div className="kanban-board">
          {COLUMNS.map(col => {
            const colItems = items.filter(w => w.status === col.key);
            return (
              <div key={col.key}>
                <div className="flex items-center justify-between mb-16" style={{ padding: '0 4px' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-60)', textTransform: 'uppercase', letterSpacing: '.4px' }}>
                    {col.label}
                  </span>
                  <span className="tag">{colItems.length}</span>
                </div>
                <div className="flex flex-col gap-12">
                  {colItems.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink-20)', fontSize: 12, border: '1px dashed var(--ink-10)', borderRadius: 8 }}>
                      Порожньо
                    </div>
                  ) : colItems.map(wo => {
                    const dleft = daysUntil(wo.deadline);
                    const isBusy = busyId === wo.id;
                    return (
                      <div key={wo.id} className="card" style={{ padding: 14, boxShadow: 'var(--shadow-xs)', opacity: isBusy ? 0.5 : 1 }}>
                        <div style={{ fontSize: 11.5, color: 'var(--ink-40)', fontFamily: 'var(--font-mono)' }}>
                          №{wo.contractNumber}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, lineHeight: 1.35 }}>
                          {wo.title}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ink-40)', marginTop: 4 }}>
                          {wo.contractorName}
                        </div>

                        <div className="flex items-center justify-between mt-12">
                          <span className="money" style={{ fontSize: 13 }}>{formatMoney(wo.amount)}</span>
                          <span className="flex items-center gap-4 text-sm text-muted">
                            <Paperclip size={11} /> {wo.attachments}
                          </span>
                        </div>

                        {wo.notes && (
                          <div style={{ marginTop: 8, padding: 8, background: 'var(--danger-bg)', borderRadius: 6, fontSize: 11.5, color: 'var(--danger)' }}>
                            {wo.notes}
                          </div>
                        )}

                        <div className="divider" style={{ margin: '10px 0' }} />

                        <div className="flex items-center justify-between">
                          <span className={`flex items-center gap-4 text-sm ${dleft < 3 ? 'text-danger' : 'text-muted'}`}>
                            <Clock size={11} /> {dleft >= 0 ? `${dleft} дн.` : 'просрочено'}
                          </span>
                          {(col.key === 'open' || col.key === 'review') && (
                            <div className="flex gap-4">
                              <button
                                className="btn btn-icon btn-secondary"
                                style={{ color: 'var(--success)' }}
                                title="Прийняти"
                                disabled={isBusy}
                                onClick={() => handleAccept(wo.id)}
                              >
                                <Check size={13} />
                              </button>
                              <button
                                className="btn btn-icon btn-secondary"
                                style={{ color: 'var(--danger)' }}
                                title="Відхилити"
                                disabled={isBusy}
                                onClick={() => handleReject(wo.id)}
                              >
                                <X size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Акт</th>
                <th>Договір</th>
                <th>Підрядник</th>
                <th>Сума</th>
                <th>Статус</th>
                <th>Подано</th>
                <th>Дедлайн</th>
              </tr>
            </thead>
            <tbody>
              {items.map(wo => (
                <tr key={wo.id}>
                  <td style={{ maxWidth: 260 }}>{wo.title}</td>
                  <td className="td-mono">№{wo.contractNumber}</td>
                  <td>{wo.contractorName}</td>
                  <td className="money">{formatMoney(wo.amount)}</td>
                  <td><StatusBadge status={wo.status} /></td>
                  <td className="text-sm text-muted">{formatDate(wo.submittedAt)}</td>
                  <td className="text-sm text-muted">{formatDate(wo.deadline)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateWorkOrderForm open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refetch} />
    </div>
  );
};