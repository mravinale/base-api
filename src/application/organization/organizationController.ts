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
import { IOrganizationDto } from "./organizationDto";
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
    @Response(404, "Organization not found")
    @SuccessResponse("200", "Organization found")
    @Tags("Organization")
    @Security("jwt", ["admin"])
    public async get( id: string ): Promise<IOrganizationDto> {
        const organization = await this.organizationService.get(id);        
        return organization;
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
    @SuccessResponse("201", "Organization created") // Custom success response
    @Post()
    @Tags("Organization")
    @Security("jwt", ["admin"])
    public async create(@Body() body: IOrganizationDto): Promise<IOrganizationDto> {
        const result = await this.organizationService.create(body);
        return result as IOrganizationDto;
    }

    @Response(400, "Bad request")
    @SuccessResponse("200", "Organization updated")
    @Put("{id}")
    @Tags("Organization")
    @Security("jwt", ["admin"])
    public async update(id: string, @Body() body: IOrganizationDto): Promise<IOrganizationDto> {
        return await this.organizationService.update(id, body);
    }

    @Response(400, "Bad request")
    @SuccessResponse("200", "Organization deleted")
    @Delete("{id}")
    @Tags("Organization")
    @Security("jwt", ["admin"])
    public async delete(id: string): Promise<string> {
        return await this.organizationService.delete(id); 
    }
}
