import { UserRole } from "../../domain/entities/User";

export interface IUserDto {
    id?: string;
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    role?: UserRole;
}

export class UserDto implements IUserDto {
    public id?: string;
    public email?: string;
    public name?: string;
    public password?: string;
    public phone?: string;
    public role?: UserRole;

    constructor(args: IUserDto) {
        Object.assign(this, args);
    }
}
