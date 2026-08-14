import React from 'react';
import { Award, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

export function ScoreCard({ title, score, subtitle, icon: Icon, color = 'primary', max = 100 }) {
  const numScore = typeof score === 'number' ? score : parseInt(score, 10);
  const isValid = !isNaN(numScore);

  let statusClass = 'medium';
  let badgeColor = 'var(--accent-amber)';
  if (isValid) {
    if (numScore >= 80) {
      statusClass = 'high';
      badgeColor = 'var(--accent-emerald)';
    } else if (numScore < 60) {
      statusClass = 'low';
      badgeColor = 'var(--accent-rose)';
    }
  }

  const RenderIcon = Icon || Award;

  return (
    <div className="glass-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {title}
          </span>
          {subtitle && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {subtitle}
            </div>
          )}
        </div>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-md)',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: badgeColor
        }}>
          <RenderIcon size={18} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff' }}>
          {isValid ? numScore : '—'}
        </span>
        {isValid && (
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            / {max}
          </span>
        )}
      </div>

      {isValid && (
        <div style={{
          width: '100%',
          height: '6px',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.min(100, Math.max(0, (numScore / max) * 100))}%`,
            height: '100%',
            background: numScore >= 80 ? 'linear-gradient(90deg, #10b981, #34d399)' :
                        numScore >= 60 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' :
                        'linear-gradient(90deg, #f43f5e, #fb7185)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)'
          }} />
        </div>
      )}
    </div>
  );
}
