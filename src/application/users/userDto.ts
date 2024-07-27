import { Column } from "typeorm";

export interface IUserDto {
    name?: string;
    email?: string;
    phone?: string;
    skype?: string;
    points?: number;
    actionButtonText?: string;
    actionButtonLink?: string;
}

export class UserDto implements IUserDto {
    public email?: string;
    public name?: string;
    public phone?: string;
    public skype?: string;
    public points?: number;
    public actionButtonText?: string;
    public actionButtonLink?: string;

    constructor(args: IUserDto) {
        Object.assign(this, args);
    }
}
