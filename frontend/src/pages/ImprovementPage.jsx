import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/api';
import { ResumeSubNav } from '../components/ResumeSubNav';
import { SkillChip } from '../components/SkillChip';
import confetti from 'canvas-confetti';
import { 
  Wand2, 
  Sparkles, 
  Copy, 
  Check, 
  RotateCw, 
  Layers, 
  ArrowRight, 
  History,
  FileCheck2,
  CheckCircle2
} from 'lucide-react';

export function ImprovementPage() {
  const { resumeId } = useParams();
  const [resumeData, setResumeData] = useState(null);
  const [improvements, setImprovements] = useState([]);
  const [selectedImprovement, setSelectedImprovement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [improving, setImproving] = useState(false);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  useEffect(() => {
    loadData();
  }, [resumeId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resData, impData] = await Promise.all([
        api.resumes.get(resumeId),
        api.improvements.getList(resumeId)
      ]);
      setResumeData(resData?.resume);
      const list = impData?.improvements || [];
      setImprovements(list);
      if (list.length > 0) {
        setSelectedImprovement(list[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load improvements.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImprovement = async () => {
    setImproving(true);
    setError('');
    try {
      const res = await api.improvements.run(resumeId);
      const newImp = res?.improvement;
      if (newImp) {
        setSelectedImprovement(newImp);
        setImprovements([newImp, ...improvements]);
        try {
          confetti({
            particleCount: 75,
            spread: 55,
            origin: { y: 0.6 }
          });
        } catch (e) {}
      }
    } catch (err) {
      setError(err.message || 'Failed to generate improvement rewrites.');
    } finally {
      setImproving(false);
    }
  };

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const parseExperience = (jsonStr) => {
    if (!jsonStr) return [];
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
    return [];
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
          <p style={{ color: 'var(--text-secondary)' }}>Generating high-impact rewrites...</p>
        </div>
      </div>
    );
  }

  const experiencePairs = selectedImprovement ? parseExperience(selectedImprovement.improvedExperience) : [];
  const suggestedKeywords = selectedImprovement?.suggestedKeywords ? selectedImprovement.suggestedKeywords.split(',').map(s => s.trim()).filter(Boolean) : [];

  return (
    <div className="animate-fade-in">
      <ResumeSubNav resumeId={resumeId} resumeTitle={resumeData?.fileName} />

      {/* Top Banner */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            AI-Powered Resume Rewriter
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
            Transform passive descriptions into punchy, metric-backed STAR bullet points and high-converting summaries
          </p>
        </div>

        <button
          onClick={handleGenerateImprovement}
          className="btn btn-primary"
          disabled={improving}
        >
          <Wand2 size={16} className={improving ? 'spin-anim' : ''} />
          <span>{improving ? 'Synthesizing Rewrites...' : 'Generate New AI Rewrite Pass'}</span>
        </button>
      </div>

      {error && (
        <div style={{
          marginBottom: 24,
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

      {/* Version Selector if multiple */}
      {improvements.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <History size={14} />
            <span>Version History:</span>
          </span>
          {improvements.map((imp, idx) => (
            <button
              key={imp.id || idx}
              onClick={() => setSelectedImprovement(imp)}
              className={`btn btn-sm ${selectedImprovement?.id === imp.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem' }}
            >
              Pass #{improvements.length - idx} ({new Date(imp.createdAt).toLocaleDateString()})
            </button>
          ))}
        </div>
      )}

      {!selectedImprovement ? (
        <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <Wand2 size={48} style={{ color: 'var(--accent-violet)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            No AI Rewrites Generated Yet
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24, maxWidth: 460, margin: '0 auto 24px' }}>
            Click the button to automatically generate a polished professional summary, strengthened experience bullets, and keyword enhancements.
          </p>
          <button
            onClick={handleGenerateImprovement}
            className="btn btn-primary"
            disabled={improving}
          >
            <Sparkles size={16} />
            <span>{improving ? 'Generating...' : 'Generate First Rewrite Pass'}</span>
          </button>
        </div>
      ) : (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Section 1: Professional Summary */}
          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={20} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                  Polished Professional Summary
                </h3>
              </div>

              <button
                onClick={() => handleCopy(selectedImprovement.improvedSummary, 'summary')}
                className="btn btn-secondary btn-sm"
              >
                {copiedKey === 'summary' ? (
                  <>
                    <Check size={14} color="var(--accent-emerald)" />
                    <span style={{ color: 'var(--accent-emerald)' }}>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Summary</span>
                  </>
                )}
              </button>
            </div>

            <div style={{
              padding: '20px',
              background: 'rgba(99, 102, 241, 0.05)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.95rem',
              lineHeight: 1.7,
              color: '#e2e8f0'
            }}>
              {selectedImprovement.improvedSummary}
            </div>
          </div>

          {/* Section 2: Experience Bullets (Side by Side Comparison) */}
          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileCheck2 size={20} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                  Experience Bullet Point Transformations
                </h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Before & after comparison using action verbs, metrics quantification, and ATS structure
              </p>
            </div>

            {experiencePairs.length === 0 ? (
              <div style={{
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem'
              }}>
                No bullet pairs found in this pass. Click "Generate New AI Rewrite Pass" to extract and rewrite experience bullet points.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {experiencePairs.map((pair, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 16,
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    {/* Original */}
                    <div style={{
                      padding: '14px',
                      background: 'rgba(244, 63, 94, 0.05)',
                      border: '1px solid rgba(244, 63, 94, 0.2)',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase', marginBottom: 6 }}>
                        Original Bullet (Weak / Passive)
                      </div>
                      <div style={{ fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                        {pair.original || 'Original text candidate'}
                      </div>
                    </div>

                    {/* Improved */}
                    <div style={{
                      padding: '14px',
                      background: 'rgba(16, 185, 129, 0.06)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: 'var(--radius-sm)',
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6ee7b7', textTransform: 'uppercase' }}>
                          ✓ AI Optimized (STAR & Metrics)
                        </div>
                        <button
                          onClick={() => handleCopy(pair.improved, `exp-${idx}`)}
                          style={{ color: 'var(--text-muted)', padding: '2px 6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                          title="Copy bullet point"
                        >
                          {copiedKey === `exp-${idx}` ? (
                            <Check size={12} color="var(--accent-emerald)" />
                          ) : (
                            <Copy size={12} />
                          )}
                          <span style={{ color: copiedKey === `exp-${idx}` ? 'var(--accent-emerald)' : 'inherit' }}>
                            {copiedKey === `exp-${idx}` ? 'Copied' : 'Copy'}
                          </span>
                        </button>
                      </div>
                      <div style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 500, lineHeight: 1.6 }}>
                        {pair.improved}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Suggested Keywords */}
          {suggestedKeywords.length > 0 && (
            <div className="glass-card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Layers size={20} color="var(--accent-violet)" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                    ATS Keywords to Insert ({suggestedKeywords.length})
                  </h3>
                </div>

                <button
                  onClick={() => handleCopy(suggestedKeywords.join(', '), 'keywords')}
                  className="btn btn-secondary btn-sm"
                >
                  {copiedKey === 'keywords' ? (
                    <>
                      <Check size={14} color="var(--accent-emerald)" />
                      <span style={{ color: 'var(--accent-emerald)' }}>Copied All!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy All Keywords</span>
                    </>
                  )}
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {suggestedKeywords.map((kw, idx) => (
                  <SkillChip key={idx} label={kw} type="tech" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
