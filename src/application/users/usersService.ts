import { IUserDto } from "./userDto";
import { singleton } from 'tsyringe';
import { PaginationDto } from "../../infrastructure/utils/PaginationDto";
import "reflect-metadata";
import { UsersRepository } from "./usersRepository";

@singleton()
export class UsersService {

    constructor(private usersRepository: UsersRepository) {
    }

    public async get(id: string): Promise<IUserDto | null> {
        let user = await this.usersRepository.get(id);
        
        if (!user) {
            throw new Error(`User with id ${id} not found`);
        }

        return user;
    }

    public async getPaginated(pageDto: PaginationDto): Promise<PaginationDto> {
         return await this.usersRepository.getPaginated(pageDto);
    }

    public async create(user: IUserDto): Promise<IUserDto | null> {
        // Validate required fields
        if (!user.email) {
            throw new Error('Email is required');
        }
        
        if (!user.password) {
            throw new Error('Password is required');
        }
        
        if (!user.role) {
            throw new Error('Role is required');
        }
        
        return this.usersRepository.create(user);
    }

    public async delete(id: string): Promise<number | null> {
        const result = await this.usersRepository.delete(id);
        
        if (result === null) {
            throw new Error(`User with id ${id} not found or could not be deleted`);
        }
        
        return result;
    }

    public async update(id: string, user: IUserDto): Promise<IUserDto | null> {
        let userDb = await this.usersRepository.update(id, user);
        
        if (!userDb) {
            throw new Error(`User with id ${id} not found or could not be updated`);
        }

        return userDb;
    }

}
