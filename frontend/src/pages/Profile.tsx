import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';
import { SalesCompany, DecisionMaker } from '../types';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<SalesCompany | DecisionMaker | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      setProfile(response.data.profile);
      setFormData(response.data.profile);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError('プロフィールの読み込みに失敗しました');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
    setFormData((prev: any) => ({
      ...prev,
      [field]: values
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      if (profile) {
        await userAPI.updateProfile(formData);
        setMessage('プロフィールを更新しました');
      } else {
        await userAPI.createProfile(formData);
        setMessage('プロフィールを作成しました');
        loadProfile();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'プロフィールの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '2rem',
  };

  const formStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    padding: '0.75rem 2rem',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    opacity: loading ? 0.7 : 1,
  };

  return (
    <div style={containerStyle}>
      <div style={formStyle}>
        <h2 style={{ marginBottom: '2rem', color: '#2c3e50' }}>
          プロフィール{profile ? '編集' : '作成'}
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

        <form onSubmit={handleSubmit}>
          {user?.userType === 'sales_company' ? (
            <>
              <input
                type="text"
                name="companyName"
                placeholder="会社名"
                value={formData.companyName || ''}
                onChange={handleInputChange}
                required
                style={inputStyle}
              />
              
              <input
                type="text"
                name="industry"
                placeholder="業界"
                value={formData.industry || ''}
                onChange={handleInputChange}
                required
                style={inputStyle}
              />
              
              <textarea
                name="description"
                placeholder="会社説明"
                value={formData.description || ''}
                onChange={handleInputChange}
                required
                rows={4}
                style={inputStyle}
              />
              
              <input
                type="url"
                name="website"
                placeholder="ウェブサイト"
                value={formData.website || ''}
                onChange={handleInputChange}
                style={inputStyle}
              />
              
              <input
                type="number"
                name="employees"
                placeholder="従業員数"
                value={formData.employees || ''}
                onChange={handleInputChange}
                style={inputStyle}
              />
              
              <input
                type="text"
                name="targetIndustries"
                placeholder="ターゲット業界（カンマ区切り）"
                value={formData.targetIndustries ? formData.targetIndustries.join(', ') : ''}
                onChange={(e) => handleArrayInputChange(e, 'targetIndustries')}
                style={inputStyle}
              />
              
              <input
                type="text"
                name="services"
                placeholder="提供サービス（カンマ区切り）"
                value={formData.services ? formData.services.join(', ') : ''}
                onChange={(e) => handleArrayInputChange(e, 'services')}
                style={inputStyle}
              />
            </>
          ) : (
            <>
              <input
                type="text"
                name="firstName"
                placeholder="名"
                value={formData.firstName || ''}
                onChange={handleInputChange}
                required
                style={inputStyle}
              />
              
              <input
                type="text"
                name="lastName"
                placeholder="姓"
                value={formData.lastName || ''}
                onChange={handleInputChange}
                required
                style={inputStyle}
              />
              
              <input
                type="text"
                name="position"
                placeholder="役職"
                value={formData.position || ''}
                onChange={handleInputChange}
                required
                style={inputStyle}
              />
              
              <input
                type="text"
                name="companyName"
                placeholder="会社名"
                value={formData.companyName || ''}
                onChange={handleInputChange}
                required
                style={inputStyle}
              />
              
              <input
                type="text"
                name="industry"
                placeholder="業界"
                value={formData.industry || ''}
                onChange={handleInputChange}
                required
                style={inputStyle}
              />
              
              <select
                name="companySize"
                value={formData.companySize || ''}
                onChange={handleInputChange}
                style={inputStyle}
              >
                <option value="">会社規模を選択</option>
                <option value="1-10">1-10名</option>
                <option value="11-50">11-50名</option>
                <option value="51-200">51-200名</option>
                <option value="201-1000">201-1000名</option>
                <option value="1000+">1000名以上</option>
              </select>
              
              <input
                type="text"
                name="interests"
                placeholder="関心のあるサービス（カンマ区切り）"
                value={formData.interests ? formData.interests.join(', ') : ''}
                onChange={(e) => handleArrayInputChange(e, 'interests')}
                style={inputStyle}
              />
              
              <input
                type="text"
                name="budget"
                placeholder="予算"
                value={formData.budget || ''}
                onChange={handleInputChange}
                style={inputStyle}
              />
            </>
          )}
          
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? '保存中...' : (profile ? '更新' : '作成')}
          </button>
        </form>
      </div>
    </div>
  );
};