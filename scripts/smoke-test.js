#!/usr/bin/env node
// Comprehensive end-to-end smoke test verifying all features:
// register -> login -> upload -> analyze -> job match -> improvements -> dashboard
// Usage: node scripts/smoke-test.js

const fs = require('fs');

const BACKEND = process.env.BACKEND_URL || 'http://localhost:8080';

function log(...args) { console.log('[smoke]', ...args); }

function randEmail() {
  return `dev+${Date.now()}@example.com`;
}

async function postJson(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BACKEND}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  return { status: res.status, ok: res.ok, body: await res.json() };
}

async function getJson(path, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BACKEND}${path}`, {
    method: 'GET',
    headers
  });
  return { status: res.status, ok: res.ok, body: await res.json() };
}

async function main() {
  log('========================================');
  log('AI Resume Analyzer — End-to-End Smoke Test');
  log('Backend URL:', BACKEND);
  log('========================================');

  const email = randEmail();
  const password = 'Test1234!';
  const name = 'Alex Chen SmokeTester';

  // 1. Register
  log('1. Registering user:', email);
  const reg = await postJson('/api/auth/register', { fullName: name, email, password });
  log('   Register status:', reg.status, reg.body.message || '');
  if (!reg.ok) {
    console.error('Registration failed:', reg.body);
    process.exit(1);
  }

  // 2. Login
  log('2. Logging in...');
  const login = await postJson('/api/auth/login', { email, password });
  if (!login.ok) {
    console.error('Login failed:', login.body);
    process.exit(1);
  }
  const token = login.body.token;
  log('   Login successful! JWT Token acquired (length):', token?.length || 0);

  // 3. User Profile
  log('3. Verifying /api/users/me...');
  const me = await getJson('/api/users/me', token);
  if (!me.ok || !me.body.user) {
    console.error('Failed to get /users/me:', me.body);
    process.exit(1);
  }
  log('   User profile confirmed:', me.body.user.fullName, `(${me.body.user.email})`);

  // 4. Upload Resume
  log('4. Uploading resume file...');
  const samplePath = './scripts/sample.txt';
  let fileBuf;
  if (fs.existsSync(samplePath)) {
    fileBuf = fs.readFileSync(samplePath);
  } else {
    fileBuf = Buffer.from('Alex Chen - Senior Java & React Engineer. Experienced in Spring Boot, MySQL, Docker, and AWS.');
  }

  const form = new FormData();
  const blob = new Blob([fileBuf], { type: 'text/plain' });
  form.append('file', blob, 'sample_resume.txt');

  const upRes = await fetch(`${BACKEND}/api/resumes/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  const upJson = await upRes.json();
  log('   Upload status:', upRes.status, upJson.message || '');
  if (!upRes.ok) {
    console.error('Upload failed:', upJson);
    process.exit(1);
  }
  const resumeId = upJson.resume?.id;
  log('   Resume created successfully with ID:', resumeId);

  // 5. Run Analysis
  log('5. Triggering AI Resume Analysis...');
  const analysisRes = await postJson(`/api/analysis/${resumeId}`, {}, token);
  log('   Analysis status:', analysisRes.status, analysisRes.body.message || '');
  if (!analysisRes.ok) {
    console.error('Analysis failed:', analysisRes.body);
    process.exit(1);
  }
  const analysis = analysisRes.body.analysis;
  log('   -> Overall Score:', analysis.overallScore, '/ 100');
  log('   -> ATS Score:', analysis.atsScore, '/ 100');
  log('   -> Grammar Score:', analysis.grammarScore, '/ 100');
  log('   -> Clarity Score:', analysis.clarityScore, '/ 100');
  log('   -> Detected Technical Skills:', analysis.technicalSkills);

  // 6. Job Match
  log('6. Running Job Description Match...');
  const sampleJD = 'Looking for a Senior Backend Developer with experience in Java, Spring Boot, MySQL, AWS, and Docker.';
  const matchRes = await postJson(`/api/job-match/${resumeId}`, { jobDescription: sampleJD }, token);
  log('   Job match status:', matchRes.status, matchRes.body.message || '');
  if (!matchRes.ok) {
    console.error('Job match failed:', matchRes.body);
    process.exit(1);
  }
  const jobMatch = matchRes.body.jobMatch;
  log('   -> Match Score:', jobMatch.matchScore, '%');
  log('   -> Matched Skills:', jobMatch.matchedSkills);
  log('   -> Missing Skills:', jobMatch.missingSkills);

  // 7. Resume Improvement
  log('7. Generating AI Rewrites / Improvements...');
  const impRes = await postJson(`/api/improvements/${resumeId}`, {}, token);
  log('   Improvement status:', impRes.status, impRes.body.message || '');
  if (!impRes.ok) {
    console.error('Improvement generation failed:', impRes.body);
    process.exit(1);
  }
  const improvement = impRes.body.improvement;
  log('   -> Improved Summary:', improvement.improvedSummary?.substring(0, 80) + '...');
  log('   -> Suggested Keywords:', improvement.suggestedKeywords);

  // 8. Dashboard Summary & History
  log('8. Testing Dashboard Endpoints...');
  const dashSum = await getJson('/api/dashboard/summary', token);
  if (!dashSum.ok) {
    console.error('Dashboard summary failed:', dashSum.body);
    process.exit(1);
  }
  log('   -> Total Resumes:', dashSum.body.totalResumes);
  log('   -> Total Analyses:', dashSum.body.totalAnalyses);
  log('   -> Total Job Matches:', dashSum.body.totalJobMatches);
  log('   -> Average Score:', dashSum.body.averageScore);

  const dashHist = await getJson('/api/dashboard/history', token);
  if (!dashHist.ok) {
    console.error('Dashboard history failed:', dashHist.body);
    process.exit(1);
  }
  log('   -> Score History data points:', dashHist.body.history?.length || 0);

  log('========================================');
  log(' ALL ENDPOINTS & FLOWS VERIFIED 100% SUCCESS');
  log('========================================');
}

main().catch(err => { console.error(err); process.exit(1); });
