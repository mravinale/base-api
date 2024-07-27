import { ISecurityDto } from "./Dtos/securityDto";
import { singleton } from 'tsyringe';
import "reflect-metadata";
import { SecurityRepository } from "./securityRepository";
import { IloginDto } from "./Dtos/loginDto";
import { ISignupDto } from "./Dtos/signupDto";
import { CryptoService } from "../../infrastructure/utils/CryptoService";

@singleton()
export class SecurityService {

    constructor(private securityRepository: SecurityRepository,
                 private cryptoService: CryptoService) {
    }

    public async get(loginDto: IloginDto): Promise<ISecurityDto | null> {
        let user = await this.securityRepository.get( loginDto.email);

        if (!user) throw new Error('User not found');

        return (this.cryptoService.decrypt(user.password) === loginDto.password) ?   user : null;
    }

    public async checkUserEmail(email: string): Promise<ISecurityDto> {
        return await this.securityRepository.checkUserEmail(email);
    }

    public async signup(signupDto: ISignupDto): Promise<ISignupDto> {
        signupDto.password = this.cryptoService.encrypt(signupDto.password || '');
        return await this.securityRepository.signup(signupDto);
    }
}
