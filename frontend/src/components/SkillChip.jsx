import React from 'react';
import { Check, X, Sparkles, Tag } from 'lucide-react';

export function SkillChip({ label, type = 'tech', count }) {
  if (!label) return null;

  let className = 'chip chip-tech';
  let Icon = Tag;

  if (type === 'soft') {
    className = 'chip chip-soft';
    Icon = Sparkles;
  } else if (type === 'matched') {
    className = 'chip chip-matched';
    Icon = Check;
  } else if (type === 'missing') {
    className = 'chip chip-missing';
    Icon = X;
  }

  return (
    <span className={className}>
      <Icon size={12} style={{ opacity: 0.85 }} />
      <span>{label}</span>
      {count !== undefined && (
        <span style={{
          fontSize: '0.7rem',
          opacity: 0.75,
          background: 'rgba(0,0,0,0.2)',
          padding: '1px 5px',
          borderRadius: '10px'
        }}>
          {count}
        </span>
      )}
    </span>
  );
}
