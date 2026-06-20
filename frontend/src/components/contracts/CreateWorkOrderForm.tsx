import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { workOrdersApi } from '../../services/workOrdersApi';
import { contractsApi } from '../../services/contractsApi';
import { useApiData } from '../../hooks/useApiData';
import { ApiError } from '../../services/apiClient';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const emptyForm = { contractId: '', title: '', description: '', amount: '', deadline: '' };

export const CreateWorkOrderForm: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: contracts } = useApiData(
    () => contractsApi.list({ status: 'active' }),
    [open]
  );

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.contractId || !form.title || !form.description || !form.amount || !form.deadline) {
      setError('Заповніть усі обов\'язкові поля');
      return;
    }

    setSubmitting(true);
    try {
      await workOrdersApi.create({
        contractId: form.contractId,
        title: form.title,
        description: form.description,
        amount: Number(form.amount),
        deadline: form.deadline,
      });
      setForm(emptyForm);
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не вдалося подати акт');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Новий акт виконаних робіт" width={560}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-12">
        {error && <div className="alert-strip danger">{error}</div>}

        {(!contracts || contracts.length === 0) && (
          <div className="alert-strip warning">
            Немає активних договорів. Акт можна подати лише по активному договору.
          </div>
        )}

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
          <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Назва акту *</label>
          <input type="text" style={{ width: '100%' }} value={form.title} onChange={set('title')}
            placeholder="Акт виконаних робіт №..." required />
        </div>

        <div>
          <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Опис виконаних робіт *</label>
          <textarea
            style={{ width: '100%', minHeight: 80, padding: 8, border: '1px solid var(--ink-10)', borderRadius: 8, fontFamily: 'inherit', fontSize: 13 }}
            value={form.description} onChange={set('description')}
            placeholder="Детальний опис обсягу виконаних робіт"
            required
          />
        </div>

        <div className="grid-2">
          <div>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Сума (₴) *</label>
            <input type="number" min="0" step="1000" style={{ width: '100%' }} value={form.amount} onChange={set('amount')}
              placeholder="180000" required />
          </div>
          <div>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Дедлайн перевірки *</label>
            <input type="date" style={{ width: '100%' }} value={form.deadline} onChange={set('deadline')} required />
          </div>
        </div>

        <div className="flex gap-8 mt-8" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Скасувати</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Подання…' : 'Подати акт'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
