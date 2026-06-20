import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { contractsApi } from '../../services/contractsApi';
import { contractorsApi } from '../../services/contractorsApi';
import { useApiData } from '../../hooks/useApiData';
import { ApiError } from '../../services/apiClient';

const TYPE_OPTIONS = [
  { value: 'fixed', label: 'Фіксована ціна' },
  { value: 'time_material', label: 'Час і матеріали' },
  { value: 'milestone', label: 'По етапах' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const emptyForm = {
  number: '', title: '', contractorId: '', type: 'fixed',
  totalValue: '', startDate: '', endDate: '',
};

export const CreateContractForm: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: contractors } = useApiData(
    () => contractorsApi.list({ status: 'active' }),
    [open]
  );

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.number || !form.title || !form.contractorId || !form.totalValue || !form.startDate || !form.endDate) {
      setError('Заповніть усі обов\'язкові поля');
      return;
    }

    setSubmitting(true);
    try {
      await contractsApi.create({
        number: form.number,
        title: form.title,
        contractorId: form.contractorId,
        type: form.type,
        totalValue: Number(form.totalValue),
        startDate: form.startDate,
        endDate: form.endDate,
      });
      setForm(emptyForm);
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не вдалося створити договір');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Новий договір" width={560}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-12">
        {error && <div className="alert-strip danger">{error}</div>}

        {(!contractors || contractors.length === 0) && (
          <div className="alert-strip warning">
            Немає активних підрядників. Спочатку додайте підрядника і переведіть його у статус "Активний".
          </div>
        )}

        <div className="grid-2">
          <div>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Номер договору *</label>
            <input type="text" style={{ width: '100%' }} value={form.number} onChange={set('number')}
              placeholder="2025-25" required />
          </div>
          <div>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Тип оплати *</label>
            <select style={{ width: '100%' }} value={form.type} onChange={set('type')}>
              {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Назва договору *</label>
          <input type="text" style={{ width: '100%' }} value={form.title} onChange={set('title')}
            placeholder="Опис робіт за договором" required />
        </div>

        <div>
          <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Підрядник *</label>
          <select style={{ width: '100%' }} value={form.contractorId} onChange={set('contractorId')} required>
            <option value="">Оберіть підрядника…</option>
            {(contractors ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="grid-2">
          <div>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Сума договору (₴) *</label>
            <input type="number" min="0" step="1000" style={{ width: '100%' }} value={form.totalValue} onChange={set('totalValue')}
              placeholder="1000000" required />
          </div>
        </div>

        <div className="grid-2">
          <div>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Дата початку *</label>
            <input type="date" style={{ width: '100%' }} value={form.startDate} onChange={set('startDate')} required />
          </div>
          <div>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Дата завершення *</label>
            <input type="date" style={{ width: '100%' }} value={form.endDate} onChange={set('endDate')} required />
          </div>
        </div>

        <div className="flex gap-8 mt-8" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Скасувати</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Створення…' : 'Створити договір'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
