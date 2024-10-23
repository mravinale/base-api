import { Body, Controller, Get, Post, Request, Route, Security, SuccessResponse, Tags, Middlewares } from "tsoa";
import * as jwt from "jsonwebtoken";
import { SecurityService } from "./securityService";
import { inject, injectable } from "tsyringe";
import { IloginDto } from "./Dtos/loginDto";
import { ISignupDto } from "./Dtos/signupDto";
import { IUserDto } from "../users/userDto";
import constants from "../../infrastructure/config/constants";

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
            const token = jwt.sign({...userData}, constants.CRYPTO.secret);

            return {...userData, token };
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
