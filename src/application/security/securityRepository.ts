import { ISecurityDto } from "./Dtos/securityDto";
import { singleton } from 'tsyringe';
import { DbConnection } from "../../infrastructure/config/dbConnection";
import { User } from "../../domain/entities/User";
import "reflect-metadata";
import { ISignupDto } from "./Dtos/signupDto";

@singleton()
export class SecurityRepository {

    constructor(private dbConnection: DbConnection) {}

    private get securityRepository() {
        if (!this.dbConnection.datasource || !this.dbConnection.datasource.isInitialized) {
            throw new Error('Database connection not initialized');
        }
        return this.dbConnection.datasource.getRepository(User);
    }

    public async get(email: string): Promise<ISecurityDto | null> {
        try {
            return await this.securityRepository
                .createQueryBuilder("user")
                .leftJoinAndSelect("user.organization", "organization")
                .where("user.email = :email", { email })
                .getOne()
        } catch (error) {
            console.error('Error in SecurityRepository.get:', error);
            return null;
        }
    }

    public async checkUserEmail(email: string): Promise<ISecurityDto | null> {
        try {
            return await this.securityRepository.findOneBy({email});
        } catch (error) {
            console.error('Error in SecurityRepository.checkUserEmail:', error);
            return null;
        }
    }

    public async signup(params: ISignupDto): Promise<Partial<ISignupDto> | null> {
        try {
            let userInfo = await this.securityRepository.save(params) as any;

            if (userInfo && userInfo.password) {
                delete userInfo.password;
            }

            return userInfo;
        } catch (error) {
            console.error('Error in SecurityRepository.signup:', error);
            return null;
        }
    }
}
