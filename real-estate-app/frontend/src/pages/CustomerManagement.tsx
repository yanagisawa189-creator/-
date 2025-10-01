import React, { useState } from 'react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'prospect' | 'active' | 'closed' | 'inactive';
  lastContact: string;
  property: string;
  budget: string;
  notes: string;
}

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  property: string;
  budget: string;
  notes: string;
}

const CustomerManagement: React.FC = () => {
  const [customers] = useState<Customer[]>([
    {
      id: '1',
      name: '田中 太郎',
      email: 'tanaka@example.com',
      phone: '090-1234-5678',
      status: 'active',
      lastContact: '2024-01-15',
      property: '京都市左京区マンション',
      budget: '3,000-4,000万円',
      notes: '駅近希望、ペット可物件を探している'
    },
    {
      id: '2',
      name: '佐藤 花子',
      email: 'sato@example.com',
      phone: '090-2345-6789',
      status: 'prospect',
      lastContact: '2024-01-10',
      property: '城陽市戸建て',
      budget: '2,500-3,500万円',
      notes: '子育て世代、学校区重視'
    },
    {
      id: '3',
      name: '鈴木 一郎',
      email: 'suzuki@example.com',
      phone: '090-3456-7890',
      status: 'closed',
      lastContact: '2024-01-12',
      property: '宇治市新築',
      budget: '4,000万円',
      notes: '成約済み - 宇治市の新築戸建て'
    }
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    property: '',
    budget: '',
    notes: ''
  });

  const getStatusBadge = (status: Customer['status']) => {
    const statusConfig = {
      prospect: { label: '見込み', color: 'bg-yellow-100 text-yellow-800' },
      active: { label: '商談中', color: 'bg-blue-100 text-blue-800' },
      closed: { label: '成約', color: 'bg-green-100 text-green-800' },
      inactive: { label: '非活性', color: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('新規顧客登録:', formData);
    setIsAddModalOpen(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      property: '',
      budget: '',
      notes: ''
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* ページヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">顧客管理</h1>
          <p className="text-gray-600 mt-1">顧客情報と商談状況の管理</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>新規顧客追加</span>
        </button>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">検索</label>
            <input
              type="text"
              placeholder="顧客名またはメールアドレスで検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">すべて</option>
              <option value="prospect">見込み</option>
              <option value="active">商談中</option>
              <option value="closed">成約</option>
              <option value="inactive">非活性</option>
            </select>
          </div>
        </div>
      </div>

      {/* 顧客リスト */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  顧客名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  連絡先
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  希望物件
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  予算
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最終連絡
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(customer.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.property}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.budget}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.lastContact}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      詳細
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      編集
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新規顧客追加モーダル */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">新規顧客追加</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">顧客名 *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">予算</label>
                  <input
                    type="text"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    placeholder="例: 3,000-4,000万円"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">希望物件</label>
                <input
                  type="text"
                  name="property"
                  value={formData.property}
                  onChange={handleInputChange}
                  placeholder="例: 京都市左京区マンション"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="顧客の要望やメモを入力してください"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  登録
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 顧客詳細モーダル */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">顧客詳細</h2>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">顧客名</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCustomer.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ステータス</label>
                  <div className="mt-1">{getStatusBadge(selectedCustomer.status)}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCustomer.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">電話番号</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCustomer.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">希望物件</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCustomer.property}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">予算</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCustomer.budget}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">最終連絡日</label>
                <p className="mt-1 text-sm text-gray-900">{selectedCustomer.lastContact}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">備考</label>
                <p className="mt-1 text-sm text-gray-900">{selectedCustomer.notes}</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-6">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                閉じる
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                編集
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;