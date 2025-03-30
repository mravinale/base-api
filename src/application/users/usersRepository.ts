import { IUserDto } from "./dtos/userDto";
import { singleton } from 'tsyringe';
import { DbConnection } from "../../infrastructure/config/dbConnection";
import { User } from "../../domain/entities/User";
import { PaginationDto } from "../../infrastructure/utils/PaginationDto";
import "reflect-metadata";
import { ApiError } from "../../infrastructure/utils/ErrorHandler";

@singleton()
export class UsersRepository {

    constructor(private dbConnection: DbConnection) {}

    private get userRepository() {
        if (!this.dbConnection.datasource || !this.dbConnection.datasource.isInitialized) {
            throw ApiError.internal('Database connection not initialized in UsersRepository');
        }
        return this.dbConnection.datasource.getRepository(User);
    }

    public async get(id: string): Promise<IUserDto | null> {
        return await this.userRepository
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.organization", "organization")
            .where("user.id = :id", { id })
            .getOne();
    }

    public async getPaginated(dto: PaginationDto): Promise<PaginationDto> {
        
        const isNil = (val: any) => val == null

        let page = dto.page >= 0 ? dto.page : 0;
        let filter =  isNil(dto.filter) ? "%" : "%" + dto.filter + "%";
        let field =  isNil(dto.field) ? "name" : dto.field;
        let sort = dto.sort ? (dto.sort.toUpperCase() as "ASC" | "DESC") : "ASC";

        const count = await this.userRepository
            .createQueryBuilder('user')
            .where(`${field} like :filter`, { filter: filter })
            .select('DISTINCT(`id`)')
            .getCount();

        let data = await this.userRepository
            .createQueryBuilder("user")
            .skip(page * dto.limit) // pagination starts at page 0
            .take(dto.limit)
            .where(`${field} like :filter`, { filter: filter })
            .orderBy(field, sort)
            .getMany();

        return new PaginationDto({
            count: count,
            page: page,
            limit: dto.limit,
            sort: sort,
            filter: dto.filter,
            totalPages: Math.ceil(count / dto.limit),
            docs: data
        });
    }

    public async create(dto: IUserDto): Promise<IUserDto | null> {
        const user = await this.userRepository.create(dto);         
        const savedUser = await this.userRepository.save(user);         
        return savedUser;
    }

    public async delete(id: string): Promise<number | null> {
        let result = await this.userRepository.delete(id);
        return result.affected || null;
    }

    public async update(id: string, dto: IUserDto): Promise<IUserDto | null> {
        const fieldsToUpdate = JSON.parse(JSON.stringify(dto));

        await this.userRepository.update(id, fieldsToUpdate);
        return await this.userRepository.findOneBy({id});
    }
}
