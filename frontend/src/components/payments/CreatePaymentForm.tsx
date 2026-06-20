import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { paymentsApi } from '../../services/paymentsApi';
import { contractsApi } from '../../services/contractsApi';
import { useApiData } from '../../hooks/useApiData';
import { ApiError } from '../../services/apiClient';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const emptyForm = { contractId: '', amount: '', scheduledDate: '', description: '', invoiceNumber: '' };

export const CreatePaymentForm: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: contracts } = useApiData(
    () => contractsApi.list({ status: 'active' }),
    [open]
  );

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const selectedContract = (contracts ?? []).find(c => c.id === form.contractId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.contractId || !form.amount || !form.scheduledDate || !form.description) {
      setError('Заповніть усі обов\'язкові поля');
      return;
    }

    if (!selectedContract) {
      setError('Оберіть договір');
      return;
    }

    setSubmitting(true);
    try {
      await paymentsApi.create({
        contractId: form.contractId,
        contractorId: selectedContract.contractorId,
        amount: Number(form.amount),
        scheduledDate: form.scheduledDate,
        description: form.description,
        invoiceNumber: form.invoiceNumber || undefined,
      });
      setForm(emptyForm);
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не вдалося запланувати виплату');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Запланувати виплату" width={520}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-12">
        {error && <div className="alert-strip danger">{error}</div>}

        <div>
          <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Договір *</label>
          <select style={{ width: '100%' }} value={form.contractId} onChange={set('contractId')} required>
            <option value="">Оберіть договір…</option>
            {(contracts ?? []).map(c => (
              <option key={c.id} value={c.id}>№{c.number} — {c.contractorName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Опис *</label>
          <input type="text" style={{ width: '100%' }} value={form.description} onChange={set('description')}
            placeholder="Оплата за акт №..." required />
        </div>

        <div className="grid-2">
          <div>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Сума (₴) *</label>
            <input type="number" min="0" step="1000" style={{ width: '100%' }} value={form.amount} onChange={set('amount')}
              placeholder="180000" required />
          </div>
          <div>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Дата виплати *</label>
            <input type="date" style={{ width: '100%' }} value={form.scheduledDate} onChange={set('scheduledDate')} required />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Номер рахунку</label>
          <input type="text" style={{ width: '100%' }} value={form.invoiceNumber} onChange={set('invoiceNumber')}
            placeholder="INV-2025-0102 (необов'язково)" />
        </div>

        <div className="flex gap-8 mt-8" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Скасувати</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Створення…' : 'Запланувати виплату'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
