import "reflect-metadata";
import { expect } from "chai";
import { OrganizationService } from "../organizationService";
import { OrganizationRepository } from "../organizationRepository";
import { OrganizationDto } from "../organizationDto";
import { PaginationDto } from "../../../infrastructure/utils/PaginationDto";
import { generateMockUUID } from "../../../infrastructure/utils/Models";
import { mock, instance, when, anyString, anything } from "ts-mockito";

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

  before(async () => {
    mockedOrganizationRepository = mock(OrganizationRepository);
    service = new OrganizationService(instance(mockedOrganizationRepository));
  });

  it("should getById", async () => {
    // Arrange
    const orgId = generateMockUUID();
    when(mockedOrganizationRepository.get(anyString()))
      .thenResolve(new OrganizationDto({
        name: "Test Organization"
      }));

    // Act
    const organization = await service.get(orgId);

    // Assert
    expect(organization).to.have.property("name");
    expect(organization.name).to.equal("Test Organization");
  });

  it("should get paginated", async () => {
    // Arrange
    let model = generateOrganizationModel();
    let dto = new PaginationDto({
      count: 1, 
      docs: [model], 
      filter: "", 
      limit: 10, 
      page: 1, 
      sort: "", 
      totalPages: 1
    });
    when(mockedOrganizationRepository.getPaginated(anything())).thenResolve(dto);

    // Act
    const result = await service.getPaginated(dto);

    // Assert
    expect(result.docs[0]).to.have.property("name");
    expect(result.count).to.equal(1);
  });

  it("should create organization", async () => {
    // Arrange
    const orgModel = generateOrganizationModel();
    const orgDto = new OrganizationDto({
      name: orgModel.name
    });
    
    when(mockedOrganizationRepository.create(anything())).thenResolve(orgModel);

    // Act
    const result = await service.create(orgDto);

    // Assert
    expect(result).to.have.property("id");
    expect(result.name).to.equal(orgModel.name);
  });

  it("should update organization", async () => {
    // Arrange
    const orgId = generateMockUUID();
    const orgModel = generateOrganizationModel();
    const orgDto = new OrganizationDto({
      name: "Updated Organization Name"
    });
    
    when(mockedOrganizationRepository.update(anyString(), anything())).thenResolve({
      ...orgModel,
      name: orgDto.name
    });

    // Act
    const result = await service.update(orgId, orgDto);

    // Assert
    expect(result).to.have.property("id");
    expect(result.name).to.equal("Updated Organization Name");
  });

  it("should delete organization", async () => {
    // Arrange
    const orgId = generateMockUUID();
    when(mockedOrganizationRepository.delete(anyString())).thenResolve("Organization deleted");

    // Act
    const result = await service.delete(orgId);

    // Assert
    expect(result).to.equal("Organization deleted");
  });
});
