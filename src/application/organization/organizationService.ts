import { IUserDto } from "./organizationDto";
import { singleton } from 'tsyringe';
import { PaginationDto } from "../../infrastructure/utils/PaginationDto";
import "reflect-metadata";
import { OrganizationRepository } from "./organizationRepository";

@singleton()
export class OrganizationService {

    constructor(private organizationRepository: OrganizationRepository) {
    }

    public async get(id: string): Promise<IUserDto> {
        let user = await this.organizationRepository.get(id);

        return user;
    }

    public async getPaginated(pageDto: PaginationDto): Promise<PaginationDto> {
         return await this.organizationRepository.getPaginated(pageDto);
    }

    public async create(user: IUserDto): Promise<IUserDto> {
        return this.organizationRepository.create(user);
    }

    public async delete(id: string): Promise<string> {
        return await this.organizationRepository.delete(id);
    }

    public async update(id: string, user: IUserDto): Promise<IUserDto> {

        let userDb =   await this.organizationRepository.update(id, user);

        return userDb ;
    }

}
