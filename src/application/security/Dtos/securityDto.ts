export interface ISecurityDto {
    name?: string;
    email: string;
    phone?: string;
    skype?: string;
    role: string;
    password?: string; 
    token?: string;
}

export class SecurityDto implements ISecurityDto {
    public email!: string;
    public name?: string;
    public phone?: string;
    public skype?: string;
    public role!: string;
    public password?: string; 
    public token?: string;

    constructor(args: ISecurityDto) {
        Object.assign(this, args);
    }
}
