import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/api';
import { ScoreCard } from '../components/ScoreCard';
import { ScoreTrendChart } from '../components/ScoreTrendChart';
import { 
  FileText, 
  BarChart3, 
  Target, 
  Wand2, 
  UploadCloud, 
  TrendingUp, 
  Sparkles,
  ArrowRight,
  Clock,
  ChevronRight
} from 'lucide-react';

export function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [sumRes, histRes] = await Promise.all([
        api.dashboard.getSummary(),
        api.dashboard.getHistory()
      ]);
      setSummary(sumRes);
      setHistory(histRes?.history || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.message || 'Failed to load dashboard summary.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 44,
            height: 44,
            border: '4px solid rgba(99, 102, 241, 0.2)',
            borderTopColor: 'var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard insights...</p>
        </div>
      </div>
    );
  }

  const resumes = summary?.resumes || [];

  return (
    <div className="animate-fade-in">
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        marginBottom: 32
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Resume Intelligence Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: 4 }}>
            Track ATS score progression, match job descriptions, and generate AI rewrites
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/resumes/upload" className="btn btn-primary">
            <UploadCloud size={17} />
            <span>Upload New Resume</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        <ScoreCard
          title="Overall Health Score"
          score={summary?.latestScore || 0}
          subtitle="Latest analyzed resume"
          icon={Sparkles}
        />
        <ScoreCard
          title="Average ATS Score"
          score={summary?.averageScore ? Math.round(summary.averageScore) : 0}
          subtitle="Across all versions"
          icon={TrendingUp}
        />
        <ScoreCard
          title="Total Resumes"
          score={summary?.totalResumes || 0}
          max={summary?.totalResumes > 10 ? summary.totalResumes : 10}
          subtitle="Uploaded documents"
          icon={FileText}
        />
        <ScoreCard
          title="Job Matches"
          score={summary?.totalJobMatches || 0}
          max={summary?.totalJobMatches > 10 ? summary.totalJobMatches : 10}
          subtitle="Target roles evaluated"
          icon={Target}
        />
      </div>

      {/* Main Content Grid: Score Progression & Quick Actions */}
      <div className="grid-2" style={{ marginBottom: 36 }}>
        {/* Score Progression Trend */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                Score Progression Over Time
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Track how your resume scores improve with each iteration
              </p>
            </div>
            <span className="badge badge-pdf" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc' }}>
              {history.length} Analyses
            </span>
          </div>

          <ScoreTrendChart data={history} />
        </div>

        {/* Quick Start & Resume Checklist */}
        <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: 6 }}>
              Optimization Core Loop
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
              Turn resume writing into a predictable, iterative process:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  flexShrink: 0
                }}>
                  1
                </div>
                <div>
                  <strong style={{ color: '#fff', fontSize: '0.92rem' }}>Upload PDF or DOCX</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Extract text and clean layout artifacts automatically.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(6, 182, 212, 0.15)',
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  flexShrink: 0
                }}>
                  2
                </div>
                <div>
                  <strong style={{ color: '#fff', fontSize: '0.92rem' }}>Run ATS Deep Health Check</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Detect technical/soft skills, missing keywords, and grammar quality.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--accent-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  flexShrink: 0
                }}>
                  3
                </div>
                <div>
                  <strong style={{ color: '#fff', fontSize: '0.92rem' }}>Match against Job Description & Generate Rewrites</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Get side-by-side rewritten bullet points with action verbs and metrics.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <Link to="/resumes/upload" className="btn btn-secondary" style={{ width: '100%' }}>
              <UploadCloud size={16} />
              <span>Start New Analysis</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Uploaded Resumes Section */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
              Your Uploaded Resumes
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Select a resume to view analysis, match against jobs, or generate rewrites
            </p>
          </div>
          <Link to="/resumes" className="btn btn-secondary btn-sm">
            <span>View All ({resumes.length})</span>
            <ChevronRight size={15} />
          </Link>
        </div>

        {resumes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            <FileText size={40} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 600 }}>No resumes uploaded yet.</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
              Upload your first resume to see your comprehensive AI breakdown.
            </p>
            <Link to="/resumes/upload" className="btn btn-primary btn-sm">
              <UploadCloud size={15} />
              <span>Upload Resume</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {resumes.slice(0, 5).map((r) => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(99, 102, 241, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-primary)'
                  }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>
                      {r.fileName}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: 10, alignItems: 'center', marginTop: 3 }}>
                      <span className={`badge badge-${r.fileType ? r.fileType.toLowerCase() : 'pdf'}`}>
                        {r.fileType || 'PDF'}
                      </span>
                      <span>Uploaded {r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString() : 'recently'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: r.latestScore >= 80 ? 'var(--accent-emerald)' : r.latestScore >= 60 ? 'var(--accent-amber)' : 'var(--accent-rose)' }}>
                      {r.latestScore ? `${r.latestScore}` : 'Not analyzed'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {r.latestScore ? 'Overall Score' : 'Pending'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link to={`/resumes/${r.id}/analysis`} className="btn btn-secondary btn-sm" title="View Analysis">
                      <BarChart3 size={14} />
                      <span>Analysis</span>
                    </Link>
                    <Link to={`/resumes/${r.id}/job-match`} className="btn btn-secondary btn-sm" title="Match Job">
                      <Target size={14} />
                      <span>Match JD</span>
                    </Link>
                    <Link to={`/resumes/${r.id}/improve`} className="btn btn-secondary btn-sm" title="Generate Rewrites">
                      <Wand2 size={14} />
                      <span>Rewrites</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
