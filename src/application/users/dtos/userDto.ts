import { UserRole } from "@domain/entities/User";
import { AutoMap } from '@automapper/classes';

export interface IUserDto {     
    id?: string;
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    role?: UserRole;
}

export class UserDto implements IUserDto {
    @AutoMap()
    public id?: string;
    
    @AutoMap()
    public email?: string;
    
    @AutoMap()
    public name?: string;
    
    @AutoMap()
    public password?: string;
    
    @AutoMap()
    public phone?: string;
    
    @AutoMap()
    public role?: UserRole;

    constructor(args: IUserDto) {
        Object.assign(this, args);
    }
}
