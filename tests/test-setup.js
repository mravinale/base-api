// This file is used to register module aliases for tests
const moduleAlias = require('module-alias');
const path = require('path');

// Register module aliases for compiled JavaScript files
moduleAlias.addAliases({
  '@root': path.join(__dirname, '..'),
  '@application': path.join(__dirname, '../src/application'),
  '@domain': path.join(__dirname, '../src/domain'),
  '@infrastructure': path.join(__dirname, '../src/infrastructure')
});

// Ensure proper environment loading for tests
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

console.log('Test setup initialized with NODE_ENV:', process.env.NODE_ENV);
