import { IUserDto } from "./userDto";
import { singleton } from 'tsyringe';
import { DbConnection } from "../../infrastructure/config/dbConnection";
import { User } from "../../domain/entities/User";
import { PaginationDto } from "../../infrastructure/utils/PaginationDto";
import "reflect-metadata";

@singleton()
export class UsersRepository {

    constructor(private dbConnection: DbConnection) {}

    private get userRepository() {
        if (!this.dbConnection.datasource || !this.dbConnection.datasource.isInitialized) {
            throw new Error('Database connection not initialized');
        }
        return this.dbConnection.datasource.getRepository(User);
    }

    public async get(id: string): Promise<IUserDto | null> {
        try {
            return await this.userRepository
                .createQueryBuilder("user")
                .where("user.id = :id", { id })
                .getOne();
        } catch (error) {
            console.error('Error in UsersRepository.get:', error);
            return null;
        }
    }

    public async getPaginated(args: PaginationDto): Promise<PaginationDto> {
        try {
            const isNil = val => val == null

            let page = args.page >= 0 ? args.page : 0;
            let filter =  isNil(args.filter) ? "%" : "%" + args.filter + "%";
            let field =  isNil(args.field) ? "name" : args.field;
            let sort = args.sort ? (args.sort.toUpperCase() as "ASC" | "DESC") : "ASC";

            const count = await this.userRepository
                .createQueryBuilder('user')
                .where(`${field} like :filter`, { filter: filter })
                .select('DISTINCT(`id`)')
                .getCount();

            let data = await this.userRepository
                .createQueryBuilder("user")
                .skip(page * args.limit) // pagination starts at page 0
                .take(args.limit)
                .where(`${field} like :filter`, { filter: filter })
                .orderBy(field, sort)
                .getMany();

            return new PaginationDto({
                count: count,
                page: page,
                limit: args.limit,
                sort: sort,
                filter: args.filter,
                totalPages: Math.ceil(count / args.limit),
                docs: data
            });
        } catch (error) {
            console.error('Error in UsersRepository.getPaginated:', error);
            return args; // Return the original args with empty docs in case of error
        }
    }

    public async create(entity: IUserDto): Promise<IUserDto | null> {
        try {
            console.log('Creating user with entity:', JSON.stringify(entity, null, 2));
            
            // Check if required fields are present
            if (!entity.email) {
                console.error('Email is required but missing');
                return null;
            }
            
            if (!entity.password) {
                console.error('Password is required but missing');
                return null;
            }
            
            if (!entity.role) {
                console.error('Role is required but missing');
                return null;
            }
            
            try {
                const user = await this.userRepository.create(entity);
                console.log('User entity created:', JSON.stringify(user, null, 2));
                
                try {
                    const savedUser = await this.userRepository.save(user);
                    console.log('User saved successfully:', JSON.stringify(savedUser, null, 2));
                    return savedUser;
                } catch (saveError) {
                    console.error('Error saving user:', saveError);
                    return null;
                }
            } catch (createError) {
                console.error('Error creating user entity:', createError);
                return null;
            }
        } catch (error) {
            console.error('Error in UsersRepository.create:', error);
            if (error instanceof Error) {
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
            }
            return null;
        }
    }

    public async delete(id: string): Promise<number | null> {
        try {
            let result = await this.userRepository.delete(id);
            return result.affected || null;
        } catch (error) {
            console.error('Error in UsersRepository.delete:', error);
            return null;
        }
    }

    public async update(id: string, entity: IUserDto): Promise<IUserDto | null> {
        try {
            const fieldsToUpdate = JSON.parse(JSON.stringify(entity));

            await this.userRepository.update(id, fieldsToUpdate);
            return await this.userRepository.findOneBy({id});
        } catch (error) {
            console.error('Error in UsersRepository.update:', error);
            return null;
        }
    }
}
