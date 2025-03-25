import { Column } from "typeorm";
import { UserRole } from "../../domain/entities/User";

export interface IUserDto {
    id?: string;
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    skype?: string;
    points?: number;
    role?: UserRole;
    actionButtonText?: string;
    actionButtonLink?: string;
}

export class UserDto implements IUserDto {
    public id?: string;
    public email?: string;
    public name?: string;
    public password?: string;
    public phone?: string;
    public skype?: string;
    public points?: number;
    public role?: UserRole;
    public actionButtonText?: string;
    public actionButtonLink?: string;

    constructor(args: IUserDto) {
        if (args) {
            Object.assign(this, args);
        }
    }
}
