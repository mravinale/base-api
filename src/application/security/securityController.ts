import { Body, Controller, Get, Post, Request, Route, Security, SuccessResponse, Tags, Middlewares } from "tsoa";
import { SecurityService } from "./securityService";
import { inject, injectable } from "tsyringe";
import { IloginDto } from "./Dtos/loginDto";
import { ISignupDto } from "./Dtos/signupDto";
import { IUserDto } from "../users/userDto";
import { auth } from "../../infrastructure/config/auth";
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

        let userData = await this.securityService.get({email, password});

        if (userData) {
            // Generate JWT token using better-auth's jwt plugin
            const token = jwt.sign(
                { 
                    email: userData.email,
                    name: userData.name || '',
                    role: userData.role 
                },
                constants.CRYPTO.secret,
                { expiresIn: '1d' }
            );
            
            return {
                email: userData.email,
                name: userData.name || '',
                role: userData.role,
                phone: userData.phone,
                token
            };
        } else {
            throw new Error('Not valid user or password');
        }
    }

    @Post('/signup')
    @SuccessResponse('200', 'Signup successful')
    @Tags("Security")
    public async signup(@Body() requestBody: ISignupDto): Promise<IUserDto> {

        let userData = await this.securityService.checkUserEmail(requestBody.email);

        if (userData) throw new Error('User already exists');

        return await this.securityService.signup(requestBody);
    }
}
