import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { paymentsApi } from '../../services/paymentsApi';
import { ApiError } from '../../services/apiClient';
import { formatMoneyFull } from '../../utils/format';
import type { Payment } from '../../types';

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Заплановано' },
  { value: 'processing', label: 'В обробці' },
  { value: 'paid', label: 'Оплачено' },
  { value: 'overdue', label: 'Прострочено' },
  { value: 'disputed', label: 'Суперечка' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  payment: Payment | null;
}

export const EditPaymentForm: React.FC<Props> = ({ open, onClose, onUpdated, payment }) => {
  const [status, setStatus] = useState('scheduled');
  const [paidDate, setPaidDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (payment) {
      setStatus(payment.status);
      setPaidDate(payment.paidDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
    }
  }, [payment]);

  if (!payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await paymentsApi.updateStatus(payment.id, status, status === 'paid' ? paidDate : undefined);
      onUpdated();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не вдалося оновити статус виплати');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Виплата" width={460}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-12">
        {error && <div className="alert-strip danger">{error}</div>}

        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{payment.description}</div>
          <div className="text-sm text-muted">№{payment.contractNumber} · {payment.contractorName}</div>
          <div className="money large mt-4">{formatMoneyFull(payment.amount)}</div>
        </div>

        <div>
          <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Статус</label>
          <select style={{ width: '100%' }} value={status} onChange={e => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {status === 'paid' && (
          <div>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Дата оплати</label>
            <input type="date" style={{ width: '100%' }} value={paidDate} onChange={e => setPaidDate(e.target.value)} />
          </div>
        )}

        <div className="flex gap-8 mt-8" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Скасувати</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Збереження…' : 'Зберегти'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
