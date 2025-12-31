'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { companiesApi } from '@/lib/api/companies';
import { CompanyDetail } from '@/types/company';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import DeltaDisplay from '@/components/ui/DeltaDisplay';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params?.id as string;

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await companiesApi.getById(companyId);
        setCompany(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load company details');
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      fetchCompany();
    }
  }, [companyId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">Loading company details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert type="error" message={error || 'Company not found'} />
          <button
            onClick={() => router.push('/companies')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            ← Back to Companies
          </button>
        </div>
      </div>
    );
  }

  // Prepare expense data for chart
  const expenseChartData = company.expenseCategories
    .sort((a, b) => b.amount - a.amount)
    .map((exp) => ({
      category: exp.category.length > 20 ? exp.category.substring(0, 20) + '...' : exp.category,
      amount: exp.amount
    }));

  const getClassificationColor = (color: string) => {
    const colors: Record<string, string> = {
      green: 'bg-green-100 text-green-800',
      blue: 'bg-blue-100 text-blue-800',
      orange: 'bg-orange-100 text-orange-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800'
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.push('/companies')}
          className="mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          ← Back to Companies
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
            <span>EIN: {company.ein}</span>
            <span>•</span>
            <span>Tax Year: {company.taxYear}</span>
            {company.website && (
              <>
                <span>•</span>
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Website
                </a>
              </>
            )}
          </div>
        </div>

        {/* Classification and Staffing Badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <h3 className="text-lg font-semibold mb-2">Organization Type</h3>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getClassificationColor(company.analytics.classification.color)}`}>
                {company.analytics.classification.type}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {company.analytics.classification.description}
            </p>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-2">Staffing Trend</h3>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getClassificationColor(company.analytics.staffingGrowth.color)}`}>
                {company.analytics.staffingGrowth.badge}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {company.analytics.staffingGrowth.description}
            </p>
          </Card>
        </div>

        {/* Mission */}
        {company.mission && (
          <Card className="mb-8">
            <h3 className="text-lg font-semibold mb-2">Mission</h3>
            <p className="text-gray-700">{company.mission}</p>
          </Card>
        )}

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Revenue</h3>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(company.currentRevenue)}
            </div>
            <div className="mt-2">
              <DeltaDisplay
                value={company.deltas.revenue.absolute}
                percentage={company.deltas.revenue.percentage}
                label="vs. Prior Year"
                format="currency"
              />
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Expenses</h3>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(company.currentExpenses)}
            </div>
            <div className="mt-2">
              <DeltaDisplay
                value={company.deltas.expenses.absolute}
                percentage={company.deltas.expenses.percentage}
                label="vs. Prior Year"
                format="currency"
              />
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Net Income</h3>
            <div className={`text-2xl font-bold ${company.analytics.financialHealth.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(company.analytics.financialHealth.netIncome)}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Profit Margin: {company.analytics.financialHealth.profitMargin}%
            </div>
          </Card>
        </div>

        {/* Assets and Employees */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Assets</h3>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(company.currentAssets)}
            </div>
            <div className="mt-2">
              <DeltaDisplay
                value={company.deltas.assets.absolute}
                percentage={company.deltas.assets.percentage}
                label="vs. Prior Year"
                format="currency"
              />
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Employees</h3>
            <div className="text-2xl font-bold text-gray-900">
              {company.currentEmployeeCount.toLocaleString()}
            </div>
            <div className="mt-2">
              <DeltaDisplay
                value={company.deltas.employees.absolute}
                percentage={company.deltas.employees.percentage}
                label="vs. Prior Year"
                format="number"
              />
            </div>
          </Card>
        </div>

        {/* Key Personnel */}
        {company.personnel.length > 0 && (
          <Card className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Key Personnel</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Compensation
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {company.personnel.map((person) => (
                    <tr key={person.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {person.fullName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {person.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(person.compensation)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Expense Categories */}
        {company.expenseCategories.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold mb-4">Expense Breakdown</h3>
            
            <div className="mb-6" style={{ height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="category" 
                    angle={-45} 
                    textAnchor="end" 
                    height={120}
                    interval={0}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="amount" fill="#3b82f6" name="Amount" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % of Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {company.expenseCategories
                    .sort((a, b) => b.amount - a.amount)
                    .map((expense) => {
                      const percentage = (expense.amount / company.currentExpenses) * 100;
                      return (
                        <tr key={expense.id}>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {expense.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                            {percentage.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
