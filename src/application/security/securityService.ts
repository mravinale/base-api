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
        let user = await this.securityRepository.get(loginDto.email);

        if (!user) throw new Error('User not found');
        
        // Handle the case where user.password might be undefined
        if (!user.password) {
            return null; // If no password is stored, authentication fails
        }
        
        return (this.cryptoService.decrypt(user.password) === loginDto.password) ? user : null;
    }

    public async checkUserEmail(email: string): Promise<ISecurityDto | null> {
        return await this.securityRepository.checkUserEmail(email);
    }

    public async signup(signupDto: ISignupDto): Promise<ISignupDto> {
        // Ensure password is not undefined before encrypting
        if (signupDto.password) {
            signupDto.password = this.cryptoService.encrypt(signupDto.password);
        }
        const result = await this.securityRepository.signup(signupDto);
        return result as ISignupDto; // Cast to ensure type compatibility
    }
}
