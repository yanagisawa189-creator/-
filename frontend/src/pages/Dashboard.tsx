import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const containerStyle: React.CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
  };

  const getUserTypeLabel = (userType: string) => {
    return userType === 'sales_company' ? '営業会社' : '決裁者';
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ color: '#2c3e50', marginBottom: '1rem' }}>
          ダッシュボード
        </h1>
        
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#34495e', marginBottom: '1rem' }}>
            ようこそ、{user?.email} さん
          </h2>
          <p style={{ color: '#7f8c8d' }}>
            アカウントタイプ: {user && getUserTypeLabel(user.userType)}
          </p>
        </div>

        {user?.userType === 'sales_company' && (
          <div style={{ ...cardStyle, backgroundColor: '#ecf0f1' }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>
              営業会社向け機能
            </h3>
            <ul style={{ paddingLeft: '1.5rem', color: '#34495e' }}>
              <li>決裁者の検索・閲覧</li>
              <li>マッチング申請の送信</li>
              <li>申請状況の確認</li>
              <li>プロフィールの管理</li>
            </ul>
          </div>
        )}

        {user?.userType === 'decision_maker' && (
          <div style={{ ...cardStyle, backgroundColor: '#ecf0f1' }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>
              決裁者向け機能
            </h3>
            <ul style={{ paddingLeft: '1.5rem', color: '#34495e' }}>
              <li>営業会社の検索・閲覧</li>
              <li>マッチング申請の受信・承認</li>
              <li>申請状況の確認</li>
              <li>プロフィールの管理</li>
            </ul>
          </div>
        )}

        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#d5efde', borderRadius: '4px' }}>
          <h4 style={{ color: '#27ae60', marginBottom: '0.5rem' }}>
            はじめに
          </h4>
          <p style={{ color: '#2c3e50' }}>
            まずは「プロフィール」ページで詳細情報を入力し、「検索」ページで相手を探してみましょう。
          </p>
        </div>
      </div>
    </div>
  );
};