import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import { UploadDropzone } from '../components/UploadDropzone';
import confetti from 'canvas-confetti';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function ResumeUploadPage() {
  const [file, setFile] = useState(null);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleUploadAndProceed = async (fileToUpload) => {
    const targetFile = fileToUpload || file;
    if (!targetFile) return;

    setIsUploading(true);
    setProgress(20);
    setError('');

    try {
      // Simulate progress progression for nice UX
      const progressTimer = setInterval(() => {
        setProgress((prev) => (prev < 80 ? prev + 15 : prev));
      }, 150);

      const uploadRes = await api.resumes.upload(targetFile);
      clearInterval(progressTimer);
      setProgress(90);

      const newResumeId = uploadRes?.resume?.id;

      if (autoAnalyze && newResumeId) {
        setProgress(95);
        await api.analysis.run(newResumeId);
      }

      setProgress(100);
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (e) {}

      setTimeout(() => {
        navigate(`/resumes/${newResumeId}/analysis`);
      }, 500);

    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || 'Failed to upload and process resume.');
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
          Upload Your Resume
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: 6, maxWidth: 540, margin: '6px auto 0' }}>
          Our AI parser extracts text, analyzes ATS compatibility, identifies missing keywords, and evaluates role fit.
        </p>
      </div>

      <div className="glass-card" style={{ padding: '36px' }}>
        <UploadDropzone
          onFileSelected={(selected) => setFile(selected)}
          onSampleLoaded={(sample) => {
            setFile(sample);
            // Optionally auto-trigger
          }}
          isUploading={isUploading}
          uploadProgress={progress}
        />

        {error && (
          <div style={{
            marginTop: 20,
            padding: '12px 16px',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#fda4af',
            fontSize: '0.88rem'
          }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 28, borderTop: '1px solid var(--border-subtle)', paddingTop: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={autoAnalyze}
              onChange={(e) => setAutoAnalyze(e.target.checked)}
              style={{ accentColor: 'var(--accent-primary)', width: 16, height: 16 }}
            />
            <span>Automatically run AI Analysis immediately upon upload</span>
          </label>

          <button
            onClick={() => handleUploadAndProceed()}
            className="btn btn-primary"
            disabled={!file || isUploading}
          >
            {isUploading ? (
              <span>Analyzing Document...</span>
            ) : (
              <>
                <span>Upload & Analyze</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
          <ShieldCheck size={24} style={{ color: 'var(--accent-emerald)', margin: '0 auto 8px' }} />
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>Private & Secure</h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Your documents are strictly encrypted and scoped only to your account.</p>
        </div>

        <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
          <Sparkles size={24} style={{ color: 'var(--accent-cyan)', margin: '0 auto 8px' }} />
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>Gemini AI Engine</h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Powered by Google Gemini 1.5 Flash structured analysis.</p>
        </div>

        <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
          <CheckCircle2 size={24} style={{ color: 'var(--accent-primary)', margin: '0 auto 8px' }} />
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>Instant Iteration</h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Apply suggestions, re-upload, and track your score climb over time.</p>
        </div>
      </div>
    </div>
  );
}
