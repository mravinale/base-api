import { IOrganizationDto, OrganizationDto } from "./organizationDto";
import { singleton } from 'tsyringe';
import { PaginationDto } from "../../infrastructure/utils/PaginationDto";
import "reflect-metadata";
import { OrganizationRepository } from "./organizationRepository";
import { MapperService } from "../../infrastructure/utils/Mapper";
import { OrganizationMapping } from "./organizationMapping";
import { Organization } from "../../domain/entities/Organization";

@singleton()
export class OrganizationService {

    constructor(
        private organizationRepository: OrganizationRepository,
        private mapperService: MapperService
    ) {
        // Register the organization mapping profile
        this.mapperService.addProfile(OrganizationMapping);
    }

    public async get(id: string): Promise<IOrganizationDto | null> {
        const organization = await this.organizationRepository.get(id);
        
        if (!organization) {
            return null;
        }

        // Map the Organization entity to OrganizationDto
        return this.mapperService.getMapper().map(organization, Organization, OrganizationDto);
    }

    public async getPaginated(pageDto: PaginationDto): Promise<PaginationDto> {
        const result = await this.organizationRepository.getPaginated(pageDto);
        
        if (!result || !result.docs || !Array.isArray(result.docs)) {
            throw new Error('Failed to retrieve paginated organizations');
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
        try {
            // Validate required fields
            if (!organizationDto.name) {
                throw new Error('Organization name is required');
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
                return null;
            }
            
            // Map the created Organization entity back to OrganizationDto
            return this.mapperService.getMapper().map(createdOrganization, Organization, OrganizationDto);
        } catch (error) {
            console.error('OrganizationService.create - Error:', error);
            throw error;
        }
    }

    public async delete(id: string): Promise<string> {
        return await this.organizationRepository.delete(id);
    }

    public async update(id: string, organizationDto: IOrganizationDto): Promise<IOrganizationDto | null> {
        // Map the IOrganizationDto to Organization entity
        const organizationEntity = this.mapperService.getMapper().map(
            organizationDto, 
            OrganizationDto, 
            Organization
        );
        
        // Update the organization
        const updatedOrganization = await this.organizationRepository.update(id, organizationEntity);
        
        if (!updatedOrganization) {
            return null;
        }
        
        // Map the updated Organization entity back to OrganizationDto
        return this.mapperService.getMapper().map(
            updatedOrganization, 
            Organization, 
            OrganizationDto
        );
    }
}
