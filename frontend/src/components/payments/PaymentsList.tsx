import React, { useState, useMemo } from 'react';
import { Search, Plus, AlertTriangle } from 'lucide-react';
import { paymentsApi } from '../../services/paymentsApi';
import { useApiData } from '../../hooks/useApiData';
import { StatusBadge } from '../common/StatusBadge';
import { formatMoneyFull, formatDate, daysUntil } from '../../utils/format';
import { CreatePaymentForm } from './CreatePaymentForm';
import { EditPaymentForm } from './EditPaymentForm';
import type { Payment } from '../../types';

const STATUSES = ['all', 'scheduled', 'processing', 'paid', 'overdue', 'disputed'];
const STATUS_LABELS: Record<string, string> = {
  all: 'Всі статуси', scheduled: 'Заплановані', processing: 'В обробці',
  paid: 'Оплачені', overdue: 'Прострочені', disputed: 'Суперечки',
};

export const PaymentsList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Payment | null>(null);

  const { data: payments, loading, error, refetch } = useApiData(
    () => paymentsApi.list({
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    [search, statusFilter]
  );

  const { overdueAmount, scheduledAmount, paidAmount } = useMemo(() => {
    const list = payments ?? [];
    return {
      overdueAmount: list.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0),
      scheduledAmount: list.filter(p => p.status === 'scheduled').reduce((s, p) => s + p.amount, 0),
      paidAmount: list.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    };
  }, [payments]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Виплати</h1>
          <p className="page-subtitle">{payments ? `${payments.length} записів за поточний період` : 'Завантаження…'}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}><Plus size={14} /> Запланувати виплату</button>
        </div>
      </div>

      {overdueAmount > 0 && (
        <div className="alert-strip danger">
          <AlertTriangle size={15} />
          Прострочено виплат на суму <strong>{formatMoneyFull(overdueAmount)}</strong> — рекомендуємо обробити сьогодні
        </div>
      )}

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 16 }}>
        <div className="stat-card">
          <span className="stat-label">До сплати (заплановано)</span>
          <span className="stat-value" style={{ fontSize: 20 }}>{formatMoneyFull(scheduledAmount)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Прострочено</span>
          <span className="stat-value" style={{ fontSize: 20, color: 'var(--danger)' }}>{formatMoneyFull(overdueAmount)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Оплачено цього місяця</span>
          <span className="stat-value" style={{ fontSize: 20, color: 'var(--success)' }}>{formatMoneyFull(paidAmount)}</span>
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
              placeholder="Пошук за рахунком, договором, підрядником…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>

        {error ? (
          <div className="empty-state">
            <div className="empty-state-title" style={{ color: 'var(--danger)' }}>Помилка завантаження</div>
            <div className="empty-state-desc">{error}</div>
          </div>
        ) : loading ? (
          <div className="empty-state"><div className="empty-state-desc">Завантаження…</div></div>
        ) : !payments || payments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Search size={36} /></div>
            <div className="empty-state-title">Нічого не знайдено</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Рахунок / Опис</th>
                <th>Підрядник</th>
                <th>Договір</th>
                <th>Сума</th>
                <th>Статус</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => {
                const isOverdue = p.status === 'overdue';
                return (
                  <tr key={p.id} onClick={() => setEditTarget(p)}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.invoiceNumber ?? '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-40)', maxWidth: 280, marginTop: 1 }}>{p.description}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{p.contractorName}</td>
                    <td className="td-mono">№{p.contractNumber}</td>
                    <td className="money large">{formatMoneyFull(p.amount)}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>
                      <div style={{ fontSize: 12.5, color: isOverdue ? 'var(--danger)' : 'var(--ink-60)', fontWeight: isOverdue ? 600 : 400 }}>
                        {p.paidDate ? formatDate(p.paidDate) : formatDate(p.scheduledDate)}
                      </div>
                      {isOverdue && (
                        <div style={{ fontSize: 11, color: 'var(--danger)' }}>
                          {Math.abs(daysUntil(p.scheduledDate))} дн. простроч.
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <CreatePaymentForm open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refetch} />
      <EditPaymentForm open={!!editTarget} onClose={() => setEditTarget(null)} onUpdated={refetch} payment={editTarget} />
    </div>
  );
};
