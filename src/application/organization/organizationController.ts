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
import { IUserDto } from "./organizationDto";
import { IPaginationDto, PaginationDto } from "../../infrastructure/utils/PaginationDto";
import { injectable } from 'tsyringe';
import { OrganizationService } from "./organizationService";

@injectable()
@Route("Organization")
export class OrganizationController extends Controller {
    constructor(private organizationService: OrganizationService) {
        super();
    }

    @Get("{id}")
    @Tags("Organization")
    @Security("jwt", ["admin"])
    public async get( id: string ): Promise<IUserDto> {
        return this.organizationService.get(id);
    }

    @Get()
    @Tags("Organization")
    @Security("jwt", ["admin"])
    public async getPaginated(
        @Query("page") page: number,
        @Query("limit") limit: number,
        @Query("sort") sort?: string,
        @Query("field") field?: string,
        @Query("filter") filter?: string
    ): Promise<IPaginationDto> {
        return this.organizationService.getPaginated(new PaginationDto({ page, limit, sort, field, filter }));
    }

    @Response(400, "Bad request")
    @SuccessResponse("201", "Created") // Custom success response
    @Post()
    @Tags("Organization")
    @Security("jwt", ["admin"])
    public async create(@Body() body: IUserDto): Promise<IUserDto> {
        return this.organizationService.create(body);
    }

    @Response(400, "Bad request")
    @Put("{id}")
    @Tags("Organization")
    @Security("jwt", ["admin"])
    public async update(id: string, @Body() body: IUserDto): Promise<IUserDto> {
        return this.organizationService.update(id, body);
    }

    @Delete("{id}")
    @Tags("Organization")
    @Security("jwt", ["admin"])
    public async delete(id: string): Promise<string> {
        return this.organizationService.delete(id);
    }
}
