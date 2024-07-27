import { ISecurityDto } from "./Dtos/securityDto";
import { singleton } from 'tsyringe';
import { DbConnection } from "../../infrastructure/config/dbConnection";
import { User } from "../../domain/entities/User";
import "reflect-metadata";
import { ISignupDto } from "./Dtos/signupDto";

@singleton()
export class SecurityRepository {

    constructor(private dbConnection: DbConnection) {
        this.securityRepository  = this.dbConnection.datasource.getRepository(User);
    }

    public async get(email: string): Promise<ISecurityDto> {
        return await this.securityRepository
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.payment", "payment")
            .leftJoinAndSelect("user.organization", "organization")
            .where("user.email = :email", { email })
            .getOne()
    }

    public async checkUserEmail(email: string): Promise<ISecurityDto> {
        return await this.securityRepository.findOneBy({email});
    }

    public async signup(params: ISignupDto): Promise<ISignupDto> {
        let userInfo = await this.securityRepository.save(params);

        delete userInfo.password;

        return userInfo
    }

    private securityRepository;
}
