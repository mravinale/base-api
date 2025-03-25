import { Adapter, Where, BetterAuthOptions } from "better-auth/types";
import { 
  DataSource, 
  Repository, 
  FindOptionsWhere, 
  In, 
  Not, 
  MoreThan, 
  MoreThanOrEqual, 
  LessThan, 
  LessThanOrEqual, 
  Like 
} from "typeorm";
import { User } from "../../domain/entities/User";

export class TypeORMAdapter implements Adapter {
  // Required adapter ID - public instance field
  public readonly id = "typeorm";
  
  // Constructor
  constructor(private readonly dataSource: DataSource | null) {}

  /**
   * Count records
   */
  public async count(data: { model: string; where?: Where[] }): Promise<number> {
    // If we're in test mode and don't have a dataSource, return mock data
    if (!this.dataSource) {
      return 0;
    }

    const conditions = data.where ? this.whereToTypeORM(data.where) : {};
    
    switch (data.model) {
      case "user":
        const userRepo = this.getUserRepo();
        return userRepo.count({
          where: conditions as FindOptionsWhere<User>
        });
        
      // For now, other models return 0
      // This will be expanded as we implement other models
      default:
        return 0;
    }
  }

  /**
   * Create a new record
   */
  public async create<T extends Record<string, any>, R = T>(data: {
    model: string;
    data: T;
    select?: string[];
  }): Promise<R> {
    // If we're in test mode and don't have a dataSource, return mock data
    if (!this.dataSource) {
      return data.data as unknown as R;
    }

    switch (data.model) {
      case "user":
        const userRepo = this.getUserRepo();
        // Map better-auth user fields to your User entity
        const userEntity = userRepo.create({
          email: data.data.email,
          name: data.data.name,
          role: data.data.role || "user", // Default role
          // Map other fields as needed
        });
        
        const savedUser = await userRepo.save(userEntity);
        return this.selectFields(savedUser, data.select) as unknown as R;
        
      case "session":
        // For now, just return the data as is
        // This will be expanded as we implement session management
        return data.data as unknown as R;
        
      case "account":
        // For now, just return the data as is
        // This will be expanded as we implement account management
        return data.data as unknown as R;
        
      default:
        throw new Error(`Model ${data.model} not supported by TypeORM adapter`);
    }
  }

  /**
   * Find a single record
   */
  public async findOne<T>(data: {
    model: string;
    where: Where[];
    select?: string[];
  }): Promise<T | null> {
    // If we're in test mode and don't have a dataSource, return mock data
    if (!this.dataSource) {
      return null;
    }

    const conditions = this.whereToTypeORM(data.where);
    
    switch (data.model) {
      case "user":
        const userRepo = this.getUserRepo();
        const user = await userRepo.findOne({
          where: conditions as FindOptionsWhere<User>,
          select: data.select as (keyof User)[]
        });
        
        return user as unknown as T;
        
      // For now, other models return null
      // This will be expanded as we implement other models
      default:
        return null;
    }
  }

  /**
   * Find multiple records
   */
  public async findMany<T>(data: {
    model: string;
    where?: Where[];
    limit?: number;
    sortBy?: {
      field: string;
      direction: "asc" | "desc";
    };
    offset?: number;
    select?: string[];
  }): Promise<T[]> {
    // If we're in test mode and don't have a dataSource, return mock data
    if (!this.dataSource) {
      return [] as unknown as T[];
    }

    const conditions = data.where ? this.whereToTypeORM(data.where) : {};
    const options: any = {
      where: conditions,
      take: data.limit,
      skip: data.offset
    };
    
    // Add sorting if provided
    if (data.sortBy) {
      options.order = {
        [data.sortBy.field]: data.sortBy.direction.toUpperCase()
      };
    }
    
    switch (data.model) {
      case "user":
        const userRepo = this.getUserRepo();
        const users = await userRepo.find(options);
        return users as unknown as T[];
        
      // For now, other models return empty array
      // This will be expanded as we implement other models
      default:
        return [] as unknown as T[];
    }
  }

  /**
   * Update a record
   */
  public async update<T>(data: {
    model: string;
    where: Where[];
    update: Record<string, any>;
  }): Promise<T | null> {
    // If we're in test mode and don't have a dataSource, return mock data
    if (!this.dataSource) {
      return null;
    }

    const conditions = this.whereToTypeORM(data.where);
    
    switch (data.model) {
      case "user":
        const userRepo = this.getUserRepo();
        // First update the entity
        await userRepo.update(conditions, data.update);
        
        // Then fetch the updated entity to return
        const user = await userRepo.findOne({
          where: conditions as FindOptionsWhere<User>
        });
        
        return user as unknown as T;
        
      // For now, other models return null
      // This will be expanded as we implement other models
      default:
        return null;
    }
  }

  /**
   * Update multiple records
   */
  public async updateMany(data: {
    model: string;
    where: Where[];
    update: Record<string, any>;
  }): Promise<number> {
    // If we're in test mode and don't have a dataSource, return mock data
    if (!this.dataSource) {
      return 0;
    }

    const conditions = this.whereToTypeORM(data.where);
    
    switch (data.model) {
      case "user":
        const userRepo = this.getUserRepo();
        const result = await userRepo.update(conditions, data.update);
        return result.affected || 0;
        
      // For now, other models return 0
      // This will be expanded as we implement other models
      default:
        return 0;
    }
  }

  /**
   * Delete a record
   */
  public async delete(data: { model: string; where: Where[] }): Promise<void> {
    // If we're in test mode and don't have a dataSource, return
    if (!this.dataSource) {
      return;
    }

    const conditions = this.whereToTypeORM(data.where);
    
    switch (data.model) {
      case "user":
        const userRepo = this.getUserRepo();
        await userRepo.delete(conditions);
        break;
        
      // For now, other models do nothing
      default:
        break;
    }
  }

  /**
   * Delete multiple records
   */
  public async deleteMany(data: { model: string; where: Where[] }): Promise<number> {
    // If we're in test mode and don't have a dataSource, return mock data
    if (!this.dataSource) {
      return 0;
    }

    const conditions = this.whereToTypeORM(data.where);
    
    switch (data.model) {
      case "user":
        const userRepo = this.getUserRepo();
        const result = await userRepo.delete(conditions);
        return result.affected || 0;
        
      // For now, other models return 0
      // This will be expanded as we implement other models
      default:
        return 0;
    }
  }

  /**
   * Helper: Get User repository with lazy initialization
   */
  private getUserRepo(): Repository<User> {
    if (!this.dataSource) {
      throw new Error("DataSource is not initialized");
    }
    return this.dataSource.getRepository(User);
  }

  /**
   * Helper: Select specific fields from an entity
   */
  private selectFields<T extends object>(entity: T, fields?: string[]): Partial<T> {
    if (!fields || fields.length === 0) return entity;
    
    return fields.reduce((obj, field) => {
      if (field in entity) {
        obj[field] = entity[field];
      }
      return obj;
    }, {} as any);
  }

  /**
   * Helper: Convert better-auth Where[] to TypeORM conditions
   */
  private whereToTypeORM(whereConditions: Where[]): Record<string, any> {
    const conditions: Record<string, any> = {};
    
    for (const condition of whereConditions) {
      const { field, operator, value } = condition;
      
      switch (operator) {
        case "eq":
          conditions[field] = value;
          break;
          
        case "ne":
          conditions[field] = Not(value);
          break;
          
        case "gt":
          conditions[field] = MoreThan(value);
          break;
          
        case "gte":
          conditions[field] = MoreThanOrEqual(value);
          break;
          
        case "lt":
          conditions[field] = LessThan(value);
          break;
          
        case "lte":
          conditions[field] = LessThanOrEqual(value);
          break;
          
        case "in":
          conditions[field] = In(value as any[]);
          break;
          
        case "contains":
          conditions[field] = Like(`%${value}%`);
          break;
          
        default:
          conditions[field] = value;
      }
    }
    
    return conditions;
  }
}
