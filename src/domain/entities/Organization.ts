import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity()
export class Organization {
    @PrimaryGeneratedColumn("uuid")
    public id!: string;

    @Column({nullable: true})
    public name!: string;

    @OneToMany(type => User, user => user.organization)
    public users!: User[];

}
