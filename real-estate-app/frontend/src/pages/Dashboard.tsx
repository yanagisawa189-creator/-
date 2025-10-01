import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, changeType, icon }) => {
  const changeColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  }[changeType];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <p className={`text-sm mt-2 ${changeColor}`}>{change}</p>
        </div>
        <div className="text-blue-600">{icon}</div>
      </div>
    </div>
  );
};

interface RecentActivityItem {
  id: string;
  type: 'property' | 'customer' | 'contract';
  title: string;
  description: string;
  time: string;
}

const Dashboard: React.FC = () => {
  const metrics = [
    {
      title: '今月の売上',
      value: '¥12,450,000',
      change: '+15.3% 前月比',
      changeType: 'positive' as const,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    },
    {
      title: '新規物件数',
      value: '28',
      change: '+8 件 今週',
      changeType: 'positive' as const,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      title: '成約率',
      value: '67.2%',
      change: '+3.1% 前月比',
      changeType: 'positive' as const,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      title: '顧客数',
      value: '156',
      change: '+12 人 今月',
      changeType: 'positive' as const,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    }
  ];

  const recentActivities: RecentActivityItem[] = [
    {
      id: '1',
      type: 'contract',
      title: '新規成約',
      description: '城陽市寺田水度坂の物件が成約しました',
      time: '2時間前'
    },
    {
      id: '2',
      type: 'customer',
      title: '顧客登録',
      description: '田中様が新規顧客として登録されました',
      time: '4時間前'
    },
    {
      id: '3',
      type: 'property',
      title: '物件登録',
      description: '京都市左京区の新築マンションが登録されました',
      time: '6時間前'
    },
    {
      id: '4',
      type: 'customer',
      title: '商談予定',
      description: '佐藤様との商談が明日14:00に予定されています',
      time: '1日前'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'contract':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'customer':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        );
      case 'property':
        return (
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* ページヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-gray-600 mt-1">不動産業務の全体概要</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            エクスポート
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            レポート作成
          </button>
        </div>
      </div>

      {/* メトリクスカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* チャートとアクティビティ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 売上チャート */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">月間売上推移</h2>
          <div className="h-64 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">チャートプレースホルダー</p>
          </div>
        </div>

        {/* 最近のアクティビティ */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">最近のアクティビティ</h2>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                {getActivityIcon(activity.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors">
            すべて表示
          </button>
        </div>
      </div>

      {/* 物件状況 */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">物件ステータス概要</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">45</p>
            <p className="text-sm text-gray-600">販売中</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">12</p>
            <p className="text-sm text-gray-600">商談中</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">28</p>
            <p className="text-sm text-gray-600">今月成約</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;