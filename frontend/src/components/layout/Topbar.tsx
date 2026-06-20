import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import { initials } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':   'Дашборд',
  '/contractors': 'Підрядники',
  '/contracts':   'Договори',
  '/work-orders': 'Акти виконаних робіт',
  '/payments':    'Виплати',
  '/documents':   'Документи',
  '/analytics':   'Аналітика',
  '/settings':    'Налаштування',
};

export const Topbar: React.FC = () => {
  const loc = useLocation();
  const { user } = useAuth();
  const title = PAGE_TITLES[loc.pathname] ?? 'ContractIQ';

  return (
    <header className="topbar">
      <span className="topbar-title">{title}</span>
      <div className="topbar-spacer" />
      <div className="topbar-actions">
        <div className="input-wrap" style={{ display: 'flex' }}>
          <Search size={14} className="input-icon" />
          <input
            type="search"
            className="input-with-icon"
            placeholder="Швидкий пошук…"
            style={{ width: 220 }}
          />
        </div>

        <button className="notif-btn">
          <Bell size={15} />
          <span className="notif-dot" />
        </button>

        <div className="avatar">{user ? initials(user.name) : '?'}</div>
      </div>
    </header>
  );
};
