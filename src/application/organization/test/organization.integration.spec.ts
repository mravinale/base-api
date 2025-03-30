import 'reflect-metadata';
import { expect } from 'chai';
import supertest from 'supertest';
import { container } from 'tsyringe';

import { Server } from "../../../infrastructure/config/server";
import { OrganizationDto } from "../dtos/organizationDto";
import { DbConnection } from "../../../infrastructure/config/dbConnection";
import { UsersRepository } from "../../users/usersRepository";
import { CryptoService } from "../../../infrastructure/utils/CryptoService";
import { generateUserModel } from "../../../infrastructure/utils/Models";
import { auth } from '../../../infrastructure/config/authConfiguration';

// Helper function to generate a mock organization model
const generateOrganizationModel = () => {
  return {
    name: `Org-${Math.random().toString(36).substring(2, 10)}`
  };
};

describe(`Organization Controller`, () => {
  let server: Server;
  let app: supertest.SuperTest<supertest.Test>;
  let dbConnection: DbConnection;
  let cryptoService: CryptoService;
  let usersRepository: UsersRepository;
  let testUser: any;
  let authToken: string;
  let createdOrgId: string | undefined;
  let testOrgName: string;
  const TEST_SUITE_NAME = 'organization-integration';

  // This will run once before all tests
  before(async function() {
    this.timeout(20000); // Increase timeout for setup
    
    console.log('Starting test setup...');
    
    // Add a delay to ensure resources from previous tests are released
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Initialize dependencies
    dbConnection = container.resolve(DbConnection);
    await dbConnection.initializeDbConnection();
    cryptoService = container.resolve(CryptoService);
    usersRepository = container.resolve(UsersRepository);
    
    console.log('Creating test user for authentication...');
    // Create a test user for authentication with unique identifier
    const timestamp = new Date().getTime();
    testUser = generateUserModel();
    testUser.email = `org-user-${timestamp}@testuser.com`; // Make email unique
    testUser.password = "testPassword"; // Store plain password for login tests
    
    console.log('Test user model:', JSON.stringify(testUser, null, 2));
    
    // Save with encrypted password
    const encryptedUser = {...testUser};
    encryptedUser.password = cryptoService.encrypt(testUser.password);
    console.log('Encrypted test user:', JSON.stringify(encryptedUser, null, 2));
    
    try {
      const savedUser = await usersRepository.create(encryptedUser);
      console.log('Saved test user result:', savedUser ? 'Success' : 'Failed');
      
      // Ensure the user was created successfully
      if (!savedUser) {
        throw new Error('Failed to create test user for authentication');
      }
    } catch (error) {
      console.error('Error creating test user:', (error as Error).message);
      // Continue anyway, as the user might already exist
    }
    
    // Reset better-auth memory state by forcing re-authentication
    try {
      // Clear any existing sessions first
      await auth.api.signOut({
        headers: {}
      });
    } catch (error) {
      // Ignore signout errors
      console.log('Signout might have failed, continuing:', (error as Error).message);
    }

    // Register the test user with better-auth
    try {
      console.log('Registering test user with better-auth...');
      await auth.api.signUpEmail({
        body: {
          email: testUser.email,
          password: testUser.password,
          name: testUser.name || testUser.email.split('@')[0],
          metadata: {
            role: testUser.role
          }
        }
      });
      console.log('Test user registered with better-auth');
    } catch (error: unknown) {
      console.log('Error registering with better-auth, user might already exist:', (error as Error).message);
      // Continue anyway, as the user might already exist in better-auth
    }
    
    console.log('Initializing server...');
    // Initialize server
    server = new Server();
    await server.start();
    app = supertest(server.app);
    
    // Login with retry logic
    let maxRetries = 3;
    let retryCount = 0;
    let loginSuccess = false;
    
    while (retryCount < maxRetries && !loginSuccess) {
      try {
        console.log(`Login attempt ${retryCount + 1}/${maxRetries}...`);
        
        // Add small delay between retries
        if (retryCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const loginResponse = await app
          .post("/security/login")
          .send({
            email: testUser.email,
            password: testUser.password
          });
        
        console.log('Login response status:', loginResponse.status);
        
        if (loginResponse.status === 200 && loginResponse.body && loginResponse.body.token) {
          authToken = loginResponse.body.token;
          console.log('Auth token obtained successfully');
          loginSuccess = true;
        } else {
          console.error('Login failed:', loginResponse.body);
          retryCount++;
        }
      } catch (error) {
        console.error('Error during login attempt:', (error as Error).message);
        retryCount++;
      }
    }
    
    if (!loginSuccess) {
      throw new Error('Failed to login and get auth token after multiple attempts');
    }
    
    console.log('Creating model for tests...');
    // Create model for tests with unique timestamp
    testOrgName = `Org-${Math.random().toString(36).substring(2, 10)}`;
    console.log('Test organization name:', testOrgName);
  });

  // This will run once after all tests
  after(async function() {
    this.timeout(15000); // Increase timeout for cleanup
    
    console.log('Cleaning up after tests...');
    
    // Clean up created test organizations and users
    try {
      if (createdOrgId) {
        console.log(`Deleting created test organization with ID: ${createdOrgId}`);
        const response = await app
          .delete(`/organization/${createdOrgId}`)
          .set('Authorization', `Bearer ${authToken}`);
        
        if (response.status === 200) {
          console.log('Test organization deleted successfully');
        } else {
          console.error('Failed to delete test organization:', response.status, response.body);
        }
      }
    } catch (error) {
      console.error('Error cleaning up test organization:', (error as Error).message);
    }
    
    try {
      if (testUser && testUser.id) {
        console.log(`Deleting authentication test user with ID: ${testUser.id}`);
        await usersRepository.delete(testUser.id);
        console.log('Authentication test user deleted successfully');
      }
    } catch (error) {
      console.error('Error cleaning up test user:', (error as Error).message);
    }

    // Properly stop the server
    if (server) {
      try {
        console.log('Stopping server...');
        await server.stop();
        console.log('Server stopped successfully');
      } catch (error) {
        console.error('Error stopping server:', (error as Error).message);
      }
    }
    
    // Close the database connection
    if (dbConnection && dbConnection.datasource && dbConnection.datasource.isInitialized) {
      try {
        console.log('Closing database connection...');
        await dbConnection.datasource.destroy();
        console.log('Database connection closed successfully');
      } catch (error) {
        console.error('Error closing database connection:', (error as Error).message);
      }
    }
    
    // Add a delay to allow resources to fully release
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Cleanup completed');
  });

  describe('POST /organization', () => {
    it('should create a new organization', async () => {
      const orgDto = new OrganizationDto({
        name: testOrgName
      });
      
      console.log('Creating organization with DTO:', JSON.stringify(orgDto, null, 2));
      
      const response = await app
        .post('/organization')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orgDto);

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('id');
      expect(response.body.name).to.equal(testOrgName);
      
      // Save the created organization ID for later tests and cleanup
      createdOrgId = response.body.id;
      console.log(`Created test organization with ID: ${createdOrgId}`);
    });
  });

  describe('GET /organization', () => {
    it('should get paginated organizations', async () => {
      const response = await app
        .get('/organization?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('docs');
      expect(response.body).to.have.property('count');
      expect(response.body.docs).to.be.an('array');
    });
  });

  describe('GET /organization/:id', () => {
    it('should get organization by ID', async function() {
      // Skip if no organization was created
      if (!createdOrgId) {
        console.error('No organization ID available for testing');
        this.skip();
        return;
      }
      
      const response = await app
        .get(`/organization/${createdOrgId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('id');
      expect(response.body.id).to.equal(createdOrgId);
      expect(response.body.name).to.equal(testOrgName);
    });

    it('should return 404 for non-existent organization', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      const response = await app
        .get(`/organization/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(404);
    });
  });

  describe('PUT /organization/:id', () => {
    it('should update an organization', async function() {
      // Skip if no organization was created
      if (!createdOrgId) {
        console.error('No organization ID available for testing');
        this.skip();
        return;
      }
      
      const updatedName = `Updated-${Math.random().toString(36).substring(2, 10)}`;
      
      const response = await app
        .put(`/organization/${createdOrgId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: updatedName
        });

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('id');
      expect(response.body.id).to.equal(createdOrgId);
      expect(response.body.name).to.equal(updatedName);
      
      // Update the test organization name for future tests
      testOrgName = updatedName;
    });
  });

  describe('DELETE /organization/:id', () => {
    it('should delete an organization', async function() {
      
      // Create a new organization specifically for this delete test
      const deleteOrgName = `DeleteOrg-${Math.random().toString(36).substring(2, 10)}`;
      
      const createResponse = await app
        .post('/organization')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: deleteOrgName
        });
      
      expect(createResponse.status).to.equal(201);
      const deleteOrgId = createResponse.body.id;
      
      // Delete the organization
      const response = await app
        .delete(`/organization/${deleteOrgId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      
      // Verify organization was deleted
      const getResponse = await app
        .get(`/organization/${deleteOrgId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(getResponse.status).to.equal(404);
    });
  });
});
