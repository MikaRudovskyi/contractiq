import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import {
  Users, FileText, ClipboardCheck, CreditCard,
  AlertTriangle, TrendingUp, FileWarning, CalendarClock,
  ArrowRight, DollarSign
} from 'lucide-react';
import { dashboardApi } from '../../services/dashboardApi';
import { contractsApi } from '../../services/contractsApi';
import { documentsApi } from '../../services/documentsApi';
import { useApiData } from '../../hooks/useApiData';
import { formatMoney, formatDateTime, formatDate, daysUntil } from '../../utils/format';

const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  iconColor: string;
  meta?: React.ReactNode;
}> = ({ label, value, icon, iconColor, meta }) => (
  <div className="stat-card">
    <div className="stat-card-header">
      <span className="stat-label">{label}</span>
      <div className={`stat-icon ${iconColor}`}>{icon}</div>
    </div>
    <div className="stat-value">{value}</div>
    {meta && <div className="stat-meta">{meta}</div>}
  </div>
);

const activityIconType = (type: string) => {
  if (type === 'payment') return <DollarSign size={13} />;
  if (type === 'document') return <FileText size={13} />;
  if (type === 'contract') return <FileText size={13} />;
  if (type === 'work_order') return <ClipboardCheck size={13} />;
  return <Users size={13} />;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white', border: '1px solid #E5E7EB',
      borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 6px rgba(0,0,0,.07)'
    }}>
      <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ fontSize: 12, color: p.color, display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <span>{p.name === 'paid' ? 'Оплачено' : 'Заплановано'}</span>
          <strong>{formatMoney(p.value)}</strong>
        </div>
      ))}
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { data: stats, loading: statsLoading, error: statsError } = useApiData(
    () => dashboardApi.getStats(), []
  );
  const { data: chartData, loading: chartLoading } = useApiData(
    () => dashboardApi.getPaymentsChart(6), []
  );
  const { data: activity, loading: activityLoading } = useApiData(
    () => dashboardApi.getActivity(10), []
  );
  const { data: contracts } = useApiData(
    () => contractsApi.list({ status: 'active' }), []
  );
  const { data: expiringDocs } = useApiData(
    () => documentsApi.list({ expiringSoon: true }), []
  );

  if (statsLoading) {
    return <div className="text-muted" style={{ padding: 40, textAlign: 'center' }}>Завантаження дашборду…</div>;
  }

  if (statsError || !stats) {
    return (
      <div className="alert-strip danger">
        <AlertTriangle size={15} />
        Не вдалося завантажити дані дашборду: {statsError ?? 'невідома помилка'}
      </div>
    );
  }

  const contractsEndingSoon = (contracts ?? [])
    .filter(c => daysUntil(c.endDate) <= 180)
    .sort((a, b) => daysUntil(a.endDate) - daysUntil(b.endDate))
    .slice(0, 3);

  return (
    <div>
      {stats.overduePayments > 0 && (
        <div className="alert-strip danger">
          <AlertTriangle size={15} />
          <strong>{stats.overduePayments} виплати прострочено</strong> — потребує термінової дії
        </div>
      )}
      {stats.documentsExpiringSoon > 0 && (
        <div className="alert-strip warning">
          <FileWarning size={15} />
          <strong>{stats.documentsExpiringSoon} документів</strong> закінчуються протягом 30 днів
        </div>
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Огляд</h1>
          <p className="page-subtitle">Поточний стан по всіх проєктах та підрядниках</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Активних підрядників"
          value={stats.activeContractors}
          icon={<Users size={16} />}
          iconColor="blue"
          meta={<span><span className="highlight">{stats.contractsEndingSoon}</span> договори закінчуються незабаром</span>}
        />
        <StatCard
          label="Активних договорів"
          value={stats.activeContracts}
          icon={<FileText size={16} />}
          iconColor="cyan"
          meta={<span>Загальна вартість: <span className="highlight">{formatMoney(stats.totalContractValue)}</span></span>}
        />
        <StatCard
          label="Акти на розгляді"
          value={stats.pendingWorkOrders}
          icon={<ClipboardCheck size={16} />}
          iconColor="amber"
          meta="Очікують підтвердження"
        />
        <StatCard
          label="Прострочені виплати"
          value={stats.overduePayments}
          icon={<CreditCard size={16} />}
          iconColor="red"
          meta={<span className="danger">Потребує негайної дії</span>}
        />
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Виплати за 6 місяців</span>
            <TrendingUp size={15} style={{ color: 'var(--ink-40)' }} />
          </div>
          <div className="card-body">
            {chartLoading || !chartData ? (
              <div className="text-muted text-center" style={{ padding: 40 }}>Завантаження графіка…</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barSize={20} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={false} tickLine={false}
                    tickFormatter={(v) => `${v / 1_000_000}M`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle" iconSize={8}
                    formatter={(v) => v === 'paid' ? 'Оплачено' : 'Заплановано'}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="scheduled" fill="#EFF6FF" stroke="#BFDBFE" radius={[4,4,0,0]} />
                  <Bar dataKey="paid" fill="#2563EB" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Останні дії</span>
            <button className="btn btn-ghost btn-sm" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              Всі <ArrowRight size={12} />
            </button>
          </div>
          <div className="card-body" style={{ padding: '8px 20px' }}>
            {activityLoading || !activity ? (
              <div className="text-muted text-center" style={{ padding: 20 }}>Завантаження…</div>
            ) : activity.length === 0 ? (
              <div className="text-muted text-center" style={{ padding: 20 }}>Поки немає активності</div>
            ) : activity.map((item) => (
              <div key={item.id} className="activity-item">
                <div className={`activity-dot ${item.type}`}>
                  {activityIconType(item.type)}
                </div>
                <div className="activity-body">
                  <div className="activity-action">
                    <strong>{item.subject}</strong>
                    {' — '}
                    <span style={{ color: 'var(--ink-60)' }}>{item.action}</span>
                  </div>
                  <div className="activity-meta">{item.actor} · {formatDateTime(item.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20, marginTop: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Договори закінчуються</span>
            <CalendarClock size={15} style={{ color: 'var(--ink-40)' }} />
          </div>
          <div style={{ padding: '0 0' }}>
            {contractsEndingSoon.length === 0 ? (
              <div className="text-muted text-center" style={{ padding: 20 }}>Немає договорів, що скоро закінчуються</div>
            ) : (
              <table style={{ width: '100%' }}>
                <tbody>
                  {contractsEndingSoon.map((c) => {
                    const days = daysUntil(c.endDate);
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--ink-10)' }}>
                        <td style={{ padding: '11px 16px' }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>№{c.number}</div>
                          <div style={{ fontSize: 12, color: 'var(--ink-40)' }}>{c.contractorName}</div>
                        </td>
                        <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                          <div style={{ fontSize: 13 }}>{formatDate(c.endDate)}</div>
                          <div style={{ fontSize: 11, color: days < 60 ? 'var(--warning)' : 'var(--ink-40)' }}>
                            {days} дн.
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Документи закінчуються</span>
            <span className="badge amber">{stats.documentsExpiringSoon} документів</span>
          </div>
          <div style={{ padding: '0 0' }}>
            {!expiringDocs || expiringDocs.length === 0 ? (
              <div className="text-muted text-center" style={{ padding: 20 }}>Немає документів, що скоро закінчуються</div>
            ) : (
              <table style={{ width: '100%' }}>
                <tbody>
                  {expiringDocs.slice(0, 5).map((d) => {
                    const days = d.expiresAt ? daysUntil(d.expiresAt) : 999;
                    return (
                      <tr key={d.id} style={{ borderBottom: '1px solid var(--ink-10)' }}>
                        <td style={{ padding: '11px 16px' }}>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{d.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-40)' }}>{d.contractorName ?? '—'}</div>
                        </td>
                        <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                          <span className={`badge ${days <= 14 ? 'red' : 'amber'}`}>
                            {d.expiresAt ? formatDate(d.expiresAt) : '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
