import "reflect-metadata";
import { expect } from "chai";
import { SecurityController } from "../securityController";
import { SecurityService } from "../securityService";
import { mock, instance, when, anyString, anything, verify } from "ts-mockito";
import * as jwt from "jsonwebtoken";
import { IloginDto } from "../Dtos/loginDto";
import { ISignupDto } from "../Dtos/signupDto";
import { ISecurityDto } from "../Dtos/securityDto";
import constants from "../../../infrastructure/config/constants";
import { generateUserModel } from "../../../infrastructure/utils/Models";
import { UserRole } from "../../../domain/entities/User";
import { auth } from "../../../infrastructure/config/authConfiguration";
import sinon from "sinon";

describe("Security Controller", () => {
  let controller: SecurityController;
  let mockedSecurityService: SecurityService;
  let authStub: sinon.SinonStub;
  
  before(async () => {
    mockedSecurityService = mock(SecurityService);
    controller = new SecurityController(instance(mockedSecurityService));
  });

  beforeEach(() => {
    // Create a stub for auth.api.signInEmail
    authStub = sinon.stub(auth.api, 'signInEmail');
  });

  afterEach(() => {
    // Restore the stub after each test
    authStub.restore();
  });

  describe("userInfo", () => {
    it("should return user from request", async () => {
      // Arrange
      const mockUser = {
        id: "test-id",
        name: "Test User",
        email: "test@example.com",
        role: UserRole.ADMIN
      };
      const mockRequest = { user: mockUser };

      // Act
      const result = await controller.userInfo(mockRequest);

      // Assert
      expect(result).to.deep.equal(mockUser);
    });
  });

  describe("login", () => {
    it("should return user data with token when credentials are valid", async () => {
      // Arrange
      const loginDto: IloginDto = {
        email: "test@example.com",
        password: "password123"
      };
      
      const userData: ISecurityDto = {
        email: "test@example.com",
        name: "Test User",
        role: UserRole.ADMIN,
        password: "encrypted-password"
      };
      
      // Mock the security service to return user data
      when(mockedSecurityService.get(anything())).thenResolve(userData);
      
      // Mock the better-auth signInEmail method to return a token
      authStub.resolves({
        token: 'mock-jwt-token',
        user: {
          id: 'user-id',
          email: userData.email,
          name: userData.name,
          role: userData.role
        }
      });
      
      // Act
      const result = await controller.login(loginDto);
      
      // Assert
      expect(result).to.have.property("token").equal('mock-jwt-token');
      expect(result.email).to.equal(userData.email);
      expect(result.name).to.equal(userData.name);
      expect(result.role).to.equal(userData.role);
      
      // Verify that the security service was called
      verify(mockedSecurityService.get(anything())).called();
      
      // Verify that better-auth was called with the right parameters
      expect(authStub.calledOnce).to.equal(true);
      expect(authStub.firstCall.args[0]).to.deep.equal({
        body: {
          email: loginDto.email,
          password: loginDto.password
        }
      });
    });
    
    it("should throw error when credentials are invalid", async () => {
      // Arrange
      const loginDto: IloginDto = {
        email: "test@example.com",
        password: "wrong-password"
      };
      
      when(mockedSecurityService.get(anything())).thenResolve(null as any);
      
      // Act & Assert
      try {
        await controller.login(loginDto);
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).to.equal("Not valid user or password");
      }
      
      // Verify that the security service was called
      verify(mockedSecurityService.get(anything())).called();
      
      // Verify that better-auth was not called since user validation failed
      expect(authStub.called).to.equal(false);
    });
  });
  
  describe("signup", () => {
    it("should create a new user when email doesn't exist", async () => {
      // Arrange
      const signupDto: ISignupDto = {
        email: "newuser@example.com",
        name: "New User",
        password: "password123"
      };
      
      when(mockedSecurityService.checkUserEmail(anyString())).thenResolve(null as any);
      when(mockedSecurityService.signup(anything())).thenResolve(signupDto as any);
      
      // Act
      const result = await controller.signup(signupDto);
      
      // Assert
      expect(result).to.deep.equal(signupDto);
      verify(mockedSecurityService.checkUserEmail(signupDto.email)).called();
      verify(mockedSecurityService.signup(signupDto)).called();
    });
    
    it("should throw error when user email already exists", async () => {
      // Arrange
      const signupDto: ISignupDto = {
        email: "existing@example.com",
        name: "Existing User",
        password: "password123"
      };
      
      const existingUser: ISecurityDto = {
        email: signupDto.email,
        name: signupDto.name,
        role: UserRole.USER,
        password: "encrypted-password"
      };
      
      when(mockedSecurityService.checkUserEmail(anyString())).thenResolve(existingUser);
      
      // Act & Assert
      try {
        await controller.signup(signupDto);
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).to.equal("User already exists");
      }
      
      verify(mockedSecurityService.checkUserEmail(signupDto.email)).called();
      expect(authStub.called).to.equal(false);
    });
  });
});
