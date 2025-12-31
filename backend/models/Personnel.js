const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Personnel = sequelize.define('Personnel', {
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
  fullName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Full name of personnel'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Job title/position'
  },
  compensation: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Total compensation'
  }
}, {
  tableName: 'personnel',
  timestamps: true,
  indexes: [
    {
      fields: ['companyId']
    }
  ]
});

module.exports = Personnel;
