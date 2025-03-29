import { Mapper, createMap, forMember, mapFrom } from '@automapper/core';
import { User } from '../entities/User';
import { IUserDto, UserDto } from '../../application/users/dtos/userDto';

export const UserMapping = (mapper: Mapper): void => {
  // Map from User entity to IUserDto
  createMap<User, IUserDto>(
    mapper,
    User,
    UserDto, 
    forMember(
      (destination) => destination.id,
      mapFrom((source) => source.id)
    ),
    forMember(
      (destination) => destination.email,
      mapFrom((source) => source.email)
    ),
    forMember(
      (destination) => destination.name,
      mapFrom((source) => source.name)
    ),
    forMember(
      (destination) => destination.phone,
      mapFrom((source) => source.phone)
    ),
    forMember(
      (destination) => destination.role,
      mapFrom((source) => source.role)
    ),
    forMember(
      (destination) => destination.password,
      mapFrom((source) => source.password)
    )
  );

  // Map from IUserDto to User entity
  createMap<IUserDto, User>(
    mapper,
    UserDto, 
    User,
    forMember(
      (destination) => destination.id,
      mapFrom((source) => source.id)
    ),
    forMember(
      (destination) => destination.email,
      mapFrom((source) => source.email)
    ),
    forMember(
      (destination) => destination.name,
      mapFrom((source) => source.name)
    ),
    forMember(
      (destination) => destination.phone,
      mapFrom((source) => source.phone)
    ),
    forMember(
      (destination) => destination.role,
      mapFrom((source) => source.role)
    ),
    forMember(
      (destination) => destination.password,
      mapFrom((source) => source.password)
    )
  );
};
