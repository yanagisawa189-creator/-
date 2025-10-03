import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navStyle: React.CSSProperties = {
    backgroundColor: '#2c3e50',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'white',
  };

  const logoStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    textDecoration: 'none',
    color: 'white',
  };

  const linkStyle: React.CSSProperties = {
    color: 'white',
    textDecoration: 'none',
    margin: '0 1rem',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    transition: 'background-color 0.3s',
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  };

  return (
    <nav style={navStyle}>
      <Link to="/" style={logoStyle}>
        ビジネスマッチング
      </Link>
      
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/dashboard" style={linkStyle}>
            ダッシュボード
          </Link>
          <Link to="/profile" style={linkStyle}>
            プロフィール
          </Link>
          <Link to="/search" style={linkStyle}>
            検索
          </Link>
          <Link to="/requests" style={linkStyle}>
            マッチング申請
          </Link>
          <span style={{ margin: '0 1rem', color: '#bdc3c7' }}>
            {user.email}
          </span>
          <button onClick={handleLogout} style={buttonStyle}>
            ログアウト
          </button>
        </div>
      ) : (
        <div>
          <Link to="/login" style={linkStyle}>
            ログイン
          </Link>
          <Link to="/register" style={linkStyle}>
            登録
          </Link>
        </div>
      )}
    </nav>
  );
};