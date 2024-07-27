import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn, ManyToOne } from "typeorm";
import { Organization } from "./Organization";

export enum UserRole {
  ADMIN = "admin",
  EDITOR = "editor",
  USER = "user"
}

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  public id!: string;

  @Column({nullable: true})
  public name!: string;

  @Column()
  public email!: string;

  @Column({default: "admin" })
  public password!: string;

  @Column({nullable: true})
  public phone?: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.USER })
  public role!: UserRole;

  @ManyToOne(type => Organization, organization => organization.users)
  @JoinColumn()
  public organization!: Organization;
}
