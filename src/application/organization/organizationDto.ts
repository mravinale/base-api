import { User } from "../../domain/entities/User";

export interface IUserDto {
    id?: string;
    name?: string;
    users?: User[];
}

export class OrganizationDto implements IUserDto {
    public id?: string;
    public name?: string;
    public users?: User[];

    constructor(args: IUserDto) {
        Object.assign(this, args);
    }
}
