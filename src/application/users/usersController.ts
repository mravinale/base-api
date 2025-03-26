import {
    Body,
    Controller,
    Query,
    Delete,
    Put,
    Get,
    Post,
    Route,
    Response,
    SuccessResponse,
    Tags,
    Security
} from "tsoa";
import { IUserDto } from "./userDto";
import { IPaginationDto, PaginationDto } from "../../infrastructure/utils/PaginationDto";
import { UsersService } from "./usersService";
import { injectable } from 'tsyringe';
import { ApiError } from "../../infrastructure/utils/ErrorHandler";

@injectable()
@Route("users")
export class UsersController extends Controller {
    constructor(private usersService: UsersService) {
        super();
    }

    @Get("{id}")
    @Tags("Users")
    @Security("jwt", ["admin", "user"])
    public async get( id: string ): Promise<IUserDto> {
        try {
            console.log(`UsersController.get - Looking for user with ID: ${id}`);
            const user = await this.usersService.get(id);
            
            if (!user) {
                console.log(`UsersController.get - User with ID ${id} not found`);
                this.setStatus(404);
                throw new ApiError({
                    statusCode: 404,
                    name: 'Not Found',
                    message: `User with id ${id} not found`
                });
            }
            
            return user;
        } catch (error) {
            console.error(`UsersController.get - Error fetching user with ID ${id}:`, error);
            
            // If it's already an ApiError, just rethrow it
            if (error instanceof ApiError) {
                throw error;
            }
            
            // Otherwise wrap it in an ApiError with 404 status
            this.setStatus(404);
            throw new ApiError({
                statusCode: 404,
                name: 'Not Found',
                message: `User with id ${id} not found`
            });
        }
    }

    @Get()
    @Tags("Users")
    @Security("jwt", ["admin", "user"])
    public async getPaginated(
        @Query("page") page: number,
        @Query("limit") limit: number,
        @Query("sort") sort?: string,
        @Query("field") field?: string,
        @Query("filter") filter?: string
    ): Promise<IPaginationDto> {
        return this.usersService.getPaginated(new PaginationDto({ page, limit, sort, field, filter }));
    }

    @Response(400, "Bad request")
    @SuccessResponse("201", "Created") // Custom success response
    @Post()
    @Tags("Users")
    @Security("jwt", ["admin", "user"])
    public async create(@Body() body: any): Promise<IUserDto> {
        console.log('UsersController.create - Received raw body:', JSON.stringify(body, null, 2));
        
        // Extract all fields from the request body
        const userToCreate: IUserDto = {
            email: body.email,
            password: body.password,
            role: body.role,
            name: body.name,
            phone: body.phone
        };
        
        console.log('UsersController.create - Extracted user data:', JSON.stringify(userToCreate, null, 2));
        
        // Validate required fields
        if (!userToCreate.email) {
            console.error('UsersController.create - Email is required but missing');
            this.setStatus(400);
            throw new Error('Email is required');
        }
        
        if (!userToCreate.password) {
            console.error('UsersController.create - Password is required but missing');
            this.setStatus(400);
            throw new Error('Password is required');
        }
        
        if (!userToCreate.role) {
            console.error('UsersController.create - Role is required but missing');
            this.setStatus(400);
            throw new Error('Role is required');
        }
        
        const user = await this.usersService.create(userToCreate);
        if (!user) {
            this.setStatus(400);
            throw new Error('Failed to create user');
        }
        this.setStatus(201);
        return user;
    }

    @Response(400, "Bad request")
    @Put("{id}")
    @Tags("Users")
    @Security("jwt", ["admin", "user"])
    public async update(id: string, @Body() body: IUserDto): Promise<IUserDto> {
        const user = await this.usersService.update(id, body);
        if (!user) {
            this.setStatus(404);
            throw new Error(`User with id ${id} not found or could not be updated`);
        }
        return user;
    }

    @Delete("{id}")
    @Tags("Users")
    @Security("jwt", ["admin", "user"])
    public async delete(id: string): Promise<string> {
        const result = await this.usersService.delete(id);
        if (result === null) {
            this.setStatus(404);
            throw new Error(`User with id ${id} not found or could not be deleted`);
        }
        return `Successfully deleted ${result} record(s)`;
    }
}
