import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';

export function UploadDropzone({ onFileSelected, isUploading, uploadProgress = 0, onSampleLoaded }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSelect = (file) => {
    setError('');
    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(extension)) {
      setError('Please upload a PDF, DOCX, or TXT file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB.');
      return;
    }

    setSelectedFile(file);
    if (onFileSelected) {
      onFileSelected(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelect(e.target.files[0]);
    }
  };

  const handleSampleResume = () => {
    const sampleText = `Alex Chen - Senior Full Stack Engineer
Email: alex.chen@example.com | GitHub: github.com/alexchen | LinkedIn: linkedin.com/in/alexchen

SUMMARY
Results-oriented Senior Software Engineer with 6+ years of experience designing and scaling distributed systems, RESTful microservices, and modern web applications using Java, Spring Boot, React, and AWS. Passionate about system performance, test automation, and developer ergonomics.

TECHNICAL SKILLS
Languages: Java (17/21), TypeScript, JavaScript, SQL, Python
Frameworks & Libraries: Spring Boot, Spring Data JPA, Hibernate, React, Redux, Node.js, Express, Next.js
Databases & Caching: PostgreSQL, MySQL, Redis, MongoDB
Cloud & DevOps: AWS (EC2, S3, RDS, Lambda), Docker, Kubernetes, CI/CD (GitHub Actions), Terraform
Testing & Tools: JUnit 5, Mockito, Jest, Git, Maven, Postman, Linux

PROFESSIONAL EXPERIENCE
Senior Software Engineer | CloudScale Systems (2022 – Present)
• Architected and developed high-throughput Spring Boot microservices handling 5M+ daily requests with 99.99% availability.
• Optimized MySQL database queries and indexed high-load tables, reducing API response latency by 45%.
• Integrated Redis caching cluster, cutting repeated database queries by 60% during peak traffic hours.
• Mentored 4 junior engineers on clean code practices, code reviews, and test-driven development.

Software Engineer | FinTech Innovations (2019 – 2022)
• Built full-stack features using React and Java Spring Boot for real-time transaction processing.
• Automated CI/CD pipeline deployment to AWS ECS via GitHub Actions, reducing release cycle time from 3 days to 20 minutes.
• Designed and documented RESTful APIs with OpenAPI/Swagger specifications for cross-team integration.
• Authored comprehensive automated test suites achieving 88% code coverage with JUnit and Mockito.

EDUCATION
Bachelor of Science in Computer Science | University of Technology (2015 – 2019)`;

    const blob = new Blob([sampleText], { type: 'text/plain' });
    const file = new File([blob], 'Alex_Chen_Senior_FullStack_Resume.txt', { type: 'text/plain' });
    validateAndSelect(file);
    if (onSampleLoaded) onSampleLoaded(file);
  };

  return (
    <div>
      <div
        className={`dropzone ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          style={{ display: 'none' }}
          onChange={handleChange}
        />

        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid var(--border-bright)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          color: 'var(--accent-primary)'
        }}>
          <UploadCloud size={32} />
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8, color: '#fff' }}>
          {selectedFile ? selectedFile.name : 'Drag & drop your resume here'}
        </h3>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
          Supports <span className="badge badge-pdf">PDF</span>, <span className="badge badge-docx">DOCX</span>, and <span className="badge badge-txt">TXT</span> up to 10MB
        </p>

        <button 
          type="button" 
          className="btn btn-secondary btn-sm"
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
        >
          <FileText size={15} />
          <span>Browse Files</span>
        </button>
      </div>

      {error && (
        <div style={{
          marginTop: 16,
          padding: '12px 16px',
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: 'var(--radius-md)',
          color: '#fda4af',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: '0.88rem'
        }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {selectedFile && !isUploading && (
        <div style={{
          marginTop: 20,
          padding: '16px 20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)'
            }}>
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                {selectedFile.name}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {(selectedFile.size / 1024).toFixed(1)} KB • Ready to analyze
              </div>
            </div>
          </div>
          <span className="badge badge-pdf" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7' }}>
            Selected
          </span>
        </div>
      )}

      {isUploading && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
            <span>Uploading and extracting resume text...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div style={{
            width: '100%',
            height: 8,
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${uploadProgress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-cyan))',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <button
          type="button"
          onClick={handleSampleResume}
          className="btn btn-secondary btn-sm"
          style={{ background: 'rgba(99, 102, 241, 0.08)', borderColor: 'rgba(99, 102, 241, 0.25)', color: '#c7d2fe' }}
        >
          <Sparkles size={14} />
          <span>Load Sample Senior Full Stack Resume</span>
        </button>
      </div>
    </div>
  );
}
