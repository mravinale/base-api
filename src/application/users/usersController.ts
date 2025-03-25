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
        const user = await this.usersService.get(id);
        if (!user) {
            this.setStatus(404);
            throw new Error(`User with id ${id} not found`);
        }
        return user;
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
    public async create(@Body() body: IUserDto): Promise<IUserDto> {
        const user = await this.usersService.create(body);
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
