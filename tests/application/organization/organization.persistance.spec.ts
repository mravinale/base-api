import 'reflect-metadata';
import { assert } from 'chai';
import { container } from 'tsyringe';

import { OrganizationRepository } from "@application/organization/organizationRepository";
import { DbConnection } from '@infrastructure/config/dbConnection';
import { PaginationDto } from "@infrastructure/utils/PaginationDto";

// Helper function to generate a mock organization model
const generateOrganizationModel = () => {
  return {
    name: `Test-Org-${Math.random().toString(36).substring(2, 10)}`
  };
};

// Helper function to retry database operations
const retryOperation = async (operation, maxRetries = 3, delay = 500) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Attempt ${attempt}/${maxRetries} failed:`, (error as Error).message);
      lastError = error;
      
      if (attempt < maxRetries) {
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Helper function to ensure database connection is initialized
const ensureDbConnection = async (dbConnection: DbConnection) => {
  if (!dbConnection.datasource || !dbConnection.datasource.isInitialized) {
    console.log('Database connection not initialized, initializing now...');
    await dbConnection.initializeDbConnection();
  }
  
  // Verify the connection is actually working
  try {
    // Try a simple query to verify connection
    await dbConnection.datasource.query('SELECT 1');
    console.log('Database connection verified');
  } catch (error) {
    console.log('Database connection verification failed, reinitializing...');
    // If connection verification fails, try to close and reopen
    if (dbConnection.datasource && dbConnection.datasource.isInitialized) {
      try {
        await dbConnection.datasource.destroy();
      } catch (destroyError) {
        console.log('Error destroying datasource:', (destroyError as Error).message);
      }
    }
    
    // Reinitialize
    await dbConnection.initializeDbConnection();
    console.log('Database connection reinitialized');
  }
  
  return dbConnection;
};

describe('Organization Repository', () => {
  let organizationRepository: OrganizationRepository;
  let dbConnection: DbConnection;
  let model = generateOrganizationModel();
  let createdOrgId: string = '';

  // Setup - run before all tests
  before(async function() {
    this.timeout(30000); // Increase timeout for database connection
    
    console.log('Setting up Organization Repository tests...');
    
    // Add a delay to ensure resources from previous tests are released
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      // Get database connection
      dbConnection = container.resolve(DbConnection);
      
      // Ensure database connection is initialized and working
      await ensureDbConnection(dbConnection);
      
      // Create a new repository instance with the verified connection
      organizationRepository = new OrganizationRepository(dbConnection);
      console.log('Organization repository created');
    } catch (error) {
      console.error('Error in test setup:', (error as Error).message);
      throw error;
    }
  });

  // Cleanup - run after all tests
  after(async function() {
    this.timeout(15000); // Increase timeout for cleanup
    
    console.log('Cleaning up Organization Repository tests...');
    
    // Clean up created organization if any
    if (createdOrgId) {
      try {
        console.log(`Deleting test organization with ID: ${createdOrgId}`);
        await retryOperation(async () => {
          return await organizationRepository.delete(createdOrgId);
        });
        console.log('Test organization deleted successfully');
      } catch (error) {
        console.error('Error cleaning up test organization:', (error as Error).message);
      }
    }
    
    // Add a delay to ensure resources are released
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Cleanup completed');
  });

  // Test organization creation
  it('should create an organization', async function() {
    this.timeout(10000); // Increase timeout for this test
    
    try {
      console.log('Testing organization creation with:', model.name);
      
      // Verify database connection before test
      await ensureDbConnection(dbConnection);
      
      // Create organization with retry logic
      const result = await retryOperation(async () => {
        return await organizationRepository.create(model);
      });
      
      console.log('Created organization:', result);
      
      // Save ID for cleanup and other tests
      if (result && result.id) {
        createdOrgId = result.id;
        console.log('Saved organization ID:', createdOrgId);
      } else {
        throw new Error('Created organization is missing ID');
      }
      
      // Assert
      assert.isNotNull(result, 'Result is null');
      assert.equal(result.name, model.name, `Result name is not equal to ${model.name}`);
    } catch (error) {
      console.error('Error creating organization:', (error as Error).message);
      throw error;
    }
  });

  // Test getting organization by ID
  it('should get an organization by id', async function() {
    this.timeout(10000); // Increase timeout for this test
    
    // Skip if organization was not created
    if (!createdOrgId) {
      console.log('Skipping test because organization creation failed');
      this.skip();
      return;
    }
    
    try {
      console.log(`Getting organization with ID: ${createdOrgId}`);
      
      // Verify database connection before test
      await ensureDbConnection(dbConnection);
      
      // Get organization with retry logic
      const result = await retryOperation(async () => {
        return await organizationRepository.get(createdOrgId);
      });
      
      // Assert
      assert.isNotNull(result, 'Result is null');
      assert.equal(result.id, createdOrgId, `Result id is not equal to ${createdOrgId}`);
    } catch (error) {
      console.error('Error getting organization:', (error as Error).message);
      throw error;
    }
  });

  // Test getting paginated organizations
  it('should get paginated organizations', async function() {
    this.timeout(10000); // Increase timeout for this test
    
    try {
      // Create a pagination DTO
      const paginationDto = new PaginationDto({
        page: 1,
        limit: 10
      });
      
      console.log('Testing pagination with:', paginationDto);
      
      // Verify database connection before test
      await ensureDbConnection(dbConnection);
      
      // Get paginated organizations with retry logic
      const result = await retryOperation(async () => {
        return await organizationRepository.getPaginated(paginationDto);
      });
      
      // Assert
      assert.isNotNull(result, 'Result is null');
      assert.isArray(result.docs, 'Result docs is not an array');
      assert.isNumber(result.count, 'Result count is not a number');
      
      // Check if our created organization is in the results
      if (createdOrgId) {
        const foundOrg = result.docs.find(org => (org as any).id === createdOrgId);
        console.log('Found organization in paginated results:', !!foundOrg);
      }
    } catch (error) {
      console.error('Error testing pagination:', (error as Error).message);
      throw error;
    }
  });

  // Test updating an organization
  it('should update an organization', async function() {
    this.timeout(10000); // Increase timeout for this test
    
    // Skip if organization was not created
    if (!createdOrgId) {
      console.log('Skipping test because organization creation failed');
      this.skip();
      return;
    }
    
    try {
      // Create update data
      const updatedName = `${model.name}-updated`;
      console.log(`Updating organization ${createdOrgId} with name: ${updatedName}`);
      
      // Verify database connection before test
      await ensureDbConnection(dbConnection);
      
      // Update organization with retry logic
      const result = await retryOperation(async () => {
        return await organizationRepository.update(createdOrgId, { name: updatedName });
      });
      
      // Assert
      assert.isNotNull(result, 'Result is null');
      assert.equal(result.id, createdOrgId, `Result id is not equal to ${createdOrgId}`);
      assert.equal(result.name, updatedName, `Result name is not equal to ${updatedName}`);
    } catch (error) {
      console.error('Error updating organization:', (error as Error).message);
      throw error;
    }
  });

  // Test getting a non-existent organization
  it('should return null when getting non-existent organization', async function() {
    this.timeout(10000); // Increase timeout for this test
    
    try {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      console.log(`Testing get with non-existent ID: ${nonExistentId}`);
      
      // Verify database connection before test
      await ensureDbConnection(dbConnection);
      
      // Get non-existent organization with retry logic
      const result = await retryOperation(async () => {
        return await organizationRepository.get(nonExistentId);
      });
      
      // Assert
      assert.isNull(result, 'Result is not null');
    } catch (error) {
      console.error('Error testing non-existent organization:', (error as Error).message);
      throw error;
    }
  });
});
