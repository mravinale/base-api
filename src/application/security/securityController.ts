import { Body, Controller, Get, Post, Request, Route, Security, SuccessResponse, Tags, Middlewares } from "tsoa";
import { SecurityService } from "./securityService";
import { inject, injectable } from "tsyringe";
import { IloginDto } from "./Dtos/loginDto";
import { ISignupDto } from "./Dtos/signupDto";
import { IUserDto } from "../users/userDto";
import { auth } from "../../infrastructure/config/auth";
import { UserRole } from "../../domain/entities/User";
import jwt from 'jsonwebtoken';
import constants from '../../infrastructure/config/constants';

@Route("security")
@injectable()
export class SecurityController extends Controller {

    constructor(private securityService: SecurityService) {
        super();
    }

    @Security("jwt", ["admin"])
    @Get("/userinfo")
    @Tags("Security")
    public async userInfo( @Request() request: any ): Promise<IUserDto> {
        return request.user; // user is set by the jwt middleware
    }

    @Post('/login')
    @SuccessResponse('200', 'Login successful')
    @Tags("Security")
    public async login(@Body() requestBody: IloginDto): Promise<any> {
        const { email, password } = requestBody;

        // First, validate the user credentials using our existing service
        let userData = await this.securityService.get({email, password});
        
        if (!userData) {
            throw new Error('Not valid user or password');
        }

        try {
            // Try to use better-auth for authentication, but don't fail if it doesn't work
            let token;
            try {
                // Attempt to authenticate with better-auth
                const response = await auth.api.signInEmail({
                    body: {
                        email,
                        password
                    }
                });
                token = response.token;
            } catch (authError) {
                // Fall back to direct JWT generation if better-auth fails
                console.log('Falling back to direct JWT generation:', authError);
                token = jwt.sign(
                    { 
                        email: userData.email,
                        name: userData.name || '',
                        role: userData.role 
                    },
                    constants.CRYPTO.secret,
                    { 
                        expiresIn: '1d',
                        issuer: constants.BASE_URL || "http://localhost:3030",
                        audience: constants.BASE_URL || "http://localhost:3030"
                    }
                );
            }

            // Return user data with token
            return {
                email: userData.email,
                name: userData.name || '',
                role: userData.role,
                phone: userData.phone,
                token
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
            // First create the user in our database
            const newUser = await this.securityService.signup(requestBody);
            
            // Try to register with better-auth as well, but don't fail if it doesn't work
            try {
                await auth.api.signUpEmail({
                    body: {
                        email,
                        password: password || '', // Ensure password is not undefined
                        name: name || email.split('@')[0],
                        metadata: {
                            role: UserRole.USER, // Default role for new users
                            phone
                        }
                    }
                });
            } catch (authError) {
                // Log the error but continue with the existing user creation
                console.log('Better-auth signup failed, continuing with existing user:', authError);
            }
            
            return newUser;
        } catch (error: any) {
            throw new Error(`Failed to sign up: ${error.message}`);
        }
    }
}
