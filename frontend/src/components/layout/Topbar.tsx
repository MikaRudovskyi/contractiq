import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, Menu } from 'lucide-react';
import { initials } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { useMobileNav } from '../../hooks/useMobileNav';

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
  const { toggle } = useMobileNav();
  const title = PAGE_TITLES[loc.pathname] ?? 'ContractIQ';

  return (
    <header className="topbar">
      <button className="burger-btn" onClick={toggle} aria-label="Меню">
        <Menu size={20} />
      </button>

      <span className="topbar-title">{title}</span>
      <div className="topbar-spacer" />
      <div className="topbar-actions">
        <div className="input-wrap topbar-search">
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