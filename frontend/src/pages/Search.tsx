import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { matchingAPI } from '../services/api';
import { SalesCompany, DecisionMaker } from '../types';

export const Search: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<(SalesCompany | DecisionMaker)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('検索キーワードを入力してください');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      let response;
      if (user?.userType === 'sales_company') {
        response = await matchingAPI.searchDecisionMakers({ industry: searchTerm });
        setResults(response.data.decisionMakers);
      } else {
        response = await matchingAPI.searchSalesCompanies({ industry: searchTerm });
        setResults(response.data.salesCompanies);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '検索に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (targetId: string) => {
    const message = prompt('マッチング申請メッセージを入力してください:');
    if (!message) return;

    try {
      await matchingAPI.sendMatchRequest({
        decisionMakerId: targetId,
        message
      });
      setMessage('マッチング申請を送信しました');
    } catch (err: any) {
      setError(err.response?.data?.error || 'マッチング申請の送信に失敗しました');
    }
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem',
  };

  const searchBoxStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
  };

  const inputStyle: React.CSSProperties = {
    width: 'calc(100% - 120px)',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    marginRight: '1rem',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '1rem',
  };

  const requestButtonStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  };

  return (
    <div style={containerStyle}>
      <div style={searchBoxStyle}>
        <h2 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
          {user?.userType === 'sales_company' ? '決裁者検索' : '営業会社検索'}
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

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="業界名で検索"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={inputStyle}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} disabled={loading} style={buttonStyle}>
            {loading ? '検索中...' : '検索'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div>
          <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
            検索結果 ({results.length}件)
          </h3>
          
          {results.map((result: any) => (
            <div key={result.id} style={cardStyle}>
              {user?.userType === 'sales_company' ? (
                // 決裁者の情報を表示
                <>
                  <h4 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>
                    {result.firstName} {result.lastName}
                  </h4>
                  <p style={{ color: '#7f8c8d', marginBottom: '0.5rem' }}>
                    {result.position} - {result.companyName}
                  </p>
                  <p style={{ color: '#34495e', marginBottom: '0.5rem' }}>
                    業界: {result.industry}
                  </p>
                  <p style={{ color: '#34495e', marginBottom: '0.5rem' }}>
                    会社規模: {result.companySize}
                  </p>
                  {result.interests && result.interests.length > 0 && (
                    <p style={{ color: '#34495e', marginBottom: '1rem' }}>
                      関心: {result.interests.join(', ')}
                    </p>
                  )}
                  <button
                    onClick={() => handleSendRequest(result.id)}
                    style={requestButtonStyle}
                  >
                    マッチング申請
                  </button>
                </>
              ) : (
                // 営業会社の情報を表示
                <>
                  <h4 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>
                    {result.companyName}
                  </h4>
                  <p style={{ color: '#7f8c8d', marginBottom: '0.5rem' }}>
                    業界: {result.industry}
                  </p>
                  <p style={{ color: '#34495e', marginBottom: '0.5rem' }}>
                    従業員数: {result.employees}名
                  </p>
                  {result.website && (
                    <p style={{ color: '#34495e', marginBottom: '0.5rem' }}>
                      ウェブサイト: <a href={result.website} target="_blank" rel="noopener noreferrer" style={{ color: '#3498db' }}>{result.website}</a>
                    </p>
                  )}
                  <p style={{ color: '#34495e', marginBottom: '0.5rem' }}>
                    {result.description}
                  </p>
                  {result.services && result.services.length > 0 && (
                    <p style={{ color: '#34495e', marginBottom: '1rem' }}>
                      サービス: {result.services.join(', ')}
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && searchTerm && (
        <div style={{ textAlign: 'center', color: '#7f8c8d', marginTop: '2rem' }}>
          検索結果が見つかりませんでした
        </div>
      )}
    </div>
  );
};