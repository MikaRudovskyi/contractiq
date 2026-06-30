import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import { contractorsApi } from '../../services/contractorsApi';
import { useApiData } from '../../hooks/useApiData';
import { formatMoney } from '../../utils/format';

const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#a855f7'];

const CAT_LABELS: Record<string, string> = {
  construction: 'Будівництво', electrical: 'Електрика', plumbing: 'Сантехніка',
  hvac: 'HVAC', it: 'IT', logistics: 'Логістика', cleaning: 'Прибирання',
  security: 'Охорона', design: 'Дизайн', other: 'Інше',
};

export const Analytics: React.FC = () => {
  const { data: contractors, loading, error } = useApiData(
    () => contractorsApi.list(), []
  );

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    (contractors ?? []).forEach(c => {
      map[c.category] = (map[c.category] ?? 0) + c.totalPaid;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [contractors]);

  const sortedByRating = useMemo(
    () => [...(contractors ?? [])].sort((a, b) => b.rating - a.rating),
    [contractors]
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Аналітика</h1>
          <p className="page-subtitle">Розподіл витрат і ефективність підрядників</p>
        </div>
      </div>

      {error ? (
        <div className="alert-strip danger">Не вдалося завантажити дані: {error}</div>
      ) : loading || !contractors ? (
        <div className="text-muted" style={{ padding: 40, textAlign: 'center' }}>Завантаження…</div>
      ) : (
        <div className="grid-2" style={{ gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Витрати за категоріями</span>
              <BarChart3 size={15} style={{ color: 'var(--ink-40)' }} />
            </div>
            <div className="card-body">
              {categoryData.length === 0 ? (
                <div className="text-muted text-center" style={{ padding: 40 }}>Немає даних про витрати</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => formatMoney(Number(v))}
                      contentStyle={{
                        background: 'rgba(17,20,37,.95)', border: '1px solid rgba(255,255,255,.12)',
                        borderRadius: 10, backdropFilter: 'blur(10px)'
                      }}
                      itemStyle={{ color: '#e8eaf6' }}
                      labelStyle={{ color: '#e8eaf6' }}
                    />
                    <Legend
                      formatter={(v) => CAT_LABELS[v] ?? v}
                      wrapperStyle={{ fontSize: 12, color: 'rgba(232,234,246,.6)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Рейтинг підрядників</span>
            </div>
            <div className="card-body" style={{ padding: '8px 20px' }}>
              {sortedByRating.length === 0 ? (
                <div className="text-muted text-center" style={{ padding: 20 }}>Немає підрядників</div>
              ) : sortedByRating.map(c => (
                <div key={c.id} className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--ink-05)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                    <div className="text-sm text-muted">{CAT_LABELS[c.category] ?? c.category}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: c.rating >= 4 ? 'var(--success)' : c.rating >= 3 ? 'var(--warning)' : 'var(--danger)' }}>
                    {c.rating > 0 ? c.rating.toFixed(1) : '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};