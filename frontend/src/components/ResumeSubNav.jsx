import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { FileText, BarChart3, Target, Wand2, ChevronLeft } from 'lucide-react';

export function ResumeSubNav({ resumeId, resumeTitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Link 
          to="/resumes" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 6, 
            fontSize: '0.85rem', 
            color: 'var(--text-secondary)',
            fontWeight: 500
          }}
        >
          <ChevronLeft size={16} />
          <span>Back to All Resumes</span>
        </Link>

        {resumeTitle && (
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Viewing: <strong style={{ color: '#fff' }}>{resumeTitle}</strong>
          </div>
        )}
      </div>

      <div className="sub-nav">
        <NavLink
          to={`/resumes/${resumeId}`}
          end
          className={({ isActive }) => `sub-nav-tab ${isActive ? 'active' : ''}`}
        >
          <FileText size={16} />
          <span>Overview</span>
        </NavLink>

        <NavLink
          to={`/resumes/${resumeId}/analysis`}
          className={({ isActive }) => `sub-nav-tab ${isActive ? 'active' : ''}`}
        >
          <BarChart3 size={16} />
          <span>AI Analysis</span>
        </NavLink>

        <NavLink
          to={`/resumes/${resumeId}/job-match`}
          className={({ isActive }) => `sub-nav-tab ${isActive ? 'active' : ''}`}
        >
          <Target size={16} />
          <span>Job Match</span>
        </NavLink>

        <NavLink
          to={`/resumes/${resumeId}/improve`}
          className={({ isActive }) => `sub-nav-tab ${isActive ? 'active' : ''}`}
        >
          <Wand2 size={16} />
          <span>AI Rewrites</span>
        </NavLink>
      </div>
    </div>
  );
}
