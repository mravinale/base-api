import "reflect-metadata";
import { expect } from "chai";
import { UsersService } from "../usersService";
import { UsersRepository } from "../usersRepository";
import { UserDto } from "../userDto";
import { PaginationDto } from "../../../infrastructure/utils/PaginationDto";
import { generateUserModel, generateMockUUID } from "../../../infrastructure/utils/Models";
import { mock, instance, when, anyString, anything } from "ts-mockito";
import { CryptoService } from "../../../infrastructure/utils/CryptoService";

describe("Users Service", () => {
  let service: UsersService;
  let mockedUsersRepository: UsersRepository;
  let mockedCryptoRepository: CryptoService;

  before(async () => {
    mockedUsersRepository = mock(UsersRepository);
    mockedCryptoRepository = mock(CryptoService);
    service = new UsersService(instance(mockedUsersRepository));
  });

  it("should getById", async () => {
    // Arrange
    const userId = generateMockUUID();
    when(mockedUsersRepository.get(anyString()))
        .thenResolve(new UserDto({
          name: "hello", email: "test@gmail.com"
        }));

    // Act
    const user = await service.get(userId);

    // Assert
    expect(user).to.have.property("name");
  });

  it("should get paginated", async () => {
    // Arrange
    let model = generateUserModel();
    let dto = new PaginationDto({
      count: 0, docs: [model], filter: "", limit: 0, page: 0, sort: "", totalPages: 0
    })
    when(mockedUsersRepository.getPaginated(anything())).thenResolve(dto);

    // Act
    const user = await service.getPaginated(dto);

    // Assert
    expect(user.docs[0]).to.have.property("name");
  });

  it("should create user", async () => {
    // Arrange
    let model = generateUserModel();
    when(mockedUsersRepository.create(anything()))
        .thenResolve(new UserDto({
          name: "hello", email: "test@gmail.com"
        }));

    // Act
    const user = await service.create(model);

    // Assert
    expect(user).to.have.property("name");
  });

  it("should delete user", async () => {
    // Arrange
    const userId = generateMockUUID();
    const affectedRows = 1; // TypeORM returns affected rows count as a number
    when(mockedUsersRepository.delete(anyString()))
        .thenResolve(affectedRows);

    // Act
    const result = await service.delete(userId);

    // Assert
    expect(result).to.equal(affectedRows);
  });

  it("should update user", async () => {
    // Arrange
    let model = generateUserModel();
    when(mockedUsersRepository.update(anyString(), anything()))
        .thenResolve(new UserDto({
          name: "hello", email: "test@gmail.com"
        }));

    // Act
    const user = await service.update(model.id, model);

    // Assert
    expect(user).to.have.property("name");
  });
});
