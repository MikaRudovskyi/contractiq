import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { initials } from '../../utils/format';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Адміністратор', manager: 'Менеджер проєктів', finance: 'Фінанси', viewer: 'Перегляд',
};

export const Settings: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Налаштування</h1>
          <p className="page-subtitle">Профіль, команда та параметри системи</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <div className="card-header"><span className="card-title">Профіль користувача</span></div>
        <div className="card-body">
          {user ? (
            <div className="flex items-center gap-16">
              <div className="avatar" style={{ width: 56, height: 56, fontSize: 18 }}>{initials(user.name)}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{user.name}</div>
                <div className="text-muted">{user.email}</div>
                <span className="badge blue" style={{ marginTop: 6 }}>{ROLE_LABELS[user.role] ?? user.role}</span>
              </div>
            </div>
          ) : (
            <div className="text-muted">Дані користувача не завантажено</div>
          )}
        </div>
      </div>
    </div>
  );
};
