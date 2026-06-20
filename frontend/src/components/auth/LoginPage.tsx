import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('o.kovalchuk@buildpro.ua');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      // error вже доступний через useAuth().error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--ink-05)'
    }}>
      <div className="card" style={{ width: 380, padding: 32 }}>
        <div className="flex items-center gap-8 mb-16" style={{ justifyContent: 'center' }}>
          <div className="sidebar-logo-mark" style={{ width: 36, height: 36, fontSize: 15 }}>CQ</div>
          <span style={{ fontSize: 18, fontWeight: 700 }}>ContractIQ</span>
        </div>

        <p className="text-muted text-center mb-16" style={{ textAlign: 'center', marginBottom: 20 }}>
          Увійдіть, щоб продовжити роботу
        </p>

        {error && (
          <div className="alert-strip danger" style={{ marginBottom: 16 }}>
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-12">
          <div>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Email</label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%' }}
              placeholder="name@company.ua"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 4 }}>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%' }}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', marginTop: 8 }} disabled={submitting}>
            <LogIn size={14} /> {submitting ? 'Входимо…' : 'Увійти'}
          </button>
        </form>

        <div className="divider" />

        <div className="text-sm text-muted">
          Тестові доступи:<br />
          <code style={{ fontSize: 11.5 }}>o.kovalchuk@buildpro.ua</code> / <code style={{ fontSize: 11.5 }}>Demo12345!</code> (Manager)<br />
          <code style={{ fontSize: 11.5 }}>admin@buildpro.ua</code> / <code style={{ fontSize: 11.5 }}>Admin12345!</code> (Admin)
        </div>
      </div>
    </div>
  );
};
