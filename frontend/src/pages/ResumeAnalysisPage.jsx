import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/api';
import { ResumeSubNav } from '../components/ResumeSubNav';
import { ScoreCard } from '../components/ScoreCard';
import { SkillChip } from '../components/SkillChip';
import { ScoreTrendChart } from '../components/ScoreTrendChart';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  BarChart3, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Cpu, 
  MessageSquare,
  FileCheck,
  TrendingUp,
  Award
} from 'lucide-react';

export function ResumeAnalysisPage() {
  const { resumeId } = useParams();
  const [resumeData, setResumeData] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [resumeId]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [resData, analysisData] = await Promise.all([
        api.resumes.get(resumeId),
        api.analysis.getHistory(resumeId)
      ]);
      setResumeData(resData?.resume);
      const list = analysisData?.analyses || [];
      setAnalyses(list);
      setLatestAnalysis(list.length > 0 ? list[0] : null);
    } catch (err) {
      setError(err.message || 'Failed to load analysis details.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const res = await api.analysis.run(resumeId);
      const newAnalysis = res?.analysis;
      if (newAnalysis) {
        setLatestAnalysis(newAnalysis);
        setAnalyses([newAnalysis, ...analyses]);
        try {
          confetti({
            particleCount: 70,
            spread: 50,
            origin: { y: 0.6 }
          });
        } catch (e) {}
      }
    } catch (err) {
      setError(err.message || 'Failed to run analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  const parseList = (str) => {
    if (!str) return [];
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
    return str.split(',').map(s => s.trim()).filter(Boolean);
  };

  const parseMissingList = (str) => {
    if (!str) return [];
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        return parsed.map(item => {
          if (typeof item === 'object' && item !== null) {
            return {
              skill: item.skill || item.name || '',
              reason: item.reason || item.detail || 'Adding this skill increases ATS keyword relevancy and recruiter discovery.'
            };
          }
          return {
            skill: String(item),
            reason: 'Adding this skill increases ATS keyword relevancy and recruiter discovery.'
          };
        }).filter(i => Boolean(i.skill));
      }
    } catch (e) {}
    return str.split(',').map(s => s.trim()).filter(Boolean).map(skill => ({
      skill,
      reason: 'Adding this skill increases ATS keyword relevancy and recruiter discovery.'
    }));
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
          <p style={{ color: 'var(--text-secondary)' }}>Evaluating resume with AI...</p>
        </div>
      </div>
    );
  }

  const techSkills = latestAnalysis ? parseList(latestAnalysis.technicalSkills) : [];
  const softSkills = latestAnalysis ? parseList(latestAnalysis.softSkills) : [];
  const missingKeywords = latestAnalysis ? parseMissingList(latestAnalysis.missingKeywords) : [];

  return (
    <div className="animate-fade-in">
      <ResumeSubNav resumeId={resumeId} resumeTitle={resumeData?.fileName} />

      {/* Top Banner with Run Analysis Action */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            AI Health Check & ATS Breakdown
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
            Comprehensive evaluation of keywords, grammar, metrics quantification, and ATS structure
          </p>
        </div>

        <button
          onClick={handleRunAnalysis}
          className="btn btn-primary"
          disabled={analyzing}
        >
          <RotateCw size={16} className={analyzing ? 'spin-anim' : ''} />
          <span>{analyzing ? 'Analyzing with AI...' : 'Re-Run AI Analysis'}</span>
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

      {!latestAnalysis ? (
        <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <Sparkles size={48} style={{ color: 'var(--accent-primary)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            No Analysis Run Yet
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24, maxWidth: 460, margin: '0 auto 24px' }}>
            Click the button below to perform an instant, in-depth evaluation of your resume text against ATS industry benchmarks.
          </p>
          <button
            onClick={handleRunAnalysis}
            className="btn btn-primary"
            disabled={analyzing}
          >
            <Sparkles size={16} />
            <span>{analyzing ? 'Evaluating...' : 'Run First Analysis'}</span>
          </button>
        </div>
      ) : (
        <>
          {/* Score Cards Grid */}
          <div className="grid-4" style={{ marginBottom: 28 }}>
            <ScoreCard
              title="Overall Score"
              score={latestAnalysis.overallScore}
              subtitle="Aggregated evaluation"
              icon={Award}
            />
            <ScoreCard
              title="ATS Compatibility"
              score={latestAnalysis.atsScore}
              subtitle="Machine parseability"
              icon={FileCheck}
            />
            <ScoreCard
              title="Grammar & Tone"
              score={latestAnalysis.grammarScore}
              subtitle="Clarity and professionalism"
              icon={MessageSquare}
            />
            <ScoreCard
              title="Impact & Clarity"
              score={latestAnalysis.clarityScore}
              subtitle="Metric quantification"
              icon={TrendingUp}
            />
          </div>

          {/* Executive Summary Card */}
          <div className="glass-card" style={{ padding: '28px', marginBottom: 28, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Sparkles size={20} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                AI Executive Summary
              </h3>
            </div>
            <p style={{ fontSize: '0.95rem', color: '#e2e8f0', lineHeight: 1.7, fontStyle: 'normal' }}>
              {latestAnalysis.summary}
            </p>
          </div>

          {/* Skills Breakdown Grid */}
          <div className="grid-2" style={{ marginBottom: 28 }}>
            {/* Technical Skills */}
            <div className="glass-card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Cpu size={18} color="var(--accent-primary)" />
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                    Detected Technical Skills ({techSkills.length})
                  </h4>
                </div>
              </div>

              {techSkills.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No standard technical keywords recognized.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {techSkills.map((skill, idx) => (
                    <SkillChip key={idx} label={skill} type="tech" />
                  ))}
                </div>
              )}
            </div>

            {/* Soft Skills */}
            <div className="glass-card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={18} color="var(--accent-cyan)" />
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                    Detected Soft Skills & Leadership ({softSkills.length})
                  </h4>
                </div>
              </div>

              {softSkills.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No soft skills detected.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {softSkills.map((skill, idx) => (
                    <SkillChip key={idx} label={skill} type="soft" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Missing Keywords & Recommended Additions with Details */}
          {missingKeywords.length > 0 && (
            <div className="glass-card" style={{ padding: '28px', marginBottom: 28, borderColor: 'rgba(244, 63, 94, 0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <AlertCircle size={20} color="var(--accent-rose)" />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                  Recommended High-Value Keywords to Add ({missingKeywords.length})
                </h4>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                Applicant Tracking Systems (ATS) and hiring managers actively filter resumes using these keywords. Here is why each should be integrated:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                {missingKeywords.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '16px 18px',
                      background: 'rgba(244, 63, 94, 0.04)',
                      border: '1px solid rgba(244, 63, 94, 0.2)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <SkillChip label={item.skill} type="missing" />
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#fda4af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        High ATS Value
                      </span>
                    </div>
                    <p style={{ fontSize: '0.86rem', color: '#e2e8f0', lineHeight: 1.5, margin: 0 }}>
                      <strong style={{ color: '#fda4af' }}>Why add this: </strong>
                      {item.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Suggestions Checklist */}
          {latestAnalysis.suggestions && (
            <div className="glass-card" style={{ padding: '28px', marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <CheckCircle2 size={20} color="var(--accent-emerald)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                  Actionable Improvement Recommendations
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {latestAnalysis.suggestions.split('\n').filter(Boolean).map((sug, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.9rem',
                      color: '#cbd5e1'
                    }}
                  >
                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: 'var(--accent-emerald)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2
                    }}>
                      ✓
                    </div>
                    <div>{sug.replace(/^[•\-*]\s*/, '')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historical Trend Chart for this Resume */}
          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                  Analysis Version History ({analyses.length} passes)
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Tracking score changes across successive AI checks for this document
                </p>
              </div>
            </div>
            <ScoreTrendChart data={analyses} />
          </div>
        </>
      )}
    </div>
  );
}
