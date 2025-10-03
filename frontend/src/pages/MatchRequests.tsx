import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { matchingAPI } from '../services/api';
import { MatchRequest } from '../types';

export const MatchRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await matchingAPI.getMatchRequests();
      setRequests(response.data.matchRequests);
    } catch (err: any) {
      setError(err.response?.data?.error || 'マッチング申請の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      await matchingAPI.respondToMatchRequest(requestId, status);
      setMessage(`マッチング申請を${status === 'accepted' ? '承認' : '拒否'}しました`);
      loadRequests(); // 再読み込み
    } catch (err: any) {
      setError(err.response?.data?.error || '応答の送信に失敗しました');
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '保留中';
      case 'accepted': return '承認済み';
      case 'rejected': return '拒否済み';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'accepted': return '#27ae60';
      case 'rejected': return '#e74c3c';
      default: return '#7f8c8d';
    }
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem',
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '1rem',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    marginRight: '0.5rem',
  };

  const acceptButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#27ae60',
    color: 'white',
  };

  const rejectButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#e74c3c',
    color: 'white',
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{ color: '#2c3e50', marginBottom: '1rem' }}>
          マッチング申請
        </h2>
        
        {message && (
          <div style={{ 
            backgroundColor: '#d5efde', 
            color: '#27ae60', 
            padding: '0.75rem', 
            borderRadius: '4px', 
            marginBottom: '1rem' 
          }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            padding: '0.75rem', 
            borderRadius: '4px', 
            marginBottom: '1rem' 
          }}>
            {error}
          </div>
        )}

        <p style={{ color: '#7f8c8d' }}>
          {user?.userType === 'sales_company' 
            ? '送信したマッチング申請の一覧です' 
            : '受信したマッチング申請の一覧です'}
        </p>
      </div>

      {requests.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#7f8c8d', padding: '2rem' }}>
          マッチング申請がありません
        </div>
      ) : (
        requests.map((request) => (
          <div key={request.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>
                  申請ID: {request.id.substring(0, 8)}...
                </h4>
                <div style={{ 
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  backgroundColor: getStatusColor(request.status),
                  color: 'white',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  {getStatusLabel(request.status)}
                </div>
              </div>
              <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
                {new Date(request.createdAt).toLocaleDateString('ja-JP')}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h5 style={{ color: '#34495e', marginBottom: '0.5rem' }}>メッセージ:</h5>
              <p style={{ color: '#2c3e50', backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '4px', border: '1px solid #e9ecef' }}>
                {request.message}
              </p>
            </div>

            {user?.userType === 'decision_maker' && request.status === 'pending' && (
              <div>
                <button
                  onClick={() => handleRespond(request.id, 'accepted')}
                  style={acceptButtonStyle}
                >
                  承認
                </button>
                <button
                  onClick={() => handleRespond(request.id, 'rejected')}
                  style={rejectButtonStyle}
                >
                  拒否
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};