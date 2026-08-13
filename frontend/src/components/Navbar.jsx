import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  LayoutDashboard, 
  FileText, 
  UploadCloud, 
  LogOut, 
  User as UserIcon 
} from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to={user ? "/dashboard" : "/login"} className="nav-brand">
          <div className="brand-icon">
            <Sparkles size={20} />
          </div>
          <span>AI Resume Analyzer</span>
        </Link>

        {user && (
          <nav className="nav-links">
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={17} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink 
              to="/resumes" 
              end
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <FileText size={17} />
              <span>My Resumes</span>
            </NavLink>

            <NavLink 
              to="/resumes/upload" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <UploadCloud size={17} />
              <span>Upload Resume</span>
            </NavLink>
          </nav>
        )}

        <div className="user-profile-menu">
          {user ? (
            <>
              <div className="user-badge">
                <div className="user-avatar">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {user.fullName || 'User'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {user.email}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleLogout} 
                className="btn btn-secondary btn-sm"
                title="Sign out"
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
