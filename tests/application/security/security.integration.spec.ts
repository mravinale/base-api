import "reflect-metadata";
import { expect } from "chai";
import request from "supertest";
import { container } from "tsyringe";
import { DbConnection } from "@infrastructure/config/dbConnection";
import { generateUserModel } from "@infrastructure/utils/Models";
import { Server } from "@infrastructure/config/server";
import { CryptoService } from "@infrastructure/utils/CryptoService";
import { UsersRepository } from "@application/users/usersRepository";
import { Express } from "express";
import { auth } from "@infrastructure/config/authConfiguration";

describe("Security Controller", () => {
  let server: Server;
  let app: Express;
  let dbConnection: DbConnection;
  let cryptoService: CryptoService;
  let usersRepository: UsersRepository;
  let testUser: any;
  let authToken: string;

  before(async () => {
    // Initialize dependencies
    dbConnection = container.resolve(DbConnection);
    await dbConnection.initializeDbConnection();
    cryptoService = container.resolve(CryptoService);
    usersRepository = container.resolve(UsersRepository);
    
    // Create a test user for our security tests
    testUser = generateUserModel();
    testUser.password = "testPassword"; // Store plain password for login tests
    
    // Save with encrypted password
    const encryptedUser = {...testUser};
    encryptedUser.password = cryptoService.encrypt(testUser.password);
    await usersRepository.create(encryptedUser);
    
    // Register the user with better-auth
    try {
      await auth.api.signUpEmail({
        body: {
          email: testUser.email,
          password: testUser.password,
          name: testUser.name,
          metadata: {
            role: testUser.role
          }
        }
      });
      console.log("Test user registered with better-auth");
    } catch (error) {
      console.error("Failed to register test user with better-auth:", error);
    }
    
    // Initialize server
    server = container.resolve(Server);
    app = server.app;
  });

  describe("POST /security/login", () => {
    it("should login successfully with valid credentials", async () => {
      // Act
      const response = await request(app)
        .post("/security/login")
        .send({
          email: testUser.email,
          password: testUser.password
        });

      // Assert
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property("token");
      expect(response.body).to.have.property("email").equal(testUser.email);
      
      // Save token for later tests
      authToken = response.body.token;
    });

    it("should fail login with invalid credentials", async () => {
      // Act
      const response = await request(app)
        .post("/security/login")
        .send({
          email: testUser.email,
          password: "wrongPassword"
        });

      // Assert
      expect(response.status).to.equal(500);
      expect(response.body).to.have.property("message").that.includes("Not valid user or password");
    });
  });

  describe("POST /security/signup", () => {
    it("should create a new user when email doesn't exist", async () => {
      // Arrange
      const newUser = {
        email: `newuser-${Date.now()}@example.com`,
        name: "New Test User",
        password: "newPassword123"
      };

      // Act
      const response = await request(app)
        .post("/security/signup")
        .send(newUser);

      // Assert
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property("email").equal(newUser.email);
      expect(response.body).to.have.property("name").equal(newUser.name);
      expect(response.body).to.not.have.property("password"); // Password should not be returned
    });

    it("should fail when trying to create a user with existing email", async () => {
      // Act
      const response = await request(app)
        .post("/security/signup")
        .send({
          email: testUser.email, // Using existing email
          name: "Duplicate User",
          password: "password123"
        });

      // Assert
      expect(response.status).to.equal(500);
      expect(response.body).to.have.property("message").that.includes("User already exists");
    });
  });

  describe("GET /security/userinfo", () => {
    it("should return user info when authenticated", async () => {
      // Skip if no auth token (login test failed)
      if (!authToken) {
        return;
      }

      // Act
      const response = await request(app)
        .get("/security/userinfo")
        .set("Authorization", `Bearer ${authToken}`);

      // Assert
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property("email").equal(testUser.email.toLowerCase());
      expect(response.body).to.have.property("name");
    });

    it("should fail when not authenticated", async () => {
      // Act
      const response = await request(app)
        .get("/security/userinfo");

      // Assert
      expect(response.status).to.equal(401);
    });
  });

  // Clean up test data after tests
  after(async () => {
    if (testUser && testUser.id) {
      await usersRepository.delete(testUser.id);
    }
    
    // Close database connection
    if (dbConnection && dbConnection.datasource) {
      await dbConnection.datasource.destroy();
    }
  });
});
