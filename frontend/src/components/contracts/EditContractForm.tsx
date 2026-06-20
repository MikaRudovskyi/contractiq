import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { contractsApi } from '../../services/contractsApi';
import { ApiError } from '../../services/apiClient';
import type { Contract } from '../../types';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Чернетка' },
  { value: 'active', label: 'Активний' },
  { value: 'completed', label: 'Завершено' },
  { value: 'disputed', label: 'Суперечка' },
  { value: 'terminated', label: 'Розірвано' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  contract: Contract | null;
}

export const EditContractForm: React.FC<Props> = ({ open, onClose, onUpdated, contract }) => {
  const [status, setStatus] = useState('draft');
  const [completionPercent, setCompletionPercent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contract) {
      setStatus(contract.status);
      setCompletionPercent(contract.completionPercent);
    }
  }, [contract]);

  if (!contract) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await contractsApi.update(contract.id, { status, completionPercent });
      onUpdated();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не вдалося оновити договір');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Договір №${contract.number}`} width={480}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-12">
        {error && <div className="alert-strip danger">{error}</div>}

        <div className="text-sm text-muted">{contract.title}</div>

        <div>
          <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Статус</label>
          <select style={{ width: '100%' }} value={status} onChange={e => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          {status === 'active' && (
            <div className="text-sm text-muted mt-4">
              Якщо у підрядника протермінована ліцензія чи страхування — активація буде заблокована сервером.
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>
            Прогрес виконання: {completionPercent}%
          </label>
          <input
            type="range" min={0} max={100} step={5}
            value={completionPercent}
            onChange={e => setCompletionPercent(Number(e.target.value))}
            style={{ width: '100%' }}
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
