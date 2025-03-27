import { Mapper, createMap, forMember, mapFrom } from '@automapper/core';
import { Organization } from '../../domain/entities/Organization';
import { IOrganizationDto, OrganizationDto } from './organizationDto';

export const OrganizationMapping = (mapper: Mapper): void => {
  try {
    // Map from Organization entity to OrganizationDto
    createMap<Organization, IOrganizationDto>(
      mapper,
      Organization,
      OrganizationDto,
      forMember(
        (destination) => destination.id,
        mapFrom((source) => source.id)
      ),
      forMember(
        (destination) => destination.name,
        mapFrom((source) => source.name)
      ),
      forMember(
        (destination) => destination.users,
        mapFrom((source) => source.users)
      )
    );

    // Map from OrganizationDto to Organization entity
    createMap<IOrganizationDto, Organization>(
      mapper,
      OrganizationDto,
      Organization,
      forMember(
        (destination) => destination.id,
        mapFrom((source) => source.id)
      ),
      forMember(
        (destination) => destination.name,
        mapFrom((source) => source.name)
      ),
      forMember(
        (destination) => destination.users,
        mapFrom((source) => source.users)
      )
    );
  } catch (error) {
    console.error('Error in OrganizationMapping:', error);
    throw error;
  }
};
