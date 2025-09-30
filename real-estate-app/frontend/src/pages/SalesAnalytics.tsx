import React, { useState } from 'react';

interface SalesData {
  month: string;
  sales: number;
  contracts: number;
  inquiries: number;
}

interface PropertyTypeData {
  type: string;
  count: number;
  revenue: number;
  percentage: number;
}

interface AreaData {
  area: string;
  sales: number;
  contracts: number;
  avgPrice: number;
}

const SalesAnalytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedYear, setSelectedYear] = useState('2024');

  const salesData: SalesData[] = [
    { month: '1月', sales: 8500000, contracts: 3, inquiries: 25 },
    { month: '2月', sales: 12400000, contracts: 4, inquiries: 32 },
    { month: '3月', sales: 15600000, contracts: 5, inquiries: 38 },
    { month: '4月', sales: 9800000, contracts: 3, inquiries: 28 },
    { month: '5月', sales: 18200000, contracts: 6, inquiries: 42 },
    { month: '6月', sales: 22100000, contracts: 7, inquiries: 45 },
    { month: '7月', sales: 19500000, contracts: 6, inquiries: 40 },
    { month: '8月', sales: 16300000, contracts: 5, inquiries: 35 },
    { month: '9月', sales: 20800000, contracts: 6, inquiries: 38 },
    { month: '10月', sales: 24500000, contracts: 8, inquiries: 48 },
    { month: '11月', sales: 21700000, contracts: 7, inquiries: 41 },
    { month: '12月', sales: 26800000, contracts: 9, inquiries: 52 }
  ];

  const propertyTypeData: PropertyTypeData[] = [
    { type: 'マンション', count: 45, revenue: 135000000, percentage: 42 },
    { type: '戸建て', count: 32, revenue: 128000000, percentage: 38 },
    { type: '土地', count: 18, revenue: 54000000, percentage: 15 },
    { type: '商業物件', count: 8, revenue: 32000000, percentage: 5 }
  ];

  const areaData: AreaData[] = [
    { area: '京都市左京区', sales: 45000000, contracts: 12, avgPrice: 3750000 },
    { area: '京都市右京区', sales: 38000000, contracts: 10, avgPrice: 3800000 },
    { area: '城陽市', sales: 32000000, contracts: 14, avgPrice: 2285714 },
    { area: '宇治市', sales: 28000000, contracts: 8, avgPrice: 3500000 },
    { area: '向日市', sales: 24000000, contracts: 6, avgPrice: 4000000 }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ja-JP').format(num);
  };

  const calculateTotal = (data: SalesData[], field: keyof SalesData) => {
    return data.reduce((sum, item) => sum + (item[field] as number), 0);
  };

  const calculateAverage = (data: SalesData[], field: keyof SalesData) => {
    return calculateTotal(data, field) / data.length;
  };

  const getGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100);
  };

  const currentMonthSales = salesData[salesData.length - 1]?.sales || 0;
  const previousMonthSales = salesData[salesData.length - 2]?.sales || 0;
  const salesGrowthRate = getGrowthRate(currentMonthSales, previousMonthSales);

  return (
    <div className="p-6 space-y-6">
      {/* ページヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">売上・業績分析</h1>
          <p className="text-gray-600 mt-1">営業成績と市場動向の詳細分析</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="2024">2024年</option>
            <option value="2023">2023年</option>
            <option value="2022">2022年</option>
          </select>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="month">月次</option>
            <option value="quarter">四半期</option>
            <option value="year">年次</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            レポート出力
          </button>
        </div>
      </div>

      {/* KPI サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">年間売上</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(calculateTotal(salesData, 'sales'))}</p>
              <p className={`text-sm mt-2 ${salesGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {salesGrowthRate >= 0 ? '+' : ''}{salesGrowthRate.toFixed(1)}% 前月比
              </p>
            </div>
            <div className="text-green-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">年間成約数</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(calculateTotal(salesData, 'contracts'))}</p>
              <p className="text-sm mt-2 text-blue-600">月平均 {Math.round(calculateAverage(salesData, 'contracts'))}件</p>
            </div>
            <div className="text-blue-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">成約率</p>
              <p className="text-3xl font-bold text-gray-900">
                {((calculateTotal(salesData, 'contracts') / calculateTotal(salesData, 'inquiries')) * 100).toFixed(1)}%
              </p>
              <p className="text-sm mt-2 text-purple-600">業界平均 65%</p>
            </div>
            <div className="text-purple-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">平均単価</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(calculateTotal(salesData, 'sales') / calculateTotal(salesData, 'contracts'))}
              </p>
              <p className="text-sm mt-2 text-orange-600">前年同期比 +8.2%</p>
            </div>
            <div className="text-orange-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 売上推移グラフ */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">月次売上推移</h2>
        <div className="h-80">
          <div className="flex items-end justify-between h-64 bg-gradient-to-t from-blue-50 to-transparent p-4 rounded-lg">
            {salesData.map((data, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                <div
                  className="bg-blue-600 rounded-t-md w-8 transition-all hover:bg-blue-700"
                  style={{
                    height: `${(data.sales / Math.max(...salesData.map(d => d.sales))) * 200}px`,
                    minHeight: '10px'
                  }}
                  title={`${data.month}: ${formatCurrency(data.sales)}`}
                />
                <span className="text-xs text-gray-600 transform rotate-45">{data.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 物件種別分析 & エリア別分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 物件種別分析 */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">物件種別別売上</h2>
          <div className="space-y-4">
            {propertyTypeData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: `hsl(${index * 90}, 70%, 50%)` }}
                  />
                  <span className="text-sm font-medium text-gray-900">{item.type}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(item.revenue)}</p>
                  <p className="text-xs text-gray-500">{item.count}件 ({item.percentage}%)</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* エリア別分析 */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">エリア別売上</h2>
          <div className="space-y-4">
            {areaData.map((item, index) => (
              <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.area}</p>
                    <p className="text-xs text-gray-500">{item.contracts}件成約</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(item.sales)}</p>
                    <p className="text-xs text-gray-500">平均 {formatCurrency(item.avgPrice)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 月次詳細データテーブル */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">月次詳細データ</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">月</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">売上</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成約数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">問い合わせ数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成約率</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">平均単価</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesData.map((data, index) => {
                const conversionRate = (data.contracts / data.inquiries * 100).toFixed(1);
                const avgPrice = data.sales / data.contracts;

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {data.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(data.sales)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {data.contracts}件
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {data.inquiries}件
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {conversionRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(avgPrice)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesAnalytics;