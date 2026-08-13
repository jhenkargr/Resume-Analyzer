import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export function ScoreTrendChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div style={{
        height: 280,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        background: 'rgba(255, 255, 255, 0.01)',
        borderRadius: 'var(--radius-md)',
        border: '1px dashed var(--border-subtle)'
      }}>
        <p>No score history recorded yet.</p>
        <span style={{ fontSize: '0.8rem', marginTop: 4 }}>
          Run your first analysis to see your score trajectory!
        </span>
      </div>
    );
  }

  const chartData = data.map((item, index) => {
    const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : `Run #${index + 1}`;
    return {
      run: date,
      overall: item.overallScore,
      ats: item.atsScore,
      grammar: item.grammarScore,
      clarity: item.clarityScore,
      resumeName: item.resumeName || 'Resume'
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{ fontWeight: 700, color: '#fff', marginBottom: 8, fontSize: '0.85rem' }}>
            {label}
          </div>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} style={{ fontSize: '0.8rem', color: entry.color, marginBottom: 4, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <span style={{ textTransform: 'capitalize' }}>{entry.name}:</span>
              <strong>{entry.value} / 100</strong>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
            </linearGradient>
            <linearGradient id="colorAts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis dataKey="run" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
          <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
          <Area
            type="monotone"
            dataKey="overall"
            name="Overall Score"
            stroke="#6366f1"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorOverall)"
          />
          <Area
            type="monotone"
            dataKey="ats"
            name="ATS Score"
            stroke="#06b6d4"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorAts)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
