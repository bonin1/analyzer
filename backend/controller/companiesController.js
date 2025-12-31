const { Company, Personnel, ExpenseCategory } = require('../models');
const { Op } = require('sequelize');
const { calculatePercentageChange, calculateAbsoluteChange } = require('../helpers/dataHelper');
const logger = require('../config/logger');

/**
 * Get all companies with search, sort, and pagination
 * GET /api/companies
 * Query params:
 *  - search: Search term for name, EIN, or mission
 *  - sortBy: Field to sort by (name, revenue, expenses, etc.)
 *  - sortOrder: asc or desc
 *  - page: Page number (default: 1)
 *  - limit: Items per page (default: 25)
 */
const getAllCompanies = async (req, res) => {
  try {
    const {
      search = '',
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 25
    } = req.query;

    // Validate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        error: 'Invalid page number'
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        error: 'Invalid limit. Must be between 1 and 100'
      });
    }

    // Build where clause for search
    const whereClause = search ? {
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { ein: { [Op.like]: `%${search}%` } },
        { mission: { [Op.like]: `%${search}%` } }
      ]
    } : {};

    // Validate sort field
    const allowedSortFields = [
      'name', 'ein', 'currentRevenue', 'currentExpenses', 
      'currentAssets', 'currentEmployeeCount', 'taxYear'
    ];
    
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const sortDirection = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Query database
    const { count, rows } = await Company.findAndCountAll({
      where: whereClause,
      order: [[sortField, sortDirection]],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
      attributes: [
        'id',
        'ein',
        'name',
        'website',
        'mission',
        'currentRevenue',
        'currentExpenses',
        'currentAssets',
        'currentEmployeeCount',
        'previousRevenue',
        'previousExpenses',
        'previousAssets',
        'previousEmployeeCount',
        'taxYear',
        'filingDate'
      ]
    });

    // Calculate deltas for each company
    const companiesWithDeltas = rows.map(company => {
      const data = company.toJSON();
      
      // Check if we have previous year data
      const hasPreviousData = data.previousRevenue !== null && 
                              data.previousRevenue !== undefined &&
                              data.previousExpenses !== null && 
                              data.previousExpenses !== undefined &&
                              data.previousAssets !== null && 
                              data.previousAssets !== undefined &&
                              data.previousEmployeeCount !== null && 
                              data.previousEmployeeCount !== undefined;
      
      return {
        ...data,
        deltas: {
          revenue: {
            absolute: hasPreviousData ? calculateAbsoluteChange(data.currentRevenue, data.previousRevenue) : null,
            percentage: hasPreviousData ? calculatePercentageChange(data.currentRevenue, data.previousRevenue) : null
          },
          expenses: {
            absolute: hasPreviousData ? calculateAbsoluteChange(data.currentExpenses, data.previousExpenses) : null,
            percentage: hasPreviousData ? calculatePercentageChange(data.currentExpenses, data.previousExpenses) : null
          },
          assets: {
            absolute: hasPreviousData ? calculateAbsoluteChange(data.currentAssets, data.previousAssets) : null,
            percentage: hasPreviousData ? calculatePercentageChange(data.currentAssets, data.previousAssets) : null
          },
          employees: {
            absolute: hasPreviousData ? calculateAbsoluteChange(data.currentEmployeeCount, data.previousEmployeeCount) : null,
            percentage: hasPreviousData ? calculatePercentageChange(data.currentEmployeeCount, data.previousEmployeeCount) : null
          }
        }
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      data: companiesWithDeltas,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    logger.error('Error fetching companies', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'Failed to fetch companies',
      message: error.message
    });
  }
};

/**
 * Get single company by ID with detailed analytics
 * GET /api/companies/:id
 */
const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch company with related data
    const company = await Company.findByPk(id, {
      include: [
        {
          model: Personnel,
          as: 'personnel',
          attributes: ['id', 'fullName', 'title', 'compensation']
        },
        {
          model: ExpenseCategory,
          as: 'expenseCategories',
          attributes: ['id', 'category', 'amount']
        }
      ]
    });

    if (!company) {
      return res.status(404).json({
        error: 'Company not found'
      });
    }

    const data = company.toJSON();

    // Check if we have previous year data
    const hasPreviousData = data.previousRevenue !== null && 
                            data.previousRevenue !== undefined &&
                            data.previousExpenses !== null && 
                            data.previousExpenses !== undefined &&
                            data.previousAssets !== null && 
                            data.previousAssets !== undefined &&
                            data.previousEmployeeCount !== null && 
                            data.previousEmployeeCount !== undefined;

    // Calculate deltas
    const deltas = {
      revenue: {
        absolute: hasPreviousData ? calculateAbsoluteChange(data.currentRevenue, data.previousRevenue) : null,
        percentage: hasPreviousData ? calculatePercentageChange(data.currentRevenue, data.previousRevenue) : null
      },
      expenses: {
        absolute: hasPreviousData ? calculateAbsoluteChange(data.currentExpenses, data.previousExpenses) : null,
        percentage: hasPreviousData ? calculatePercentageChange(data.currentExpenses, data.previousExpenses) : null
      },
      assets: {
        absolute: hasPreviousData ? calculateAbsoluteChange(data.currentAssets, data.previousAssets) : null,
        percentage: hasPreviousData ? calculatePercentageChange(data.currentAssets, data.previousAssets) : null
      },
      employees: {
        absolute: hasPreviousData ? calculateAbsoluteChange(data.currentEmployeeCount, data.previousEmployeeCount) : null,
        percentage: hasPreviousData ? calculatePercentageChange(data.currentEmployeeCount, data.previousEmployeeCount) : null
      }
    };

    // Calculate analytics
    const analytics = {
      // Profitable vs Scaling classification
      classification: calculateClassification(data, deltas),
      
      // Staffing growth badge
      staffingGrowth: calculateStaffingGrowth(deltas.employees),
      
      // Financial health metrics
      financialHealth: {
        netIncome: data.currentRevenue - data.currentExpenses,
        profitMargin: data.currentRevenue > 0 
          ? ((data.currentRevenue - data.currentExpenses) / data.currentRevenue * 100).toFixed(2) 
          : 0,
        assetGrowthRate: deltas.assets.percentage.toFixed(2)
      }
    };

    res.json({
      ...data,
      deltas,
      analytics
    });
  } catch (error) {
    logger.error('Error fetching company', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'Failed to fetch company',
      message: error.message
    });
  }
};

/**
 * Helper: Calculate company classification (Profitable vs Scaling)
 */
function calculateClassification(data, deltas) {
  const isProfitable = data.currentRevenue > data.currentExpenses;
  
  // Scaling: Expense growth > Revenue growth
  const isScaling = deltas.expenses.percentage > deltas.revenue.percentage;
  
  if (isProfitable && !isScaling) {
    return {
      type: 'Profitable',
      description: 'Revenue exceeds expenses with controlled growth',
      color: 'green'
    };
  } else if (isScaling) {
    return {
      type: 'Scaling',
      description: 'Growing expenses faster than revenue to fuel expansion',
      color: 'blue'
    };
  } else {
    return {
      type: 'Restructuring',
      description: 'Operating at a loss, may need strategic adjustments',
      color: 'orange'
    };
  }
}

/**
 * Helper: Calculate staffing growth badge
 */
function calculateStaffingGrowth(employeeDelta) {
  const growthRate = employeeDelta.percentage;
  
  if (growthRate >= 20) {
    return {
      badge: 'Rapid Growth',
      level: 'high',
      color: 'green',
      description: `${growthRate.toFixed(1)}% staff increase`
    };
  } else if (growthRate >= 10) {
    return {
      badge: 'Steady Growth',
      level: 'medium',
      color: 'blue',
      description: `${growthRate.toFixed(1)}% staff increase`
    };
  } else if (growthRate > 0) {
    return {
      badge: 'Modest Growth',
      level: 'low',
      color: 'gray',
      description: `${growthRate.toFixed(1)}% staff increase`
    };
  } else if (growthRate === 0) {
    return {
      badge: 'Stable',
      level: 'neutral',
      color: 'gray',
      description: 'No change in staffing'
    };
  } else {
    return {
      badge: 'Downsizing',
      level: 'negative',
      color: 'red',
      description: `${Math.abs(growthRate).toFixed(1)}% staff reduction`
    };
  }
}

module.exports = {
  getAllCompanies,
  getCompanyById
};
