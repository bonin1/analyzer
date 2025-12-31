export interface Company {
  id: number;
  ein: string;
  name: string;
  website: string | null;
  mission: string | null;
  currentRevenue: number;
  currentExpenses: number;
  currentAssets: number;
  currentEmployeeCount: number;
  previousRevenue: number;
  previousExpenses: number;
  previousAssets: number;
  previousEmployeeCount: number;
  taxYear: number;
  filingDate: string | null;
  deltas: {
    revenue: Delta;
    expenses: Delta;
    assets: Delta;
    employees: Delta;
  };
}

export interface Delta {
  absolute: number | null;
  percentage: number | null;
}

export interface Personnel {
  id: number;
  fullName: string;
  title: string;
  compensation: number;
}

export interface ExpenseCategory {
  id: number;
  category: string;
  amount: number;
}

export interface CompanyDetail extends Omit<Company, 'deltas'> {
  personnel: Personnel[];
  expenseCategories: ExpenseCategory[];
  deltas: {
    revenue: Delta;
    expenses: Delta;
    assets: Delta;
    employees: Delta;
  };
  analytics: {
    classification: {
      type: string;
      description: string;
      color: string;
    };
    staffingGrowth: {
      badge: string;
      level: string;
      color: string;
      description: string;
    };
    financialHealth: {
      netIncome: number;
      profitMargin: string;
      assetGrowthRate: string;
    };
  };
}

export interface CompaniesResponse {
  data: Company[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
