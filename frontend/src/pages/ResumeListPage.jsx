import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/api';
import { 
  FileText, 
  BarChart3, 
  Target, 
  Wand2, 
  UploadCloud, 
  Trash2, 
  Search,
  ExternalLink,
  Eye
} from 'lucide-react';

export function ResumeListPage() {
  const [resumes, setResumes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const data = await api.resumes.list();
      setResumes(data.resumes || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch resumes.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"? This cannot be undone.`)) {
      return;
    }
    setDeletingId(id);
    try {
      await api.resumes.delete(id);
      setResumes(resumes.filter(r => r.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete resume.');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = resumes.filter(r => 
    r.fileName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
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
            My Resumes
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: 4 }}>
            Manage your uploaded documents and dive into detailed reports
          </p>
        </div>

        <Link to="/resumes/upload" className="btn btn-primary">
          <UploadCloud size={17} />
          <span>Upload Resume</span>
        </Link>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: 24, maxWidth: '400px', position: 'relative' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search by resume title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 40 }}
        />
        <Search size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', minHeight: '40vh', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 36,
            height: 36,
            border: '3px solid rgba(99, 102, 241, 0.2)',
            borderTopColor: 'var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto'
          }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <FileText size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            {search ? 'No matching resumes found' : 'No resumes uploaded yet'}
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 24, maxWidth: 420, margin: '0 auto 24px' }}>
            {search ? 'Try adjusting your search query.' : 'Upload your first resume in PDF, DOCX, or TXT format to get started.'}
          </p>
          {!search && (
            <Link to="/resumes/upload" className="btn btn-primary btn-sm">
              <UploadCloud size={16} />
              <span>Upload Resume</span>
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map((r) => (
            <div
              key={r.id}
              className="glass-card glass-card-hoverable"
              style={{
                padding: '24px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 20
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)',
                  flexShrink: 0
                }}>
                  <FileText size={24} />
                </div>
                <div>
                  <Link 
                    to={`/resumes/${r.id}`}
                    style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <span>{r.fileName}</span>
                    <ExternalLink size={14} style={{ opacity: 0.5 }} />
                  </Link>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
                    <span className={`badge badge-${r.fileType ? r.fileType.toLowerCase() : 'pdf'}`}>
                      {r.fileType || 'PDF'}
                    </span>
                    <span>Uploaded {r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString() : 'recently'}</span>
                    <span>• {r.analysesCount || 0} analyses run</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    color: r.latestScore >= 80 ? 'var(--accent-emerald)' : r.latestScore >= 60 ? 'var(--accent-amber)' : 'var(--accent-rose)'
                  }}>
                    {r.latestScore ? `${r.latestScore}` : '—'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {r.latestScore ? 'Health Score' : 'Unanalyzed'}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <Link to={`/resumes/${r.id}`} className="btn btn-secondary btn-sm" title="View Document">
                    <Eye size={14} />
                    <span>Overview</span>
                  </Link>
                  <Link to={`/resumes/${r.id}/analysis`} className="btn btn-secondary btn-sm" title="AI Analysis">
                    <BarChart3 size={14} />
                    <span>Analysis</span>
                  </Link>
                  <Link to={`/resumes/${r.id}/job-match`} className="btn btn-secondary btn-sm" title="Match Job Description">
                    <Target size={14} />
                    <span>Job Match</span>
                  </Link>
                  <Link to={`/resumes/${r.id}/improve`} className="btn btn-secondary btn-sm" title="Generate AI Rewrites">
                    <Wand2 size={14} />
                    <span>Rewrites</span>
                  </Link>
                  <button
                    onClick={() => handleDelete(r.id, r.fileName)}
                    className="btn btn-danger btn-sm"
                    title="Delete Resume"
                    disabled={deletingId === r.id}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
