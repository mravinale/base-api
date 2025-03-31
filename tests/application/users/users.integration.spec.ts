import 'reflect-metadata';
import { expect, assert } from 'chai';
import supertest from 'supertest';
import { container } from 'tsyringe';

import { Server } from "@infrastructure/config/server";
import { UserDto } from "@application/users/dtos/userDto";
import { generateUserModel } from "@infrastructure/utils/Models";
import { CryptoService } from "@infrastructure/utils/CryptoService";
import { UsersRepository } from "@application/users/usersRepository";
import { UsersService } from "@application/users/usersService"; // Import UsersService
import { MapperService } from "@infrastructure/utils/Mapper"; // Import MapperService with correct path
import { DbConnection } from "@infrastructure/config/dbConnection";
import { auth } from '@infrastructure/config/authConfiguration';

const entityName: string = 'user';  

describe(`Users Controller`, () => {

  let server;
  let app;
  let model;
  let dto;
  let authToken;
  let dbConnection: DbConnection;
  let cryptoService: CryptoService;
  let usersRepository: UsersRepository;
  let usersService: UsersService; // Declare usersService
  let mapperService: MapperService; // Declare mapperService
  let testUser: any;
  let createdUserId: any;

  // Get test password from environment or use a secure fallback
  const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || `test_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  // Generate a different password for test model
  const TEST_MODEL_PASSWORD = process.env.TEST_MODEL_PASSWORD || `testmodel_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

  // Will run once before all tests
  before(async function() {
    this.timeout(20000); // Increase timeout for setup
    
    console.log('Starting test setup...');
    
    // Add a delay to ensure resources from previous tests are released
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Make sure UsersService is registered in the container
    if (!container.isRegistered(UsersService)) {
      container.registerSingleton(UsersService);
    }
    
    // Make sure UsersRepository is registered in the container
    if (!container.isRegistered(UsersRepository)) {
      container.registerSingleton(UsersRepository);
    }
    
    // Make sure MapperService is registered in the container
    if (!container.isRegistered(MapperService)) {
      container.registerSingleton(MapperService);
    }
    
    // Initialize dependencies
    dbConnection = container.resolve(DbConnection);
    await dbConnection.initializeDbConnection();
    cryptoService = container.resolve(CryptoService);
    usersRepository = container.resolve(UsersRepository);
    usersService = container.resolve(UsersService); // Resolve usersService
    mapperService = container.resolve(MapperService); // Resolve mapperService
    
    console.log('Creating test user for authentication...');
    // Create a test user for authentication with unique identifier to avoid conflicts
    const timestamp = new Date().getTime();
    testUser = generateUserModel();
    testUser.email = `user-${timestamp}@testuser.com`; // Make email unique
    testUser.password = TEST_PASSWORD; // Use environment variable or secure generated password
    
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
      // Handle case where user might already exist - continue anyway
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
    // Create model for tests with unique identifier
    const testTimestamp = new Date().getTime();
    model = generateUserModel();
    model.email = `testmodel-${testTimestamp}@testmodel.com`; // Make email unique
    // Ensure model has a valid UUID
    model.id = undefined; // Let the system generate the ID
    
    console.log('Test model:', JSON.stringify(model, null, 2));
    
    // Create a test password and encrypt it
    const encryptedPassword = cryptoService.encrypt(TEST_MODEL_PASSWORD);
    console.log('Encrypted password:', encryptedPassword);
    
    dto = new UserDto({
      name: model.name,
      email: model.email,
      phone: model.phone,
      password: encryptedPassword, // Add encrypted password
      role: model.role // Include role
    });
    
    console.log('DTO for user creation:', JSON.stringify(dto, null, 2));
    console.log('Test setup completed');
  });

  // Will run once after all tests
  after(async function() {
    this.timeout(10000); // Increase timeout for cleanup
    
    console.log('Cleaning up after tests...');
    
    // Clean up created test users
    try {
      if (createdUserId) {
        console.log(`Deleting created test user with ID: ${createdUserId}`);
        await usersRepository.delete(createdUserId);
        console.log('Test user deleted successfully');
      }
      
      if (testUser && testUser.id) {
        console.log(`Deleting authentication test user with ID: ${testUser.id}`);
        await usersRepository.delete(testUser.id);
        console.log('Authentication test user deleted successfully');
      }
    } catch (error) {
      console.error('Error cleaning up test users:', (error as Error).message);
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

  describe('POST /users', () => {
    it(`should create one: ${entityName}`, async function() {
      this.timeout(10000); // Increase timeout for this test

      try {
        // Log what we're about to send
        console.log('\nSending user creation request with DTO:', JSON.stringify(dto, null, 2));
        console.log('Authorization token:', authToken ? 'Token present' : 'Token missing');
        
        // Create a direct copy of the DTO to ensure nothing is lost in serialization
        const requestBody = {
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          password: dto.password,
          role: dto.role
        };
        
        console.log('Request body being sent:', JSON.stringify(requestBody, null, 2));
        
        // Act
        const res = await app
          .post('/users')
          .set('Authorization', `Bearer ${authToken}`)
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Always log the response for debugging
        console.log('Create user response status:', res.status);
        console.log('Create user response body:', JSON.stringify(res.body, null, 2));
        
        if (res.status !== 201) {
          console.error('User creation failed with status:', res.status);
          console.error('Response body:', JSON.stringify(res.body, null, 2));
          console.error('Request that failed:', JSON.stringify(requestBody, null, 2));
        }
        
        // Assert
        expect(res.status).to.equal(201);
        expect(res.body).to.have.property("id");

        // Save Id
        createdUserId = res.body.id;
        console.log('Created user with ID:', createdUserId);
      } catch (error) {
        console.error('Error in create user test:', error);
        if (error && typeof error === 'object' && 'response' in error) {
          const errorWithResponse = error as { response: { status: number; body: any } };
          console.error('Response status:', errorWithResponse.response.status);
          console.error('Response body:', errorWithResponse.response.body);
        }
        throw error;
      }
    });
  });

  describe('GET /users/{id}', () => {
    it(`should get a user: ${entityName}`, async function() {
      // Skip this test if user creation failed
      if (!createdUserId) {
        console.log('Skipping get user test because user creation failed');
        this.skip();
        return;
      }

      // Act
      const res = await app
        .get(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Log response for debugging if it fails
      if (res.status !== 200) {
        console.log('Get user response:', res.status, res.body);
      }

      // Assert
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("name");
    });

    it(`should FAIL to get one: ${entityName}`, async () => {
      // Act
      const res = await app
        .get(`/users/aaaaa`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(res.status).to.satisfy((val: number) => val === 400 || val === 404 || val === 500);
    });
  });

  describe('GET /users', () => {
    it(`should get paginated user: ${entityName}`, async function() {
      // Skip this test if user creation failed
      if (!createdUserId) {
        console.log('Skipping pagination test because user creation failed');
        this.skip();
        return;
      }

      // Act
      const res = await app
        .get(`/users?page=0&limit=10&sort=ASC&field=name&filter=${model.name}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Log response for debugging if it fails
      if (res.status !== 200 || !res.body.docs || res.body.docs.length === 0) {
        console.log('Get paginated users response:', res.status, res.body);
      }

      // Assert
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('docs');
      expect(res.body.docs).to.be.an('array');
      expect(res.body.docs.length).to.be.greaterThan(0);
      
      // Find the user we created
      const createdUser = res.body.docs.find(u => u.id === createdUserId);
      assert.isDefined(createdUser, 'Created user should be found in paginated results');
      assert.equal(createdUser.name, model.name, 'User name should match');
    });

    it(`should FAIL to get paginated one: ${entityName}`, async () => {

      // Act
      const res = await app
        .get(`/users?&sort=ASC&field=name&filter=${model.name}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Log response for debugging
      console.log('Pagination failure test response:', res.status);
      console.log('Response body:', JSON.stringify(res.body, null, 2));

      // Assert
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('name', 'BadRequestError');
    });

  });

  describe('DELETE /users/{id}', () => {
    it(`should delete one: ${entityName}`, async function() {
      // Skip this test if user creation failed
      if (!createdUserId) {
        console.log('Skipping delete user test because user creation failed');
        this.skip();
        return;
      }

      // Act
      const res = await app
        .delete(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Log response for debugging if it fails
      if (res.status !== 200) {
        console.log('Delete user response:', res.status, res.body || res.text);
      }

      // Assert
      expect(res.status).to.equal(200);
      expect(res.text).to.include('Successfully deleted');
    });
  });
});
