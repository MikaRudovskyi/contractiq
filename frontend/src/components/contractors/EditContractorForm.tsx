import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { contractorsApi } from '../../services/contractorsApi';
import { ApiError } from '../../services/apiClient';
import type { Contractor } from '../../types';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Очікує' },
  { value: 'active', label: 'Активний' },
  { value: 'suspended', label: 'Призупинено' },
  { value: 'blacklisted', label: 'Заблоковано' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  contractor: Contractor | null;
}

export const EditContractorForm: React.FC<Props> = ({ open, onClose, onUpdated, contractor }) => {
  const [status, setStatus] = useState('active');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contractor) {
      setStatus(contractor.status);
      setNotes(contractor.notes ?? '');
    }
  }, [contractor]);

  if (!contractor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await contractorsApi.update(contractor.id, { status, notes });
      onUpdated();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не вдалося оновити підрядника');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Редагувати: ${contractor.name}`} width={480}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-12">
        {error && <div className="alert-strip danger">{error}</div>}

        <div>
          <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Статус</label>
          <select style={{ width: '100%' }} value={status} onChange={e => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Примітки</label>
          <textarea
            style={{ width: '100%', minHeight: 80, padding: 8, border: '1px solid var(--ink-10)', borderRadius: 8, fontFamily: 'inherit', fontSize: 13 }}
            value={notes} onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-8 mt-8" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Скасувати</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Збереження…' : 'Зберегти зміни'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
