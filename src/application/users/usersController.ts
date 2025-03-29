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
import { IUserDto } from "./dtos/userDto";
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
    @Response(404, "Not Found")
    @SuccessResponse("200", "OK")
    @Tags("Users")
    @Security("jwt", ["admin", "user"])
    public async get( id: string ): Promise<IUserDto> {
        const user = await this.usersService.get(id);
        return user as IUserDto;
    }

    @Get()
    @Response(400, "Bad request")
    @SuccessResponse("200", "OK")
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
    @SuccessResponse("201", "Created")
    @Post()
    @Tags("Users")
    @Security("jwt", ["admin", "user"])
    public async create(@Body() user: any): Promise<IUserDto> {
        const userCreated = await this.usersService.create(user) as IUserDto;
        
        return userCreated;
    }

    @Response(404, "Not found")
    @Put("{id}")
    @Tags("Users")
    @Security("jwt", ["admin", "user"])
    public async update(id: string, @Body() body: IUserDto): Promise<IUserDto> {
        return await this.usersService.update(id, body) as IUserDto;
    }

    @Response(404, "Not found")
    @Delete("{id}")
    @Tags("Users")
    @Security("jwt", ["admin", "user"])
    public async delete(id: string): Promise<string> {
        const result = await this.usersService.delete(id);
        return `Successfully deleted ${result} record(s)`;
    }
}
