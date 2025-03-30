// This file is used to register module aliases for tests
const moduleAlias = require('module-alias');

// Register module aliases for compiled JavaScript files
moduleAlias.addAliases({
  '@root': __dirname,
  '@application': __dirname + '/dist/src/application',
  '@domain': __dirname + '/dist/src/domain',
  '@infrastructure': __dirname + '/dist/src/infrastructure'
});

// Ensure proper environment loading for tests
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

console.log('Test setup initialized with NODE_ENV:', process.env.NODE_ENV);
