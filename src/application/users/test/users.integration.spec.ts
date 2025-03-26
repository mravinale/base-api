import 'reflect-metadata';
import { expect, assert } from 'chai';
import supertest from 'supertest';
import { container } from 'tsyringe';

import { Server } from "../../../infrastructure/config/server";
import { UserDto } from "../userDto";
import { generateUserModel } from "../../../infrastructure/utils/Models";
import { CryptoService } from "../../../infrastructure/utils/CryptoService";
import { UsersRepository } from "../usersRepository";
import { DbConnection } from "../../../infrastructure/config/dbConnection";
import { auth } from '../../../infrastructure/config/authConfiguration';

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
  let testUser: any;

  before(async () => {
    console.log('Starting test setup...');
    // Initialize dependencies
    dbConnection = container.resolve(DbConnection);
    await dbConnection.initializeDbConnection();
    cryptoService = container.resolve(CryptoService);
    usersRepository = container.resolve(UsersRepository);
    
    console.log('Creating test user for authentication...');
    // Create a test user for authentication
    testUser = generateUserModel();
    testUser.password = "testPassword"; // Store plain password for login tests
    
    console.log('Test user model:', JSON.stringify(testUser, null, 2));
    
    // Save with encrypted password
    const encryptedUser = {...testUser};
    encryptedUser.password = cryptoService.encrypt(testUser.password);
    console.log('Encrypted test user:', JSON.stringify(encryptedUser, null, 2));
    
    const savedUser = await usersRepository.create(encryptedUser);
    console.log('Saved test user result:', savedUser ? 'Success' : 'Failed');
    
    // Ensure the user was created successfully
    if (!savedUser) {
      throw new Error('Failed to create test user for authentication');
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
    
    console.log('Logging in to get auth token...');
    // Login to get auth token
    const loginResponse = await app
      .post("/security/login")
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    console.log('Login response status:', loginResponse.status);
    
    if (loginResponse.status !== 200) {
      console.error('Login failed:', loginResponse.body);
      throw new Error('Failed to login and get auth token');
    }
    
    authToken = loginResponse.body.token;
    console.log('Auth token obtained successfully');
    
    console.log('Creating model for tests...');
    // Create model for tests
    model = generateUserModel();
    // Ensure model has a valid UUID
    model.id = undefined; // Let the system generate the ID
    
    console.log('Test model:', JSON.stringify(model, null, 2));
    
    // Create a test password and encrypt it
    const testPassword = "test123";
    const encryptedPassword = cryptoService.encrypt(testPassword);
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

  describe('POST /users', () => {
    it(`should create one: ${entityName}`, async function() {
      this.timeout(10000); // Increase timeout for this test

      try {
        // Log what we're about to send
        console.log('\nSending user creation request with DTO:', JSON.stringify(dto, null, 2));
        console.log('Authorization token:', authToken ? 'Token present' : 'Token missing');
        
        // Create a direct JSON string to avoid any serialization issues
        const jsonBody = JSON.stringify({
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          password: dto.password,
          role: dto.role
        });
        
        console.log('Request body being sent as JSON string:', jsonBody);
        
        // Act
        const res = await app
          .post('/users')
          .set('Authorization', `Bearer ${authToken}`)
          .set('Content-Type', 'application/json')
          .send(jsonBody);

        // Always log the response for debugging
        console.log('Create user response status:', res.status);
        console.log('Create user response body:', JSON.stringify(res.body, null, 2));
        
        if (res.status !== 201) {
          console.error('User creation failed with status:', res.status);
          console.error('Response body:', JSON.stringify(res.body, null, 2));
          console.error('Request that failed:', jsonBody);
        }
        
        // Assert
        expect(res.status).to.equal(201);
        expect(res.body).to.have.property("id");

        // Save Id
        model.id = res.body.id;
        console.log('Created user with ID:', model.id);
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
      if (!model.id) {
        console.log('Skipping get user test because user creation failed');
        this.skip();
        return;
      }

      // Act
      const res = await app
        .get(`/users/${model.id}`)
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
        .get(`/users/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(res.status).to.equal(404);
    });
  });

  describe('GET /users', () => {
    it(`should get paginated user: ${entityName}`, async function() {
      // Skip this test if user creation failed
      if (!model.id) {
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
      const createdUser = res.body.docs.find(u => u.id === model.id);
      assert.isDefined(createdUser, 'Created user should be found in paginated results');
      assert.equal(createdUser.name, model.name, 'User name should match');
    });

    it(`should FAIL to get paginated one: ${entityName}`, async () => {

      // Act
      const res = await app
        .get(`/users?&sort=ASC&field=name&filter=${model.name}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(res.status).to.satisfy((val: number) => val === 400);
      expect(res.res.text).to.satisfy(text => text.includes("validation error"))
    });

  });

  describe('DELETE /users/{id}', () => {
    it(`should delete one: ${entityName}`, async function() {
      // Skip this test if user creation failed
      if (!model.id) {
        console.log('Skipping delete user test because user creation failed');
        this.skip();
        return;
      }

      // Act
      const res = await app
        .delete(`/users/${model.id}`)
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
