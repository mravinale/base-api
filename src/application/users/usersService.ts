import { IUserDto, UserDto } from "./userDto";
import { singleton, inject } from 'tsyringe';
import { PaginationDto } from "../../infrastructure/utils/PaginationDto";
import "reflect-metadata";
import { UsersRepository } from "./usersRepository";
import { MapperService } from "../../infrastructure/utils/Mapper";
import { User } from "../../domain/entities/User";
import { UserMapping } from "./userMapping";

@singleton()
export class UsersService {

    constructor(
        private usersRepository: UsersRepository,
        private mapperService: MapperService
    ) {
        // Register the user mapping profile
        this.mapperService.addProfile(UserMapping);
    }

    public async get(id: string): Promise<IUserDto | null> {
        let user = await this.usersRepository.get(id);
        
        if (!user) {
            throw new Error(`User with id ${id} not found`);
        }

        // Map the User entity to UserDto (concrete class)
        return this.mapperService.getMapper().map(user, User, UserDto);
    }

    public async getPaginated(pageDto: PaginationDto): Promise<PaginationDto> {
        const result = await this.usersRepository.getPaginated(pageDto);

        if (!result || !result.docs || !Array.isArray(result.docs)) {
            throw new Error('Failed to retrieve paginated users');
        }
        
        // Map each User entity in the docs array to UserDto
        result.docs = result.docs.map(user => 
            this.mapperService.getMapper().map(user, User, UserDto)
        );
        
        return result;
    }

    public async create(userDto: IUserDto): Promise<IUserDto | null> {
        try {
            console.log('UsersService.create - Input userDto:', JSON.stringify(userDto, null, 2));
            
            // Validate required fields
            if (!userDto.email) {
                throw new Error('Email is required');
            }
            
            if (!userDto.password) {
                throw new Error('Password is required');
            }
            
            if (!userDto.role) {
                throw new Error('Role is required');
            }
            
            console.log('UsersService.create - Validation passed, mapping to entity');
            
            // Map the IUserDto to User entity using concrete class
            const userEntity = this.mapperService.getMapper().map(userDto, UserDto, User);
            
            console.log('UsersService.create - Mapped entity:', JSON.stringify(userEntity, null, 2));
            
            // Create the user
            const createdUser = await this.usersRepository.create(userEntity);
            
            console.log('UsersService.create - Repository result:', createdUser ? 'Success' : 'Failed');
            
            if (!createdUser) {
                return null;
            }
            
            // Map the created User entity back to UserDto
            const result = this.mapperService.getMapper().map(createdUser, User, UserDto);
            console.log('UsersService.create - Final mapped result:', JSON.stringify(result, null, 2));
            
            return result;
        } catch (error) {
            console.error('UsersService.create - Error:', error);
            throw error;
        }
    }

    public async delete(id: string): Promise<number | null> {
        const result = await this.usersRepository.delete(id);
        
        if (result === null) {
            throw new Error(`User with id ${id} not found or could not be deleted`);
        }
        
        return result;
    }

    public async update(id: string, userDto: IUserDto): Promise<IUserDto | null> {
        // Map the IUserDto to User entity
        const userEntity = this.mapperService.getMapper().map(userDto, UserDto, User);
        
        // Update the user
        const updatedUser = await this.usersRepository.update(id, userEntity);
        
        if (!updatedUser) {
            return null;
        }
        
        // Map the updated User entity back to UserDto
        return this.mapperService.getMapper().map(updatedUser, User, UserDto);
    }
}
