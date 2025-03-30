import { IOrganizationDto, OrganizationDto } from "./dtos/organizationDto";
import { singleton } from 'tsyringe';
import { PaginationDto } from "../../infrastructure/utils/PaginationDto";
import "reflect-metadata";
import { OrganizationRepository } from "./organizationRepository";
import { MapperService } from "../../infrastructure/utils/Mapper";
import { OrganizationMapping } from "../../domain/mappings/organizationMapping";
import { Organization } from "../../domain/entities/Organization";
import { ApiError } from "../../infrastructure/utils/ErrorHandler";

@singleton()
export class OrganizationService {

    constructor(
        private organizationRepository: OrganizationRepository,
        private mapperService: MapperService
    ) {
        // Register the organization mapping profile
        this.mapperService.addProfile(OrganizationMapping);
    }

    public async get(id: string): Promise<IOrganizationDto> {
        const organization = await this.organizationRepository.get(id);
        
        if (!organization) {
            throw ApiError.notFound(`Organization with id ${id} not found`, 'Organization');
        }

        // Map the Organization entity to OrganizationDto
        return this.mapperService.getMapper().map(organization, Organization, OrganizationDto);
    }

    public async getPaginated(pageDto: PaginationDto): Promise<PaginationDto> {
        const result = await this.organizationRepository.getPaginated(pageDto);
        
        if (!result || !result.docs || !Array.isArray(result.docs)) {
            throw ApiError.internal('Failed to retrieve paginated organizations');
        }
        
        // Map each Organization entity in the docs array to OrganizationDto
        result.docs = result.docs.map(organization => 
            this.mapperService.getMapper().map(
                organization, 
                Organization, 
                OrganizationDto
            )
        );
        
        return result;
    }

    public async create(organizationDto: IOrganizationDto): Promise<IOrganizationDto | null> {
      
        // Validate required fields
        if (!organizationDto.name) {
            throw ApiError.validation('Organization name is required', {
                name: { message: 'Organization name is required' }
            });
        }
        
        // Map the IOrganizationDto to Organization entity
        const organizationEntity = this.mapperService.getMapper().map(
            organizationDto, 
            OrganizationDto, 
            Organization
        );
        
        // Create the organization
        const createdOrganization = await this.organizationRepository.create(organizationEntity);
        
        if (!createdOrganization) {
            throw ApiError.internal('Failed to create organization');
        }
        
        // Map the created Organization entity back to OrganizationDto
        return this.mapperService.getMapper().map(createdOrganization, Organization, OrganizationDto);
    }

    public async delete(id: string): Promise<string> {
        const organization = await this.organizationRepository.get(id);
        if (!organization) {
            throw ApiError.notFound(`Organization with id ${id} not found`, 'Organization');
        } 
       return await this.organizationRepository.delete(id);
    }

    public async update(id: string, organizationDto: IOrganizationDto): Promise<IOrganizationDto> {
        // Check if the organization exists
        const existingOrganization = await this.organizationRepository.get(id);
        
        if (!existingOrganization) {
            throw ApiError.notFound(`Organization with id ${id} not found`, 'Organization');
        }
        
        // Map the IOrganizationDto to Organization entity
        const organizationEntity = this.mapperService.getMapper().map(organizationDto, OrganizationDto, Organization);
        
        // Update the organization
        const updatedOrganization = await this.organizationRepository.update(id, organizationEntity);
        
        if (!updatedOrganization) {
            throw ApiError.internal('Failed to update organization');
        }
        
        // Map the updated Organization entity back to OrganizationDto
        return this.mapperService.getMapper().map(updatedOrganization, Organization, OrganizationDto);
    }
}
