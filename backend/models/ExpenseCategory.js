const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const ExpenseCategory = sequelize.define('ExpenseCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'companies',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  category: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Expense category name'
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Expense amount'
  },
  taxYear: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Tax year of the expense'
  }
}, {
  tableName: 'expense_categories',
  timestamps: true,
  indexes: [
    {
      fields: ['companyId']
    },
    {
      fields: ['category']
    }
  ]
});

module.exports = ExpenseCategory;
