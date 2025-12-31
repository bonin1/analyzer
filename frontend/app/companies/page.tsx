'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { companiesApi } from '@/lib/api/companies';
import { Company } from '@/types/company';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import DeltaDisplay from '@/components/ui/DeltaDisplay';

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [revenueMin, setRevenueMin] = useState('');
  const [revenueMax, setRevenueMax] = useState('');
  const [employeeMin, setEmployeeMin] = useState('');
  const [employeeMax, setEmployeeMax] = useState('');

  const limit = 25;

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await companiesApi.getAll({
        search,
        sortBy,
        sortOrder,
        page: currentPage,
        limit
      });

      console.log('API Response:', response);
      console.log('Companies data:', response.data);
      console.log('Companies length:', response.data?.length);

      setCompanies(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotal(response.pagination?.total || 0);
    } catch (err: any) {
      console.error('Fetch companies error:', err);
      setError(err.message || 'Failed to load companies');
      setCompanies([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Apply client-side filters
  const filteredCompanies = companies.filter(company => {
    // Revenue filter
    if (revenueMin && company.currentRevenue < parseFloat(revenueMin)) return false;
    if (revenueMax && company.currentRevenue > parseFloat(revenueMax)) return false;
    
    // Employee filter
    if (employeeMin && company.currentEmployeeCount < parseInt(employeeMin)) return false;
    if (employeeMax && company.currentEmployeeCount > parseInt(employeeMax)) return false;
    
    return true;
  });

  const clearFilters = () => {
    setRevenueMin('');
    setRevenueMax('');
    setEmployeeMin('');
    setEmployeeMax('');
  };

  const hasActiveFilters = revenueMin || revenueMax || employeeMin || employeeMax;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Non-Profit Organizations</h1>
          <p className="mt-2 text-sm text-gray-600">
            Browse and analyze IRS Form 990 data for non-profit organizations
          </p>
        </div>

        {error && (
          <Alert type="error" message={error} />
        )}

        <Card>
          <div className="mb-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name, EIN, or mission..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
              >
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
                    {[revenueMin, revenueMax, employeeMin, employeeMax].filter(Boolean).length}
                  </span>
                )}
              </button>
              <div className="text-sm text-gray-600">
                {hasActiveFilters ? `${filteredCompanies.length} of ${total}` : `${total} companies`} found
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Revenue Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Revenue Range
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={revenueMin}
                        onChange={(e) => setRevenueMin(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={revenueMax}
                        onChange={(e) => setRevenueMax(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Employee Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employee Count Range
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={employeeMin}
                        onChange={(e) => setEmployeeMin(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={employeeMax}
                        onChange={(e) => setEmployeeMax(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Filter Buttons */}
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-2">Quick Filters:</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { setRevenueMin('0'); setRevenueMax('100000'); }}
                      className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Small ($0-$100K)
                    </button>
                    <button
                      onClick={() => { setRevenueMin('100000'); setRevenueMax('1000000'); }}
                      className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Medium ($100K-$1M)
                    </button>
                    <button
                      onClick={() => { setRevenueMin('1000000'); setRevenueMax(''); }}
                      className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Large ($1M+)
                    </button>
                    <button
                      onClick={() => { setEmployeeMin('1'); setEmployeeMax('50'); }}
                      className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      1-50 Employees
                    </button>
                    <button
                      onClick={() => { setEmployeeMin('51'); setEmployeeMax(''); }}
                      className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      51+ Employees
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Loading companies...</p>
            </div>
          ) : !filteredCompanies || filteredCompanies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {hasActiveFilters ? 'No companies match your filters' : 'No companies found'}
              </p>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  Clear search
                </button>
              )}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-2 ml-4 text-blue-600 hover:text-blue-700 text-sm"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        onClick={() => handleSort('name')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Organization {getSortIcon('name')}
                      </th>
                      <th
                        onClick={() => handleSort('ein')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        EIN {getSortIcon('ein')}
                      </th>
                      <th
                        onClick={() => handleSort('currentRevenue')}
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Revenue {getSortIcon('currentRevenue')}
                      </th>
                      <th
                        onClick={() => handleSort('currentExpenses')}
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Expenses {getSortIcon('currentExpenses')}
                      </th>
                      <th
                        onClick={() => handleSort('currentEmployeeCount')}
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        Employees {getSortIcon('currentEmployeeCount')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Changes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCompanies.map((company) => (
                      <tr
                        key={company.id}
                        onClick={() => router.push(`/companies/${company.id}`)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {company.name}
                            </div>
                            {company.mission && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {company.mission}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {company.ein}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(company.currentRevenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(company.currentExpenses)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {company.currentEmployeeCount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <DeltaDisplay
                              value={company.deltas.revenue.absolute}
                              percentage={company.deltas.revenue.percentage}
                              label="Revenue"
                              format="currency"
                            />
                            <DeltaDisplay
                              value={company.deltas.employees.absolute}
                              percentage={company.deltas.employees.percentage}
                              label="Staff"
                              format="number"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages && totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
