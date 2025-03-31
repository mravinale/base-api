import 'reflect-metadata';
import { UserRole } from "@domain/entities/User";
import { generate } from "randomstring";

export class TestHelper {
  public static getTestPassword(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  public static getModelTestPassword(): string {
    return `testmodel_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  public static generateMockUUID = (): string => {
    return `${generate({charset: 'hex', length: 8})}-${generate({charset: 'hex', length: 4})}-${generate({charset: 'hex', length: 4})}-${generate({charset: 'hex', length: 4})}-${generate({charset: 'hex', length: 12})}`;
  };

  public static generateUserModel = () => {
    const username = generate(10);
    const domain = generate(8);
    return {
      id: this.generateMockUUID(),
      email: `${username}@${domain}.com`,
      name: generate(20),
      phone: generate(20),
      role: UserRole.ADMIN,
      password: generate(20)
    };
  };

  public static generateOrganizationModel = () => {
    return {
      id: this.generateMockUUID(),
      name: `Org-${Math.random().toString(36).substring(2, 10)}`,
      users: []
    };
  };

}
