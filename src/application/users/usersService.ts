import { IUserDto } from "./userDto";
import { singleton } from 'tsyringe';
import { PaginationDto } from "../../infrastructure/utils/PaginationDto";
import "reflect-metadata";
import { UsersRepository } from "./usersRepository";
import { CryptoService } from "../../infrastructure/utils/CryptoService";

@singleton()
export class UsersService {

    constructor(private usersRepository: UsersRepository,
                private cryptoService: CryptoService) {
    }

    public async get(id: string): Promise<IUserDto | null> {
        let user = await this.usersRepository.get(id);

        return user;
    }

    public async getPaginated(pageDto: PaginationDto): Promise<PaginationDto> {
         return await this.usersRepository.getPaginated(pageDto);
    }

    public async create(user: IUserDto): Promise<IUserDto | null> {
        return this.usersRepository.create(user);
    }

    public async delete(id: string): Promise<number | null> {
        return await this.usersRepository.delete(id);
    }

    public async update(id: string, user: IUserDto): Promise<IUserDto | null> {
        let userDb = await this.usersRepository.update(id, user);

        return userDb;
    }

}
