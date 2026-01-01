'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { datasetApi } from '@/lib/api/dataset';
import { companiesApi } from '@/lib/api/companies';
import { Company } from '@/types/company';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [zipUrl, setZipUrl] = useState('https://apps.irs.gov/pub/epostcard/990/xml/2025/2025_TEOS_XML_01A.zip');
  const [maxCompanies, setMaxCompanies] = useState('1000');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const response = await companiesApi.getAll({ limit: 100, sortBy: 'currentRevenue', sortOrder: 'desc' });
        setCompanies(response.data || []);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleImportDataset = async () => {
    if (!zipUrl.trim()) {
      setImportResult({
        type: 'error',
        message: 'Please enter a ZIP file URL'
      });
      return;
    }

    const limit = maxCompanies ? parseInt(maxCompanies) : undefined;
    if (limit && (isNaN(limit) || limit < 1)) {
      setImportResult({
        type: 'error',
        message: 'Max companies must be a positive number'
      });
      return;
    }

    setImportLoading(true);
    setImportResult(null);
    
    try {
      const result = await datasetApi.importDataset(zipUrl, limit);
      setImportResult({
        type: 'success',
        message: `Successfully imported ${result.results.success} companies (${result.results.skipped} skipped, ${result.results.failed} failed)`
      });
      setShowUrlInput(false);
      setZipUrl('');
      // Refresh stats after import
      const response = await companiesApi.getAll({ limit: 100, sortBy: 'currentRevenue', sortOrder: 'desc' });
      setCompanies(response.data || []);
    } catch (error: any) {
      setImportResult({
        type: 'error',
        message: error.message || 'Failed to import dataset'
      });
    } finally {
      setImportLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Prepare chart data
  const topRevenueData = companies.slice(0, 10).map((company) => ({
    name: company.name.length > 20 ? company.name.substring(0, 20) + '...' : company.name,
    revenue: company.currentRevenue
  }));

  const growthData = companies
    .filter((c) => c.deltas?.revenue?.percentage !== undefined)
    .sort((a, b) => (b.deltas?.revenue?.percentage || 0) - (a.deltas?.revenue?.percentage || 0))
    .slice(0, 10)
    .map((company) => ({
      name: company.name.length > 20 ? company.name.substring(0, 20) + '...' : company.name,
      growth: company.deltas?.revenue?.percentage || 0
    }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'];

  const totalRevenue = companies.reduce((sum, c) => sum + c.currentRevenue, 0);
  const totalEmployees = companies.reduce((sum, c) => sum + c.currentEmployeeCount, 0);
  const avgRevenue = companies.length > 0 ? totalRevenue / companies.length : 0;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Non-Profit Analyzer
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user.username}
              </span>
              <Button variant="secondary" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to your Dashboard
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Username</h3>
                <p className="mt-1 text-sm text-gray-900">{user.username}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="mt-1 text-sm text-gray-900">{user.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Role</h3>
                <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {user.role}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Account Status</h3>
                <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </Card>

          {/* Statistics Dashboard */}
          {!statsLoading && companies.length > 0 && (
            <>
              {/* Key Metrics */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Total Organizations</h3>
                  <div className="text-3xl font-bold text-gray-900">{companies.length}</div>
                </Card>
                <Card>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Total Revenue</h3>
                  <div className="text-3xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</div>
                </Card>
                <Card>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Total Employees</h3>
                  <div className="text-3xl font-bold text-gray-900">{totalEmployees.toLocaleString()}</div>
                </Card>
              </div>

              {/* Charts */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Organizations by Revenue */}
                <Card>
                  <h3 className="text-lg font-semibold mb-4">Top 10 Organizations by Revenue</h3>
                  <div style={{ height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topRevenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={120}
                          interval={0}
                        />
                        <YAxis 
                          tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                        />
                        <Tooltip 
                          formatter={(value: any) => formatCurrency(value)}
                        />
                        <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Top Revenue Growth */}
                <Card>
                  <h3 className="text-lg font-semibold mb-4">Top 10 Revenue Growth (%)</h3>
                  <div style={{ height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={growthData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={120}
                          interval={0}
                        />
                        <YAxis 
                          tickFormatter={(value) => `${value.toFixed(0)}%`}
                        />
                        <Tooltip 
                          formatter={(value: any) => `${value.toFixed(2)}%`}
                        />
                        <Bar dataKey="growth" fill="#10b981" name="Growth %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* Revenue Distribution Pie Chart */}
              <div className="mt-6">
                <Card>
                  <h3 className="text-lg font-semibold mb-4">Revenue Distribution - Top 10 Organizations</h3>
                  <div style={{ height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={topRevenueData}
                          dataKey="revenue"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          label={(entry: any) => `${entry.name}: ${formatCurrency(entry.revenue)}`}
                          labelLine={true}
                        >
                          {topRevenueData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </>
          )}

          {statsLoading && (
            <div className="mt-6">
              <Card>
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading statistics...</p>
                </div>
              </Card>
            </div>
          )}

          <div className="mt-6">
            <Card>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              
              {importResult && (
                <Alert 
                  type={importResult.type} 
                  message={importResult.message}
                  className="mb-4"
                />
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  fullWidth
                  onClick={() => router.push('/companies')}
                >
                  Browse Companies
                </Button>
                {user.role === 'admin' && (
                  <Button 
                    variant="secondary" 
                    fullWidth
                    onClick={() => setShowUrlInput(!showUrlInput)}
                  >
                    Import Dataset
                  </Button>
                )}
              </div>
              
              {user.role === 'admin' && showUrlInput && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP File URL (containing Form 990 XML files)
                    </label>
                    <input
                      type="url"
                      value={zipUrl}
                      onChange={(e) => setZipUrl(e.target.value)}
                      placeholder="https://apps.irs.gov/pub/epostcard/990/xml/2025/2025_TEOS_XML_01A.zip"
                      className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Download Form 990 XML datasets from <a href="https://www.irs.gov/charities-non-profits/form-990-series-downloads" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">IRS.gov Form 990 Downloads</a>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Companies to Import (optional)
                    </label>
                    <input
                      type="number"
                      value={maxCompanies}
                      onChange={(e) => setMaxCompanies(e.target.value)}
                      placeholder="1000"
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Leave empty to import all companies in the ZIP file
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleImportDataset}
                      disabled={importLoading || !zipUrl.trim()}
                    >
                      {importLoading ? 'Importing...' : 'Start Import'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowUrlInput(false);
                        setImportResult(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

