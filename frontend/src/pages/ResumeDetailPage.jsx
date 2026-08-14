import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/api';
import { ResumeSubNav } from '../components/ResumeSubNav';
import { 
  FileText, 
  Copy, 
  Check, 
  BarChart3, 
  Target, 
  Wand2, 
  Clock, 
  Tag, 
  Download 
} from 'lucide-react';

export function ResumeDetailPage() {
  const { resumeId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadResume();
  }, [resumeId]);

  const loadResume = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.resumes.get(resumeId);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load resume details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!data?.resume?.extractedText) return;
    navigator.clipboard.writeText(data.resume.extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 40,
          height: 40,
          border: '4px solid rgba(99, 102, 241, 0.2)',
          borderTopColor: 'var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    );
  }

  if (error || !data?.resume) {
    return (
      <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ color: '#fda4af', marginBottom: 16 }}>{error || 'Resume not found'}</p>
        <Link to="/resumes" className="btn btn-secondary btn-sm">
          Return to Resumes
        </Link>
      </div>
    );
  }

  const { resume, latestAnalysis, analyses, jobMatches, improvements } = data;
  const text = resume.extractedText || '';
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const lineCount = text ? text.split('\n').length : 0;

  return (
    <div className="animate-fade-in">
      <ResumeSubNav resumeId={resumeId} resumeTitle={resume.fileName} />

      {/* Top Header Card */}
      <div className="glass-card" style={{ padding: '28px', marginBottom: 28 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2))',
              border: '1px solid var(--border-bright)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)'
            }}>
              <FileText size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                {resume.fileName}
              </h2>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
                <span className={`badge badge-${resume.fileType?.toLowerCase() || 'pdf'}`}>
                  {resume.fileType || 'PDF'}
                </span>
                <span>{wordCount} words</span>
                <span>• {lineCount} lines</span>
                <span>• Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Link to={`/resumes/${resumeId}/analysis`} className="btn btn-primary btn-sm">
              <BarChart3 size={15} />
              <span>{latestAnalysis ? 'View AI Analysis' : 'Run First Analysis'}</span>
            </Link>
            <Link to={`/resumes/${resumeId}/job-match`} className="btn btn-secondary btn-sm">
              <Target size={15} />
              <span>Match Job</span>
            </Link>
            <Link to={`/resumes/${resumeId}/improve`} className="btn btn-secondary btn-sm">
              <Wand2 size={15} />
              <span>Generate Rewrites</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Extracted Text Viewer */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              Extracted Resume Content
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Normalized text stripped of parsing artifacts and ready for LLM processing
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="btn btn-secondary btn-sm"
          >
            {copied ? (
              <>
                <Check size={14} color="var(--accent-emerald)" />
                <span style={{ color: 'var(--accent-emerald)' }}>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Extracted Text</span>
              </>
            )}
          </button>
        </div>

        <div style={{
          background: 'rgba(10, 13, 20, 0.95)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.86rem',
          lineHeight: '1.7',
          color: '#cbd5e1',
          whiteSpace: 'pre-wrap',
          maxHeight: '600px',
          overflowY: 'auto'
        }}>
          {text || 'No extracted text found in this file.'}
        </div>
      </div>
    </div>
  );
}
