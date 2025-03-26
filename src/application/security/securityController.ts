import { Body, Controller, Get, Post, Request, Route, Security, SuccessResponse, Tags, Example } from "tsoa";
import { SecurityService } from "./securityService";
import { inject, injectable } from "tsyringe";
import { IloginDto } from "./Dtos/loginDto";
import { ISignupDto } from "./Dtos/signupDto";
import { IUserDto } from "../users/userDto";
import { ISecurityDto } from "./Dtos/securityDto"; 
import { auth } from "../../infrastructure/config/authConfiguration";
import { UserRole } from "../../domain/entities/User";

@injectable()
@Route("security")
@Tags("Security")
export class SecurityController extends Controller {
    constructor(@inject(SecurityService) private securityService: SecurityService) {
        super();
    }

    @Security("jwt", ["admin"])
    @Get("userinfo")
    public async userInfo(@Request() request: any): Promise<IUserDto> {
        return request.user; 
    }

    @Post("login")
    @SuccessResponse("200", "Login successful")
    @Tags("Security")
    public async login(@Body() loginDto: IloginDto): Promise<ISecurityDto> {
        const { email, password } = loginDto;
        
        // First, check if the user exists in our database
        const userData = await this.securityService.get({ email, password }); 
        
        if (!userData) {
            throw new Error("Not valid user or password");
        }

        try {
           
            const response = await auth.api.signInEmail({
                body: {
                    email,
                    password
                }
            });
            
            // Return user data with token
            return {
                email: userData.email,
                name: userData.name || '',
                role: userData.role,
                phone: userData.phone,
                token: response.token
            };
        } catch (error: any) {
            console.error('Login error:', error);
            throw new Error('Authentication failed');
        }
    } 

    @Post('/signup')
    @SuccessResponse('200', 'Signup successful')
    @Tags("Security")
    public async signup(@Body() requestBody: ISignupDto): Promise<IUserDto> {
        const { email, password, name, phone } = requestBody;

        // Check if user already exists
        let userData = await this.securityService.checkUserEmail(email);
        if (userData) throw new Error('User already exists');

        try {
            // Create the user in better-auth first
            await auth.api.signUpEmail({
                body: {
                    email,
                    password: password || '', 
                    name: name || email.split('@')[0],
                    metadata: {
                        role: UserRole.USER 
                    }
                }
            });
            
            // Then create the user in our database
            return await this.securityService.signup(requestBody);
        } catch (error: any) {
            throw new Error(`Failed to sign up: ${error.message}`);
        }
    }
}
