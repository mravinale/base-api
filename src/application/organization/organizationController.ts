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
    @Tags("Organization")
    @Security("jwt", ["admin"])
    public async get( id: string ): Promise<IOrganizationDto> {
        const organization = await this.organizationService.get(id);
        if (!organization) {
            this.setStatus(404);
            return {} as IOrganizationDto;
        }
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
    @SuccessResponse("201", "Created") // Custom success response
    @Post()
    @Tags("Organization")
    @Security("jwt", ["admin"])
    public async create(@Body() body: IOrganizationDto): Promise<IOrganizationDto> {
        this.setStatus(201); // Set response status code
        const result = await this.organizationService.create(body);
        if (!result) {
            this.setStatus(500);
            return {} as IOrganizationDto;
        }
        return result;
    }

    @Response(400, "Bad request")
    @Put("{id}")
    @Tags("Organization")
    @Security("jwt", ["admin"])
    public async update(id: string, @Body() body: IOrganizationDto): Promise<IOrganizationDto> {
        const result = await this.organizationService.update(id, body);
        if (!result) {
            this.setStatus(404);
            return {} as IOrganizationDto;
        }
        return result;
    }

    @Delete("{id}")
    @Tags("Organization")
    @Security("jwt", ["admin"])
    public async delete(id: string): Promise<string> {
        try {
            // First check if the organization exists
            const organization = await this.organizationService.get(id);
            
            if (!organization) {
                this.setStatus(404);
                return "Organization not found";
            }
            
            const result = await this.organizationService.delete(id);
            
            // TypeORM returns the number of affected rows as a string
            if (result === "0") {
                this.setStatus(404);
                return "Organization not found";
            }
            
            return `Organization with ID ${id} deleted successfully`;
        } catch (error) {
            // If the error is because the organization doesn't exist, return 404
            if ((error as Error).message.includes("not found")) {
                this.setStatus(404);
                return "Organization not found";
            }
            
            // For other errors, return 500
            this.setStatus(500);
            return `Error deleting organization: ${(error as Error).message}`;
        }
    }
}
