import React, { useState, useMemo } from 'react';
import { FilePlus, Search } from 'lucide-react';
import { contractsApi } from '../../services/contractsApi';
import { useApiData } from '../../hooks/useApiData';
import { StatusBadge } from '../common/StatusBadge';
import { formatMoney, formatDate } from '../../utils/format';
import { CreateContractForm } from './CreateContractForm';
import { EditContractForm } from './EditContractForm';
import type { Contract } from '../../types';

const STATUSES = ['all', 'draft', 'active', 'completed', 'disputed', 'terminated'];
const STATUS_LABELS: Record<string, string> = {
  all: 'Всі статуси', draft: 'Чернетки', active: 'Активні',
  completed: 'Завершені', disputed: 'Суперечки', terminated: 'Розірвані',
};

const TYPE_LABELS: Record<string, string> = {
  fixed: 'Фіксована ціна',
  time_material: 'Час і матеріали',
  milestone: 'По етапах',
};

export const ContractsList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Contract | null>(null);

  const { data: contracts, loading, error, refetch } = useApiData(
    () => contractsApi.list({
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    [search, statusFilter]
  );

  const { totalValue, totalPaid } = useMemo(() => {
    const list = contracts ?? [];
    return {
      totalValue: list.reduce((s, c) => s + c.totalValue, 0),
      totalPaid: list.reduce((s, c) => s + c.paidAmount, 0),
    };
  }, [contracts]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Договори</h1>
          <p className="page-subtitle">
            {contracts
              ? `${contracts.length} договорів · загальна вартість ${formatMoney(totalValue)} · оплачено ${formatMoney(totalPaid)}`
              : 'Завантаження…'}
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <FilePlus size={14} /> Новий договір
          </button>
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
              placeholder="Пошук за номером, назвою, підрядником…"
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
        ) : !contracts || contracts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Search size={36} /></div>
            <div className="empty-state-title">Нічого не знайдено</div>
            <div className="empty-state-desc">Спробуйте змінити пошуковий запит або фільтри, або створіть перший договір</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Договір</th>
                <th>Підрядник</th>
                <th>Тип</th>
                <th>Статус</th>
                <th>Прогрес</th>
                <th>Вартість</th>
                <th>Термін</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map(c => (
                <tr key={c.id} onClick={() => setEditTarget(c)}>
                  <td>
                    <div className="td-mono" style={{ fontWeight: 600, color: 'var(--ink)' }}>№{c.number}</div>
                    <div style={{ fontSize: 12.5, marginTop: 2, maxWidth: 280 }}>{c.title}</div>
                    {c.projectName && (
                      <span className="tag" style={{ marginTop: 4, display: 'inline-flex' }}>{c.projectName}</span>
                    )}
                  </td>
                  <td style={{ fontSize: 13 }}>{c.contractorName}</td>
                  <td><span className="tag">{TYPE_LABELS[c.type] ?? c.type}</span></td>
                  <td><StatusBadge status={c.status} /></td>
                  <td style={{ minWidth: 120 }}>
                    <div className="flex items-center gap-8">
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div
                          className={`progress-fill ${c.completionPercent === 100 ? 'success' : ''}`}
                          style={{ width: `${c.completionPercent}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted">{c.completionPercent}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="money">{formatMoney(c.totalValue)}</div>
                    <div className="text-sm text-muted">сплачено {formatMoney(c.paidAmount)}</div>
                  </td>
                  <td style={{ fontSize: 12.5, color: 'var(--ink-40)' }}>
                    {formatDate(c.startDate)}<br/>— {formatDate(c.endDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CreateContractForm open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refetch} />
      <EditContractForm open={!!editTarget} onClose={() => setEditTarget(null)} onUpdated={refetch} contract={editTarget} />
    </div>
  );
};
