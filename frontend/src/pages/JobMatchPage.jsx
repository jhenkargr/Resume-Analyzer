import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/api';
import { ResumeSubNav } from '../components/ResumeSubNav';
import { SkillChip } from '../components/SkillChip';
import { 
  Target, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RotateCw, 
  FileText, 
  Briefcase,
  History,
  Check,
  X
} from 'lucide-react';

export function JobMatchPage() {
  const { resumeId } = useParams();
  const [resumeData, setResumeData] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [matchResult, setMatchResult] = useState(null);
  const [pastMatches, setPastMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [resumeId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resData, matchData] = await Promise.all([
        api.resumes.get(resumeId),
        api.jobMatch.getList(resumeId)
      ]);
      setResumeData(resData?.resume);
      const list = matchData?.jobMatches || [];
      setPastMatches(list);
      if (list.length > 0) {
        setMatchResult(list[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load job match data.');
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async (e) => {
    if (e) e.preventDefault();
    if (!jobDescription.trim()) {
      setError('Please enter or select a job description.');
      return;
    }

    setMatching(true);
    setError('');
    try {
      const res = await api.jobMatch.run(resumeId, jobDescription);
      const newMatch = res?.jobMatch;
      if (newMatch) {
        setMatchResult(newMatch);
        setPastMatches([newMatch, ...pastMatches]);
      }
    } catch (err) {
      setError(err.message || 'Failed to match job description.');
    } finally {
      setMatching(false);
    }
  };

  const loadSampleJD = (type) => {
    let sample = '';
    if (type === 'backend') {
      sample = `Senior Backend Engineer (Java / AWS / Distributed Systems)
We are seeking an experienced Senior Backend Engineer to design and scale high-throughput services.
Requirements:
- 5+ years building backend microservices with Java, Spring Boot, and REST APIs.
- Extensive experience with MySQL / PostgreSQL schema optimization and Redis caching.
- Hands-on cloud architecture in AWS (ECS, Lambda, S3, RDS, CloudWatch).
- Strong knowledge of Docker, Kubernetes, and automated CI/CD pipelines.
- Experience with Kafka or RabbitMQ event streaming is a strong plus.`;
    } else if (type === 'fullstack') {
      sample = `Lead Full Stack Developer (React / TypeScript / Node.js)
Looking for a versatile Full Stack Developer to build modern interactive client experiences and scalable backend services.
Requirements:
- Strong proficiency in React, TypeScript, Next.js, and modern CSS/Tailwind.
- Robust experience with Node.js, Express, PostgreSQL, and GraphQL.
- Deep understanding of web performance, accessibility, and state management.
- Experience with Docker, cloud deployments on AWS/GCP, and testing (Jest, Cypress).`;
    } else if (type === 'cloud') {
      sample = `Cloud DevOps & Platform Engineer
Seeking a Platform Engineer to manage our multi-region cloud infrastructure and automate delivery.
Requirements:
- Deep expertise in Kubernetes, Docker, and Linux systems administration.
- Advanced Infrastructure-as-Code with Terraform and AWS CloudFormation.
- Hands-on experience creating robust CI/CD pipelines with GitHub Actions.
- Monitoring & observability with Prometheus, Grafana, and Datadog.`;
    }
    setJobDescription(sample);
  };

  const parseList = (str) => {
    if (!str) return [];
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
    return str.split(',').map(s => s.trim()).filter(Boolean);
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
          <p style={{ color: 'var(--text-secondary)' }}>Loading job matcher...</p>
        </div>
      </div>
    );
  }

  const matchedSkills = matchResult ? parseList(matchResult.matchedSkills) : [];
  const missingSkills = matchResult ? parseList(matchResult.missingSkills) : [];

  return (
    <div className="animate-fade-in">
      <ResumeSubNav resumeId={resumeId} resumeTitle={resumeData?.fileName} />

      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
          Target Job Description Matcher
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
          Paste any job posting or requirements to calculate your match percentage and discover missing keywords
        </p>
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

      {/* Input Area + Presets */}
      <div className="glass-card" style={{ padding: '28px', marginBottom: 32 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <label className="form-label" style={{ marginBottom: 0 }}>
            Paste Job Description (JD)
          </label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Load Sample JD:</span>
            <button
              type="button"
              onClick={() => loadSampleJD('backend')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              Backend Java/AWS
            </button>
            <button
              type="button"
              onClick={() => loadSampleJD('fullstack')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              Full Stack React/Node
            </button>
            <button
              type="button"
              onClick={() => loadSampleJD('cloud')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              DevOps/Platform
            </button>
          </div>
        </div>

        <form onSubmit={handleMatch}>
          <textarea
            className="form-textarea"
            placeholder="Paste the target job description requirements, responsibilities, or skills list here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            style={{ minHeight: '160px', marginBottom: 18 }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={matching || !jobDescription.trim()}
            >
              <Target size={16} />
              <span>{matching ? 'Calculating ATS Match...' : 'Calculate Job Match'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Results View */}
      {matchResult && (
        <div className="animate-fade-in">
          {/* Match Score Banner */}
          <div className="glass-card" style={{ padding: '32px', marginBottom: 28 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div className={`score-circle ${matchResult.matchScore >= 80 ? 'high' : matchResult.matchScore >= 60 ? 'medium' : 'low'}`}>
                  <span>{matchResult.matchScore}%</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                    {matchResult.matchScore >= 80 ? 'Strong Candidate Match' : matchResult.matchScore >= 60 ? 'Moderate Role Alignment' : 'Needs Optimization for this Role'}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
                    {matchResult.matchScore >= 80 ? 'Your resume closely mirrors the target job requirements.' :
                     matchResult.matchScore >= 60 ? 'Incorporate key missing technical keywords to boost ATS pass rates.' :
                     'Substantial keyword gaps detected. Consider tailoring your experiences.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'center', padding: '12px 20px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                    {matchedSkills.length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 600 }}>
                    Matched Skills
                  </div>
                </div>

                <div style={{ textAlign: 'center', padding: '12px 20px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
                    {missingSkills.length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#fecdd3', textTransform: 'uppercase', fontWeight: 600 }}>
                    Missing Skills
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Matched vs Missing Skills Grid */}
          <div className="grid-2" style={{ marginBottom: 28 }}>
            {/* Matched Skills */}
            <div className="glass-card" style={{ padding: '28px', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <CheckCircle2 size={20} color="var(--accent-emerald)" />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                  Matched Skills ({matchedSkills.length})
                </h4>
              </div>
              {matchedSkills.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No direct keyword matches found.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {matchedSkills.map((skill, idx) => (
                    <SkillChip key={idx} label={skill} type="matched" />
                  ))}
                </div>
              )}
            </div>

            {/* Missing Skills */}
            <div className="glass-card" style={{ padding: '28px', borderColor: 'rgba(244, 63, 94, 0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <AlertCircle size={20} color="var(--accent-rose)" />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                  Missing Skills Required by JD ({missingSkills.length})
                </h4>
              </div>
              {missingSkills.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)' }}>All extracted requirements satisfied!</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {missingSkills.map((skill, idx) => (
                    <SkillChip key={idx} label={skill} type="missing" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Suggestions */}
          {matchResult.suggestions && (
            <div className="glass-card" style={{ padding: '28px', marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Sparkles size={20} color="var(--accent-cyan)" />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                  Role Tailoring Strategy
                </h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {matchResult.suggestions.split('\n').filter(Boolean).map((sug, idx) => (
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
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'rgba(6, 182, 212, 0.15)',
                      color: 'var(--accent-cyan)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                      fontSize: '0.75rem'
                    }}>
                      •
                    </div>
                    <div>{sug.replace(/^[•\-*]\s*/, '')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Past Matches History */}
      {pastMatches.length > 1 && (
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <History size={18} color="var(--text-secondary)" />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              Previous Job Matches for this Resume ({pastMatches.length})
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pastMatches.map((m, idx) => (
              <div
                key={m.id || idx}
                onClick={() => setMatchResult(m)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  background: matchResult?.id === m.id ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${matchResult?.id === m.id ? 'var(--border-bright)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    color: m.matchScore >= 80 ? 'var(--accent-emerald)' : m.matchScore >= 60 ? 'var(--accent-amber)' : 'var(--accent-rose)'
                  }}>
                    {m.matchScore}% Match
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '500px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.jobDescription ? m.jobDescription.substring(0, 75) + '...' : 'Job match evaluation'}
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'Recent'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
