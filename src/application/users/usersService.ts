import { IUserDto, UserDto } from "./userDto";
import { singleton, inject } from 'tsyringe';
import { PaginationDto } from "../../infrastructure/utils/PaginationDto";
import "reflect-metadata";
import { UsersRepository } from "./usersRepository";
import { MapperService } from "../../infrastructure/utils/Mapper";
import { User } from "../../domain/entities/User";
import { UserMapping } from "./userMapping";
import { ApiError } from "../../infrastructure/utils/ErrorHandler";

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
            throw new ApiError({
                statusCode: 404,
                name: 'NotFoundError',
                message: `User with id ${id} not found`
            });
        }

        // Map the User entity to UserDto (concrete class)
        return this.mapperService.getMapper().map(user, User, UserDto);
    }

    public async getPaginated(pageDto: PaginationDto): Promise<PaginationDto> {
        const result = await this.usersRepository.getPaginated(pageDto);

        if (!result || !result.docs || !Array.isArray(result.docs)) {
            throw new ApiError({
                statusCode: 500,
                name: 'DataError',
                message: 'Failed to retrieve paginated users'
            });
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
            throw new ApiError({
                statusCode: 400,
                name: 'ValidationError',
                message: 'Email is required'
            });
        }
        
        if (!userDto.password) {
            throw new ApiError({
                statusCode: 400,
                name: 'ValidationError',
                message: 'Password is required'
            });
        }
        
        if (!userDto.role) {
            throw new ApiError({
                statusCode: 400,
                name: 'ValidationError',
                message: 'Role is required'
            });
        }
        
        // Map the IUserDto to User entity using concrete class
        const userEntity = this.mapperService.getMapper().map(userDto, UserDto, User);  
        const createdUser = await this.usersRepository.create(userEntity);
        
        if (!createdUser) { 
            throw new ApiError({
                statusCode: 500,
                name: 'CreateError',
                message: 'Failed to create user'
            });
        }
        
        // Map the created User entity back to UserDto
        const result = this.mapperService.getMapper().map(createdUser, User, UserDto);
        
        return result;
    }

    public async delete(id: string): Promise<number | null> {
        const result = await this.usersRepository.delete(id);
        
        if (result === null) {
            throw new ApiError({
                statusCode: 404,
                name: 'NotFoundError',
                message: `User with id ${id} not found or could not be deleted`
            });
        }
        
        return result;
    }

    public async update(id: string, userDto: IUserDto): Promise<IUserDto> {
        // Map the IUserDto to User entity
        const userEntity = this.mapperService.getMapper().map(userDto, UserDto, User);
        
        // Update the user
        const updatedUser = await this.usersRepository.update(id, userEntity);
        
        if (!updatedUser) { 
            throw new ApiError({
                statusCode: 404,
                name: 'NotFoundError',
                message: `User with id ${id} not found or could not be updated`
            });
        }
        
        // Map the updated User entity back to UserDto
        return this.mapperService.getMapper().map(updatedUser, User, UserDto);
    }
}
