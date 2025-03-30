import "reflect-metadata";
import { expect } from "chai";
import { OrganizationService } from "@application/organization/organizationService";
import { OrganizationRepository } from "@application/organization/organizationRepository";
import { OrganizationDto } from "@application/organization/dtos/organizationDto";
import { PaginationDto } from "@infrastructure/utils/PaginationDto";
import { generateMockUUID } from "@infrastructure/utils/Models";
import { mock, instance, when, anyString, anything } from "ts-mockito";
import { MapperService } from "@infrastructure/utils/Mapper"; 

// Helper function to generate a mock organization model
const generateOrganizationModel = () => {
  return {
    id: generateMockUUID(),
    name: `Org-${Math.random().toString(36).substring(2, 10)}`,
    users: []
  };
};

describe("Organization Service", () => {
  let service: OrganizationService;
  let mockedOrganizationRepository: OrganizationRepository;
  let mapperService: MapperService;

  before(async () => {
    // Create a real mapper service for testing
    mapperService = new MapperService();
    
    // Setup the repository mock
    mockedOrganizationRepository = mock(OrganizationRepository);
    
    // Create the service with both dependencies
    service = new OrganizationService(
      instance(mockedOrganizationRepository),
      mapperService
    );
  });

  it("should getById", async () => {
    // Arrange
    const orgId = generateMockUUID();
    const testOrg = new OrganizationDto({
      id: orgId,
      name: "Test Organization",
      users: []
    });
    
    when(mockedOrganizationRepository.get(anyString()))
      .thenResolve(testOrg);

    // Act
    const organization = await service.get(orgId);

    // Assert
    expect(organization).to.not.equal(null);
    expect(organization).to.have.property("name");
    expect(organization!.name).to.equal("Test Organization");
  });

  it("should getPaginated", async () => {
    // Arrange
    const paginationArgs = new PaginationDto({
      page: 0,
      limit: 10
    });
    
    const orgModels = [
      generateOrganizationModel(),
      generateOrganizationModel()
    ];
    
    const paginationResult = new PaginationDto({
      docs: orgModels,
      count: orgModels.length,
      page: 0,
      limit: 10,
      totalPages: 1
    });
    
    when(mockedOrganizationRepository.getPaginated(anything()))
      .thenResolve(paginationResult);

    // Act
    const result = await service.getPaginated(paginationArgs);

    // Assert
    expect(result).to.have.property("docs");
    expect(result.docs).to.have.lengthOf(2);
  });

  it("should create", async () => {
    // Arrange
    const orgModel = generateOrganizationModel();
    when(mockedOrganizationRepository.create(anything()))
      .thenResolve(orgModel);

    // Act
    const result = await service.create(orgModel);

    // Assert
    expect(result).to.not.equal(null);
    expect(result!.name).to.equal(orgModel.name);
  });

  it("should update", async () => {
    // Arrange
    const orgId = generateMockUUID();
    const updatedOrg = {
      id: orgId,
      name: "Updated Organization Name",
      users: []
    };
    
    when(mockedOrganizationRepository.update(anyString(), anything()))
      .thenResolve(updatedOrg);

    // Act
    const result = await service.update(orgId, updatedOrg);

    // Assert
    expect(result).to.not.equal(null);
    expect(result!.name).to.equal("Updated Organization Name");
  });

  it("should delete", async () => {
    // Arrange
    const orgId = generateMockUUID();
    when(mockedOrganizationRepository.delete(anyString()))
      .thenResolve("1");

    // Act
    const result = await service.delete(orgId);

    // Assert
    expect(result).to.equal("1");
  });
});
