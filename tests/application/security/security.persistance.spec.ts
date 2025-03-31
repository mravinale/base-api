import "reflect-metadata";
import { expect } from "chai";
import { SecurityRepository } from "@application/security/securityRepository";
import { container } from "tsyringe";
import { DbConnection } from "@infrastructure/config/dbConnection";
import { TestHelper } from '../../testHelper';
import { UserRole } from "@domain/entities/User";
import { CryptoService } from "@infrastructure/utils/CryptoService";
import { DataSource } from "typeorm";

describe("Security Repository", () => {
  let repository: SecurityRepository;
  let cryptoService: CryptoService;
  let testUser: any;
  let dbConnection: DbConnection;
  let dataSource: DataSource;

  before(async () => {
    // Initialize the database connection
    dbConnection = container.resolve(DbConnection);
    await dbConnection.initializeDbConnection();
    dataSource = dbConnection.datasource;
    
    // Make sure the dataSource is initialized before resolving the repository
    expect(dataSource.isInitialized).to.equal(true);
    
    repository = container.resolve(SecurityRepository);
    cryptoService = container.resolve(CryptoService);
    
    // Create a test user for our security tests
    testUser = TestHelper.generateUserModel();
    testUser.password = cryptoService.encrypt(testUser.password);
  });

  it("should create a user via signup", async () => {
    // Arrange
    const signupData = {
      email: `test-${Date.now()}@example.com`,
      name: "Test User",
      password: "password123",
      role: UserRole.USER
    };

    // Act
    const user = await repository.signup(signupData);

    // Assert
    expect(user).to.have.property("email").equal(signupData.email);
    expect(user).to.have.property("name").equal(signupData.name);
    expect(user).to.not.have.property("password"); // Password should be removed from response
  });

  it("should check if user email exists", async () => {
    // Arrange
    const signupData = {
      email: `test-${Date.now()}@example.com`,
      name: "Test User",
      password: cryptoService.encrypt("password123"),
      role: UserRole.USER
    };
    
    // Create a user first
    await repository.signup(signupData);

    // Act
    const existingUser = await repository.checkUserEmail(signupData.email);
    const nonExistingUser = await repository.checkUserEmail(`nonexistent-${Date.now()}@example.com`);

    // Assert
    expect(existingUser).to.not.equal(null);
    expect(existingUser).to.have.property("email").equal(signupData.email);
    expect(nonExistingUser).to.equal(null);
  });

  it("should get user by email", async () => {
    // Arrange
    const signupData = {
      email: `test-${Date.now()}@example.com`,
      name: "Test User",
      password: cryptoService.encrypt("password123"),
      role: UserRole.USER
    };
    
    // Create a user first
    await repository.signup(signupData);

    // Act
    const user = await repository.get(signupData.email);

    // Assert
    expect(user).to.have.property("email").equal(signupData.email);
    expect(user).to.have.property("name").equal(signupData.name);
    expect(user).to.have.property("password"); // Password should be included for authentication
  });

  it("should return null when getting non-existent user", async () => {
    // Act
    const user = await repository.get(`nonexistent-${Date.now()}@example.com`);

    // Assert
    expect(user).to.equal(null);
  });
});
