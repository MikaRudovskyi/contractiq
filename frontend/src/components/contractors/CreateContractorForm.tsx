import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { contractorsApi } from '../../services/contractorsApi';
import { ApiError } from '../../services/apiClient';

const CATEGORY_OPTIONS = [
  { value: 'construction', label: 'Будівництво' },
  { value: 'electrical', label: 'Електрика' },
  { value: 'plumbing', label: 'Сантехніка' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'it', label: 'IT' },
  { value: 'logistics', label: 'Логістика' },
  { value: 'cleaning', label: 'Прибирання' },
  { value: 'security', label: 'Охорона' },
  { value: 'design', label: 'Дизайн' },
  { value: 'other', label: 'Інше' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const emptyForm = {
  name: '', legalName: '', code: '', category: 'construction',
  contactPerson: '', email: '', phone: '', region: '', notes: '',
};

export const CreateContractorForm: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.legalName || !form.code || !form.contactPerson || !form.email || !form.phone || !form.region) {
      setError('Заповніть усі обов\'язкові поля');
      return;
    }

    setSubmitting(true);
    try {
      await contractorsApi.create({
        name: form.name,
        legalName: form.legalName,
        code: form.code,
        category: form.category,
        contactPerson: form.contactPerson,
        email: form.email,
        phone: form.phone,
        region: form.region,
        notes: form.notes || undefined,
      });
      setForm(emptyForm);
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не вдалося створити підрядника');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Додати підрядника" width={560}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-12">
        {error && <div className="alert-strip danger">{error}</div>}

        <div>
          <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Назва компанії *</label>
          <input type="text" style={{ width: '100%' }} value={form.name} onChange={set('name')}
            placeholder='ТОВ "Назва компанії"' required />
        </div>

        <div>
          <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Повна юридична назва *</label>
          <input type="text" style={{ width: '100%' }} value={form.legalName} onChange={set('legalName')}
            placeholder='ТОВАРИСТВО З ОБМЕЖЕНОЮ ВІДПОВІДАЛЬНІСТЮ "..."' required />
        </div>

        <div className="grid-2">
          <div>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>ЄДРПОУ / ІПН *</label>
            <input type="text" style={{ width: '100%' }} value={form.code} onChange={set('code')}
              placeholder="12345678" required />
          </div>
          <div>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Категорія *</label>
            <select style={{ width: '100%' }} value={form.category} onChange={set('category')}>
              {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid-2">
          <div>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Контактна особа *</label>
            <input type="text" style={{ width: '100%' }} value={form.contactPerson} onChange={set('contactPerson')}
              placeholder="Прізвище Ім'я" required />
          </div>
          <div>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Регіон *</label>
            <input type="text" style={{ width: '100%' }} value={form.region} onChange={set('region')}
              placeholder="м. Київ" required />
          </div>
        </div>

        <div className="grid-2">
          <div>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Email *</label>
            <input type="email" style={{ width: '100%' }} value={form.email} onChange={set('email')}
              placeholder="contact@company.ua" required />
          </div>
          <div>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Телефон *</label>
            <input type="text" style={{ width: '100%' }} value={form.phone} onChange={set('phone')}
              placeholder="+380XXXXXXXXX" required />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Примітки</label>
          <textarea
            style={{ width: '100%', minHeight: 60, padding: 8, border: '1px solid var(--ink-10)', borderRadius: 8, fontFamily: 'inherit', fontSize: 13 }}
            value={form.notes} onChange={set('notes')}
            placeholder="Додаткова інформація (необов'язково)"
          />
        </div>

        <div className="flex gap-8 mt-8" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Скасувати</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Створення…' : 'Створити підрядника'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
