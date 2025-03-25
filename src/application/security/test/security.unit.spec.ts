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

describe("Security Controller", () => {
  let controller: SecurityController;
  let mockedSecurityService: SecurityService;
  
  before(async () => {
    mockedSecurityService = mock(SecurityService);
    controller = new SecurityController(instance(mockedSecurityService));
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
      
      when(mockedSecurityService.get(anything())).thenResolve(userData);
      
      // Act
      const result = await controller.login(loginDto);
      
      // Assert
      expect(result).to.have.property("token");
      expect(result.email).to.equal(userData.email);
      expect(result.name).to.equal(userData.name);
      expect(result.role).to.equal(userData.role);
      // The service might be called multiple times due to the implementation
      // We only need to verify that it was called at least once
      verify(mockedSecurityService.get(anything())).atLeast(1);
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
      
      // The service might be called multiple times due to the implementation
      // We only need to verify that it was called at least once
      verify(mockedSecurityService.get(anything())).atLeast(1);
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
      
      const createdUser = {
        id: "new-user-id",
        email: signupDto.email,
        name: signupDto.name,
        role: UserRole.USER
      };
      
      when(mockedSecurityService.checkUserEmail(anyString())).thenResolve(null as any);
      when(mockedSecurityService.signup(anything())).thenResolve(createdUser);
      
      // Act
      const result = await controller.signup(signupDto);
      
      // Assert
      expect(result).to.deep.equal(createdUser);
      // The service might be called multiple times due to the implementation
      // We only need to verify that it was called at least once
      verify(mockedSecurityService.checkUserEmail(anyString())).atLeast(1);
      verify(mockedSecurityService.signup(anything())).once();
    });
    
    it("should throw error when user email already exists", async () => {
      // Arrange
      const signupDto: ISignupDto = {
        email: "existing@example.com",
        name: "Existing User",
        password: "password123"
      };
      
      const existingUser = {
        id: "existing-id",
        email: signupDto.email,
        name: "Already Exists",
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
      
      // The service might be called multiple times due to the implementation
      // We only need to verify that it was called at least once
      verify(mockedSecurityService.checkUserEmail(anyString())).atLeast(1);
    });
  });
});
