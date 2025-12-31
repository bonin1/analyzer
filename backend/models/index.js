const { sequelize } = require('../database');
const Company = require('./Company');
const Personnel = require('./Personnel');
const ExpenseCategory = require('./ExpenseCategory');
const User = require('./User');

// Define relationships
Company.hasMany(Personnel, {
  foreignKey: 'companyId',
  as: 'personnel'
});
Personnel.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'company'
});

Company.hasMany(ExpenseCategory, {
  foreignKey: 'companyId',
  as: 'expenseCategories'
});
ExpenseCategory.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'company'
});

// Sync database (create tables if they don't exist)
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force }); // force: true will drop tables first (use carefully!)
    console.log('✓ Database tables synchronized successfully.');
  } catch (error) {
    console.error('✗ Error synchronizing database:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  Company,
  Personnel,
  User,
  ExpenseCategory,
  syncDatabase
};
