import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div style={{
      minHeight: 'calc(100vh - 180px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 16px'
    }}>
      <div className="glass-card animate-fade-in" style={{ maxWidth: '480px', width: '100%', padding: '48px 32px', textAlign: 'center' }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          color: 'var(--accent-rose)'
        }}>
          <AlertCircle size={28} />
        </div>

        <h1 style={{ fontSize: '3rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
          404
        </h1>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e2e8f0', marginTop: 12, marginBottom: 8 }}>
          Page Not Found
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 28 }}>
          The page you are looking for doesn't exist or has been moved.
        </p>

        <Link to="/dashboard" className="btn btn-primary">
          <Home size={16} />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
