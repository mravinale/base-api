import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn, ManyToOne } from "typeorm";
import { Organization } from "./Organization";
import { AutoMap } from '@automapper/classes';

export enum UserRole {
  ADMIN = "admin",
  EDITOR = "editor",
  USER = "user"
}

@Entity()
export class User {
  @AutoMap()
  @PrimaryGeneratedColumn("uuid")
  public id!: string;

  @AutoMap()
  @Column({nullable: true})
  public name!: string;

  @AutoMap()
  @Column()
  public email!: string;

  @AutoMap()
  @Column({default: "admin" })
  public password!: string;

  @AutoMap()
  @Column({nullable: true})
  public phone?: string;

  @AutoMap()
  @Column({ type: "enum", enum: UserRole, default: UserRole.USER })
  public role!: UserRole;

  @ManyToOne(type => Organization, organization => organization.users)
  @JoinColumn()
  @AutoMap()
  public organization!: Organization;
}
