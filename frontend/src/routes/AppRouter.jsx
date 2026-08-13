import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ResumeListPage } from '../pages/ResumeListPage';
import { ResumeUploadPage } from '../pages/ResumeUploadPage';
import { ResumeDetailPage } from '../pages/ResumeDetailPage';
import { ResumeAnalysisPage } from '../pages/ResumeAnalysisPage';
import { JobMatchPage } from '../pages/JobMatchPage';
import { ImprovementPage } from '../pages/ImprovementPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export function AppRouter() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resumes"
        element={
          <ProtectedRoute>
            <ResumeListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resumes/upload"
        element={
          <ProtectedRoute>
            <ResumeUploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resumes/:resumeId"
        element={
          <ProtectedRoute>
            <ResumeDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resumes/:resumeId/analysis"
        element={
          <ProtectedRoute>
            <ResumeAnalysisPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resumes/:resumeId/job-match"
        element={
          <ProtectedRoute>
            <JobMatchPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resumes/:resumeId/improve"
        element={
          <ProtectedRoute>
            <ImprovementPage />
          </ProtectedRoute>
        }
      />

      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
