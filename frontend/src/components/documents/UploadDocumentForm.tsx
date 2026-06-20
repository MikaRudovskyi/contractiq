import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { documentsApi } from '../../services/documentsApi';
import { contractorsApi } from '../../services/contractorsApi';
import { useApiData } from '../../hooks/useApiData';
import { ApiError } from '../../services/apiClient';

const TYPE_OPTIONS = [
  { value: 'contract', label: 'Договір' },
  { value: 'license', label: 'Ліцензія' },
  { value: 'insurance', label: 'Страхування' },
  { value: 'tax_certificate', label: 'Податкова довідка' },
  { value: 'work_order', label: 'Акт робіт' },
  { value: 'completion_act', label: 'Акт приймання' },
  { value: 'invoice', label: 'Рахунок' },
  { value: 'other', label: 'Інше' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const emptyForm = { contractorId: '', title: '', type: 'license', expiresAt: '', notes: '' };

export const UploadDocumentForm: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: contractors } = useApiData(() => contractorsApi.list(), [open]);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.contractorId || !form.title || !file) {
      setError('Оберіть підрядника, вкажіть назву і файл документа');
      return;
    }

    setSubmitting(true);
    try {
      await documentsApi.upload({
        file,
        contractorId: form.contractorId,
        title: form.title,
        type: form.type,
        expiresAt: form.expiresAt || undefined,
        notes: form.notes || undefined,
      });
      setForm(emptyForm);
      setFile(null);
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не вдалося завантажити документ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Завантажити документ" width={520}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-12">
        {error && <div className="alert-strip danger">{error}</div>}

        <div className="text-sm text-muted">
          Дозволені формати: PDF, Word, Excel, JPG, PNG, ZIP. Максимальний розмір — 25 МБ.
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
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Тип документа *</label>
            <select style={{ width: '100%' }} value={form.type} onChange={set('type')}>
              {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Термін дії</label>
            <input type="date" style={{ width: '100%' }} value={form.expiresAt} onChange={set('expiresAt')} />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Назва документа *</label>
          <input type="text" style={{ width: '100%' }} value={form.title} onChange={set('title')}
            placeholder="Ліцензія на будівельну діяльність" required />
        </div>

        <div>
          <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Файл *</label>
          <input
            type="file"
            style={{ width: '100%' }}
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            required
          />
          {file && (
            <div className="text-sm text-muted mt-4">{file.name} ({(file.size / 1024).toFixed(0)} КБ)</div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Примітки</label>
          <textarea
            style={{ width: '100%', minHeight: 60, padding: 8, border: '1px solid var(--ink-10)', borderRadius: 8, fontFamily: 'inherit', fontSize: 13 }}
            value={form.notes} onChange={set('notes')}
          />
        </div>

        <div className="flex gap-8 mt-8" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Скасувати</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Завантаження…' : 'Завантажити'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
