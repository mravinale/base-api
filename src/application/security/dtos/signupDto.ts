export interface ISignupDto {
    name?: string;
    email: string;
    phone?: string;
    password?: string;
}

export class SignupDto implements ISignupDto {
    public email!: string;
    public name?: string;
    public phone?: string;
    public password!: string;

    constructor(args: ISignupDto) {
        Object.assign(this, args);
    }
}
