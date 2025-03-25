import "reflect-metadata";
import { expect, assert } from "chai";
import { UsersRepository } from "../usersRepository";
import { container } from "tsyringe";
import { DbConnection } from "../../../infrastructure/config/dbConnection";
import { generateUserModel } from "../../../infrastructure/utils/Models";
import { PaginationDto } from "../../../infrastructure/utils/PaginationDto";

describe("Users Repository", () => {
  let repository: UsersRepository;
  let model = generateUserModel();
  let dbConnection: DbConnection;

  before(async () => {
    dbConnection = container.resolve(DbConnection);
    await dbConnection.initializeDbConnection();
    repository = container.resolve(UsersRepository);
    
    // Ensure the datasource is initialized before running tests
    expect(dbConnection.datasource.isInitialized).to.equal(true);
  });

  it("should create user", async () => {
    // Act
    const user = await repository.create(model);

    // Assert
    assert.isNotNull(user, "User should not be null");
    expect(user).to.have.property("name");
  });

  it("should getById", async () => {
    // Act
    const res = await repository.get(model.id);

    // Assert
    assert.isNotNull(res, "User should not be null");
    expect(res).to.have.property("name");
  });

  it("should get paginated", async () => {

    // Arrange
    let dto = new PaginationDto({
      count: 0, docs: [], filter: "", sort: "", totalPages: 0,
      page: 0, limit: 10
    })

    // Act
    const result = await repository.getPaginated(dto);

    // Assert
    assert.isNotNull(result, "Result should not be null");
    expect(result).to.have.property("docs");
    assert.isTrue(Array.isArray(result.docs), "docs should be an array");
  });

  it("should update user", async () => {
    // Arrange
    model.name = "hello"

    // Act
    const user = await repository.update(model.id, model);

    // Assert
    assert.isNotNull(user, "Updated user should not be null");
    assert.equal(user?.name, "hello", "Name should be updated");
  });

  it("should delete user", async () => {
     // Act
    const result = await repository.delete(model.id);

    // Assert
    assert.isNotNull(result, "Delete result should not be null");
    assert.equal(result, 1, "Should have deleted 1 record");
  });

});
