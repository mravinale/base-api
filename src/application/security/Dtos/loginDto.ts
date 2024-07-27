export interface IloginDto {
    email: string;
    password: string;
}

export class LoginDto implements IloginDto {
    public email!: string;
    public password!: string;

    constructor(args: IloginDto) {
        Object.assign(this, args);
    }
}
