import { IOrganizationDto } from "./dtos/organizationDto";
import { singleton } from 'tsyringe';
import { DbConnection } from "../../infrastructure/config/dbConnection";
import { PaginationDto } from "../../infrastructure/utils/PaginationDto";
import "reflect-metadata";
import { Organization } from "../../domain/entities/Organization";
import { ApiError } from "../../infrastructure/utils/ErrorHandler";

@singleton()
export class OrganizationRepository {

    constructor(private dbConnection: DbConnection) {
        if (!this.dbConnection.datasource || !this.dbConnection.datasource.isInitialized) {
            throw ApiError.internal('Database connection not initialized in OrganizationRepository');
        }
        this.organizationRepository  = this.dbConnection.datasource.getRepository(Organization);
    }

    public async get(id: string): Promise<IOrganizationDto> {
        return await this.organizationRepository
            .createQueryBuilder("organization")
            .leftJoinAndSelect("organization.users", "users")
            .where("organization.id = :id", { id })
            .getOne()
    }

    public async getPaginated(args: PaginationDto): Promise<PaginationDto> {
        const isNil = val => val == null

        let page = args.page >= 0 ? args.page : 0;
        let filter =  isNil(args.filter) ? "%" : "%" + args.filter + "%";
        let field =  isNil(args.field) ? "name" : args.field;
        let sort = args.sort ? args.sort.toUpperCase() : "ASC";

        const count = await this.organizationRepository
            .createQueryBuilder('organization')
            .where(`${field} like :filter`, { filter: filter })
            .select('DISTINCT(`id`)')
            .getCount();

        let data = await this.organizationRepository
            .createQueryBuilder("organization")
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
    }

    public async create(entity: IOrganizationDto): Promise<IOrganizationDto> {
        const organization = await this.organizationRepository.create(entity);
        return await this.organizationRepository.save(organization);
    }

    public async delete(id: string): Promise<string> {
      let result = await this.organizationRepository.delete(id);
      return result.affected;
    }

    public async update(id: string, entity: IOrganizationDto): Promise<IOrganizationDto> {
        const fieldsToUpdate = JSON.parse(JSON.stringify(entity));

        await this.organizationRepository.update(id, fieldsToUpdate);
        return await this.organizationRepository.findOneBy({id});
    }

    private organizationRepository;
}
