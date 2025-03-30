import { User } from "@domain/entities/User";
import { AutoMap } from '@automapper/classes';

export interface IOrganizationDto {
    id?: string;
    name?: string;
    users?: User[];
}

export class OrganizationDto implements IOrganizationDto {
    @AutoMap()
    public id?: string;
    
    @AutoMap()
    public name?: string;
    
    @AutoMap()
    public users?: User[];

    constructor(args: IOrganizationDto) {
        Object.assign(this, args);
    }
}
