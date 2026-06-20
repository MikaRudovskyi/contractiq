import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, ClipboardCheck,
  FileStack, CreditCard, Settings, LogOut, BarChart3
} from 'lucide-react';
import { dashboardApi } from '../../services/dashboardApi';
import { useApiData } from '../../hooks/useApiData';
import { useAuth } from '../../hooks/useAuth';
import { initials } from '../../utils/format';

const NavItem: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  badgeWarn?: boolean;
}> = ({ to, icon, label, badge, badgeWarn }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
    >
      <span className="icon">{icon}</span>
      {label}
      {badge != null && badge > 0 && (
        <span className={`sidebar-badge ${badgeWarn ? 'warn' : ''}`}>{badge}</span>
      )}
    </NavLink>
  );
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Адміністратор', manager: 'Менеджер', finance: 'Фінанси', viewer: 'Перегляд',
};

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: stats } = useApiData(() => dashboardApi.getStats(), []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">CQ</div>
        <span className="sidebar-logo-text">ContractIQ</span>
        <span className="sidebar-logo-badge">v1.0</span>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Основне</span>

        <NavItem to="/dashboard" icon={<LayoutDashboard size={16} />} label="Дашборд" />
        <NavItem to="/contractors" icon={<Users size={16} />} label="Підрядники" />
        <NavItem to="/contracts" icon={<FileText size={16} />} label="Договори" />
        <NavItem
          to="/work-orders"
          icon={<ClipboardCheck size={16} />}
          label="Акти робіт"
          badge={stats?.pendingWorkOrders}
          badgeWarn
        />

        <span className="sidebar-section-label">Фінанси і документи</span>

        <NavItem
          to="/payments"
          icon={<CreditCard size={16} />}
          label="Виплати"
          badge={stats?.overduePayments}
        />
        <NavItem
          to="/documents"
          icon={<FileStack size={16} />}
          label="Документи"
          badge={stats?.documentsExpiringSoon}
          badgeWarn
        />
        <NavItem to="/analytics" icon={<BarChart3 size={16} />} label="Аналітика" />

        <span className="sidebar-section-label">Система</span>
        <NavItem to="/settings" icon={<Settings size={16} />} label="Налаштування" />
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-item" style={{ cursor: 'pointer' }} onClick={handleLogout} title="Вийти">
          <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
            {user ? initials(user.name) : '?'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user ? `${user.name.split(' ')[0]} ${user.name.split(' ')[1]?.[0] ?? ''}.` : '—'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>
              {user ? (ROLE_LABELS[user.role] ?? user.role) : ''}
            </div>
          </div>
          <LogOut size={14} style={{ marginLeft: 'auto', opacity: .4 }} />
        </div>
      </div>
    </aside>
  );
};
