import React from 'react';

interface Props { value: number; max?: number; showValue?: boolean; }

export const Rating: React.FC<Props> = ({ value, max = 5, showValue = true }) => {
  return (
    <span className="rating">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`rating-star ${i < Math.round(value) ? 'filled' : ''}`}>★</span>
      ))}
      {showValue && value > 0 && <span className="rating-value">{value.toFixed(1)}</span>}
      {showValue && value === 0 && <span className="rating-value">—</span>}
    </span>
  );
};
