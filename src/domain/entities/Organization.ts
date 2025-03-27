import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { AutoMap } from '@automapper/classes';

@Entity()
export class Organization {
    @AutoMap()
    @PrimaryGeneratedColumn("uuid")
    public id!: string;

    @AutoMap()
    @Column({nullable: true})
    public name!: string;

    @AutoMap()
    @OneToMany(type => User, user => user.organization)
    public users!: User[];

}
