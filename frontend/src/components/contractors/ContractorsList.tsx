import React, { useState, useMemo } from 'react';
import { UserPlus, Search, Filter, Download } from 'lucide-react';
import { contractorsApi } from '../../services/contractorsApi';
import { useApiData } from '../../hooks/useApiData';
import { StatusBadge } from '../common/StatusBadge';
import { Rating } from '../common/Rating';
import { formatMoney } from '../../utils/format';
import { CreateContractorForm } from './CreateContractorForm';
import { EditContractorForm } from './EditContractorForm';
import type { Contractor, ContractorCategory } from '../../types';

const CATEGORIES: Record<ContractorCategory | 'all', string> = {
  all: 'Всі категорії',
  construction: 'Будівництво',
  electrical: 'Електрика',
  plumbing: 'Сантехніка',
  hvac: 'HVAC',
  it: 'IT',
  logistics: 'Логістика',
  cleaning: 'Прибирання',
  security: 'Охорона',
  design: 'Дизайн',
  other: 'Інше',
};

const STATUSES = ['all', 'active', 'pending', 'suspended', 'blacklisted'];
const STATUS_LABELS: Record<string, string> = {
  all: 'Всі статуси', active: 'Активні', pending: 'Очікують',
  suspended: 'Призупинені', blacklisted: 'Заблоковані',
};

export const ContractorsList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Contractor | null>(null);

  const { data: contractors, loading, error, refetch } = useApiData(
    () => contractorsApi.list({
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
    }),
    [search, statusFilter, categoryFilter]
  );

  const activeCount = useMemo(
    () => (contractors ?? []).filter(c => c.status === 'active').length,
    [contractors]
  );

  const handleExport = () => {
    const list = contractors ?? [];
    if (list.length === 0) return;

    const headers = ['Назва', 'ЄДРПОУ/ІПН', 'Статус', 'Категорія', 'Контактна особа', 'Email', 'Телефон', 'Виплачено', 'Очікує виплати', 'Рейтинг'];
    const rows = list.map(c => [
      c.name, c.code, c.status, c.category, c.contactPerson, c.email, c.phone,
      c.totalPaid.toString(), c.pendingAmount.toString(), c.rating.toString(),
    ]);

    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contractors_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Підрядники</h1>
          <p className="page-subtitle">
            {contractors ? `${contractors.length} підрядників у системі · ${activeCount} активних` : 'Завантаження…'}
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={14} /> Експорт
          </button>
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <UserPlus size={14} /> Додати підрядника
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
              placeholder="Пошук за назвою, ЄДРПОУ, контактом…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>

          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>

          <button className="btn btn-ghost btn-sm">
            <Filter size={13} /> Фільтри
          </button>
        </div>

        {error ? (
          <div className="empty-state">
            <div className="empty-state-title" style={{ color: 'var(--danger)' }}>Помилка завантаження</div>
            <div className="empty-state-desc">{error}</div>
          </div>
        ) : loading ? (
          <div className="empty-state">
            <div className="empty-state-desc">Завантаження…</div>
          </div>
        ) : !contractors || contractors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Search size={36} /></div>
            <div className="empty-state-title">Нічого не знайдено</div>
            <div className="empty-state-desc">Спробуйте змінити пошуковий запит або фільтри</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Підрядник</th>
                <th>Статус</th>
                <th>Категорія</th>
                <th>Договори</th>
                <th>Виплачено</th>
                <th>Очікує виплати</th>
                <th>Рейтинг</th>
                <th>Документи</th>
              </tr>
            </thead>
            <tbody>
              {contractors.map(c => (
                <tr key={c.id} onClick={() => setEditTarget(c)}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-40)', marginTop: 1 }}>
                      ЄДРПОУ {c.code} · {c.contactPerson}
                    </div>
                  </td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    <span className="tag">{CATEGORIES[c.category]}</span>
                  </td>
                  <td className="td-mono" style={{ textAlign: 'center' }}>{c.activeContracts}</td>
                  <td>
                    <span className="money">{formatMoney(c.totalPaid)}</span>
                  </td>
                  <td>
                    {c.pendingAmount > 0
                      ? <span className="money" style={{ color: 'var(--warning)' }}>{formatMoney(c.pendingAmount)}</span>
                      : <span style={{ color: 'var(--ink-20)' }}>—</span>}
                  </td>
                  <td><Rating value={c.rating} /></td>
                  <td>
                    {c.documentsExpiring > 0
                      ? <span className="badge amber"><span className="badge-dot" />{c.documentsExpiring} закінч.</span>
                      : <span style={{ color: 'var(--ink-20)', fontSize: 12 }}>ОК</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CreateContractorForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refetch}
      />
      <EditContractorForm
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onUpdated={refetch}
        contractor={editTarget}
      />
    </div>
  );
};
