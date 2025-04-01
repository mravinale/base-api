import 'reflect-metadata';
import moduleAlias from 'module-alias';
import path from 'path';

// Register module aliases for compiled JavaScript files in dist
moduleAlias.addAliases({
  '@root': path.join(__dirname, '../dist'), // Adjust root if necessary
  '@application': path.join(__dirname, '../dist/src/application'),
  '@domain': path.join(__dirname, '../dist/src/domain'),
  '@infrastructure': path.join(__dirname, '../dist/src/infrastructure')
});

// Now that aliases are registered, dynamically require initContainer
const { initContainer } = require('@infrastructure/config/ioc');

// Ensure proper environment loading for tests
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

console.log('Test setup initialized with NODE_ENV:', process.env.NODE_ENV);

// Initialize the dependency injection container
initContainer();
console.log('Dependency container initialized for tests.');