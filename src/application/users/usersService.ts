import "reflect-metadata";
import { IUserDto, UserDto } from "./dtos/userDto";
import { singleton } from 'tsyringe';
import { PaginationDto } from "@infrastructure/utils/PaginationDto";
import { UsersRepository } from "./usersRepository";
import { MapperService } from "@infrastructure/utils/Mapper";
import { User } from "@domain/entities/User";
import { UserMapping } from "@domain/mappings/userMapping";
import { ApiError } from "@infrastructure/utils/ErrorHandler";

@singleton()
export class UsersService {

    constructor(
        private usersRepository: UsersRepository,
        private mapperService: MapperService
    ) {
        // Register the user mapping profile
        this.mapperService.addProfile(UserMapping);
    }

    public async get(id: string): Promise<IUserDto> {
        let user = await this.usersRepository.get(id);
        
        if (!user) {
            throw ApiError.notFound(`User with id ${id} not found`, 'User');
        }

        // Map the User entity to UserDto (concrete class)
        return this.mapperService.getMapper().map(user, User, UserDto);
    }

    public async getPaginated(pageDto: PaginationDto): Promise<PaginationDto> {
        const result = await this.usersRepository.getPaginated(pageDto);

        if (!result || !result.docs || !Array.isArray(result.docs)) {
            throw ApiError.internal('Failed to retrieve paginated users');
        }
        
        // Map each User entity in the docs array to UserDto
        result.docs = result.docs.map(user => 
            this.mapperService.getMapper().map(user, User, UserDto)
        );
        
        return result;
    }

    public async create(userDto: IUserDto): Promise<IUserDto> {
     
        console.log('UsersService.create - Input userDto:', JSON.stringify(userDto, null, 2));
        
        // Validate required fields
        if (!userDto.email) {
            throw ApiError.validation('Email is required');
        }
        
        if (!userDto.password) {
            throw ApiError.validation('Password is required');
        }
        
        if (!userDto.role) {
            throw ApiError.validation('Role is required');
        }
        
        // Map the IUserDto to User entity using concrete class
        const userEntity = this.mapperService.getMapper().map(userDto, UserDto, User);  
        const createdUser = await this.usersRepository.create(userEntity);
        
        if (!createdUser) { 
            throw ApiError.internal('Failed to create user');
        }
        
        // Map the created User entity back to UserDto
        const result = this.mapperService.getMapper().map(createdUser, User, UserDto);
        
        return result;
    }

    public async delete(id: string): Promise<number | null> {
        const result = await this.usersRepository.delete(id);
        
        if (result === null) {
            throw ApiError.notFound(`User with id ${id} not found or could not be deleted`, 'User');
        }
        
        return result;
    }

    public async update(id: string, userDto: IUserDto): Promise<IUserDto> {
        // Map the IUserDto to User entity
        const userEntity = this.mapperService.getMapper().map(userDto, UserDto, User);
        
        // Update the user
        const updatedUser = await this.usersRepository.update(id, userEntity);
        
        if (!updatedUser) { 
            throw ApiError.notFound(`User with id ${id} not found or could not be updated`, 'User');
        }
        
        // Map the updated User entity back to UserDto
        return this.mapperService.getMapper().map(updatedUser, User, UserDto);
    }
}
