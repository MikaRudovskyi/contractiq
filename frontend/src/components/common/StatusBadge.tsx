import React from 'react';

type Color = 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'cyan';

interface Props {
  status: string;
  dot?: boolean;
}

const STATUS_MAP: Record<string, { label: string; color: Color }> = {
  // Contractor
  active:      { label: 'Активний',     color: 'green' },
  suspended:   { label: 'Призупинено',  color: 'amber' },
  pending:     { label: 'Очікує',       color: 'blue'  },
  blacklisted: { label: 'Заблоковано',  color: 'red'   },

  // Contract
  draft:       { label: 'Чернетка',     color: 'gray'  },
  // active already defined
  completed:   { label: 'Завершено',    color: 'cyan'  },
  disputed:    { label: 'Суперечка',    color: 'red'   },
  terminated:  { label: 'Розірвано',    color: 'red'   },

  // Document
  approved:    { label: 'Затверджено',  color: 'green' },
  rejected:    { label: 'Відхилено',    color: 'red'   },
  expired:     { label: 'Прострочено',  color: 'red'   },
  // pending already defined

  // Payment
  scheduled:   { label: 'Заплановано', color: 'blue'  },
  processing:  { label: 'В обробці',   color: 'amber' },
  paid:        { label: 'Оплачено',    color: 'green' },
  overdue:     { label: 'Прострочено', color: 'red'   },

  // Work Order
  open:        { label: 'На розгляді',  color: 'blue'  },
  in_progress: { label: 'В роботі',    color: 'amber' },
  review:      { label: 'Перевірка',   color: 'amber' },
  accepted:    { label: 'Прийнято',    color: 'green' },
  // rejected already defined
};

export const StatusBadge: React.FC<Props> = ({ status, dot = true }) => {
  const { label, color } = STATUS_MAP[status] ?? { label: status, color: 'gray' as Color };
  return (
    <span className={`badge ${color}`}>
      {dot && <span className="badge-dot" />}
      {label}
    </span>
  );
};
