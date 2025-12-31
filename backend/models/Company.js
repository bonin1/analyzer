const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ein: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false,
    comment: 'Employer Identification Number'
  },
  name: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Company name'
  },
  website: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Company website URL'
  },
  mission: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Mission description'
  },
  
  // Current Year Data
  currentRevenue: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Total revenue for current year'
  },
  currentExpenses: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Total expenses for current year'
  },
  currentAssets: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Total assets for current year'
  },
  currentEmployeeCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: 'Number of employees for current year'
  },
  
  // Previous Year Data
  previousRevenue: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Total revenue for previous year'
  },
  previousExpenses: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Total expenses for previous year'
  },
  previousAssets: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Total assets for previous year'
  },
  previousEmployeeCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: 'Number of employees for previous year'
  },
  
  // Metadata
  taxYear: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Tax year of the filing'
  },
  filingDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date of filing'
  }
}, {
  tableName: 'companies',
  timestamps: true,
  indexes: [
    {
      fields: ['ein']
    },
    {
      fields: ['name']
    }
  ]
});

module.exports = Company;
