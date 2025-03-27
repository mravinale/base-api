import "reflect-metadata";
import { expect } from "chai";
import { UsersService } from "../usersService";
import { UsersRepository } from "../usersRepository";
import { UserDto } from "../userDto";
import { PaginationDto } from "../../../infrastructure/utils/PaginationDto";
import { generateUserModel, generateMockUUID } from "../../../infrastructure/utils/Models";
import { mock, instance, when, anyString, anything } from "ts-mockito";
import { CryptoService } from "../../../infrastructure/utils/CryptoService";
import { MapperService } from "../../../infrastructure/utils/Mapper";
import { User, UserRole } from "../../../domain/entities/User";

describe("Users Service", () => {
  let service: UsersService;
  let mockedUsersRepository: UsersRepository;
  let mockedCryptoRepository: CryptoService;
  let mockedMapperService: MapperService;
  let mockedMapper: any;

  before(async () => {
    mockedUsersRepository = mock(UsersRepository);
    mockedCryptoRepository = mock(CryptoService);
    mockedMapperService = mock(MapperService);
    
    // Mock the mapper methods
    mockedMapper = {
      map: (source: any, sourceType: any, destinationType: any) => source
    };
    
    when(mockedMapperService.getMapper()).thenReturn(mockedMapper);
    when(mockedMapperService.addProfile(anything())).thenReturn();
    
    service = new UsersService(
      instance(mockedUsersRepository),
      instance(mockedMapperService)
    );
  });

  it("should getById", async () => {
    // Arrange
    const userId = generateMockUUID();
    const userDto = new UserDto({
      name: "hello", 
      email: "test@gmail.com"
    });
    
    when(mockedUsersRepository.get(anyString())).thenResolve(userDto);
    
    // Act
    const user = await service.get(userId);

    // Assert
    expect(user).to.deep.equal(userDto);
  });

  it("should getPaginated", async () => {
    // Arrange
    const paginationDto = new PaginationDto({
      page: 0,
      limit: 10
    });

    const mockUsers = [
      new UserDto({ name: "user1", email: "user1@test.com" }),
      new UserDto({ name: "user2", email: "user2@test.com" })
    ];

    const mockPaginationResult = new PaginationDto({
      page: 0,
      limit: 10,
      count: 2,
      totalPages: 1,
      docs: mockUsers
    });

    when(mockedUsersRepository.getPaginated(anything())).thenResolve(mockPaginationResult);

    // Act
    const result = await service.getPaginated(paginationDto);

    // Assert
    expect(result.docs).to.have.lengthOf(2);
    expect(result.count).to.equal(2);
    expect(result.totalPages).to.equal(1);
  });

  it("should create user", async () => {
    // Arrange
    const userDto = new UserDto({
      name: "newUser",
      email: "newuser@test.com",
      password: "password123",
      role: UserRole.ADMIN
    });

    when(mockedUsersRepository.create(anything())).thenResolve(userDto);

    // Act
    const result = await service.create(userDto);

    // Assert
    expect(result).to.deep.equal(userDto);
  });

  it("should update user", async () => {
    // Arrange
    const userId = generateMockUUID();
    const userDto = new UserDto({
      name: "updatedUser",
      email: "updated@test.com"
    });

    when(mockedUsersRepository.update(anyString(), anything())).thenResolve(userDto);

    // Act
    const result = await service.update(userId, userDto);

    // Assert
    expect(result).to.deep.equal(userDto);
  });

  it("should delete user", async () => {
    // Arrange
    const userId = generateMockUUID();
    when(mockedUsersRepository.delete(anyString())).thenResolve(1);

    // Act
    const result = await service.delete(userId);

    // Assert
    expect(result).to.equal(1);
  });

  it("should throw error when user not found", async () => {
    // Arrange
    const userId = generateMockUUID();
    when(mockedUsersRepository.get(anyString())).thenResolve(null);

    // Act & Assert
    try {
      await service.get(userId);
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).to.include("not found");
    }
  });

  it("should throw error when required fields missing on create", async () => {
    // Arrange
    const userDto = new UserDto({
      name: "missingFields"
      // Missing email, password, and role
    });

    // Act & Assert
    try {
      await service.create(userDto);
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).to.include("required");
    }
  });
});
