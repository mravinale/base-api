/* tslint:disable:member-ordering */
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

/**
 * TypeORMAdapter class that implements the Adapter interface for better-auth
 * This provides database operations for authentication and user management
 */
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
    
    // Add select fields if provided
    if (data.select && data.select.length > 0) {
      options.select = data.select;
    }
    
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
        
      default:
        throw new Error(`Model ${data.model} not supported by TypeORM adapter`);
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
        
      default:
        throw new Error(`Model ${data.model} not supported by TypeORM adapter`);
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
        
      default:
        throw new Error(`Model ${data.model} not supported by TypeORM adapter`);
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
        
      default:
        throw new Error(`Model ${data.model} not supported by TypeORM adapter`);
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
          
        case "starts_with":
          conditions[field] = Like(`${value}%`);
          break;
          
        case "ends_with":
          conditions[field] = Like(`%${value}`);
          break;
          
        default:
          conditions[field] = value;
      }
    }
    
    return conditions;
  }
}

/**
 * AdapterWrapper class that wraps the TypeORMAdapter to make it compatible with the Adapter interface
 * This resolves type compatibility issues between the TypeORMAdapter implementation and the Adapter interface
 */
export class AdapterWrapper implements Adapter {
  // Public properties first
  public readonly id: string;
  
  // Constructor must come after public properties but before private fields
  constructor(dataSource: DataSource | null) {
    this.typeormAdapter = new TypeORMAdapter(dataSource);
    this.id = this.typeormAdapter.id;
  }
  
  // Private properties after constructor
  private readonly typeormAdapter: TypeORMAdapter;
  
  // Methods after properties
  public async count(collectionOrData: string | { model: string; where?: Where[] }, query?: any): Promise<number> {
    if (typeof collectionOrData === 'string') {
      // Original better-auth interface
      return this.typeormAdapter.count({ model: collectionOrData, where: query ? [query] : undefined });
    } else {
      // TypeORMAdapter interface
      return this.typeormAdapter.count(collectionOrData);
    }
  }

  public async create<T extends Record<string, any>, R = T>(
    collectionOrData: string | { model: string; data: T; select?: string[] },
    data?: any
  ): Promise<R> {
    if (typeof collectionOrData === 'string') {
      // Original better-auth interface
      return this.typeormAdapter.create({ model: collectionOrData, data, select: undefined });
    } else {
      // TypeORMAdapter interface
      return this.typeormAdapter.create(collectionOrData);
    }
  }

  public async findOne<T>(
    collectionOrData: string | { model: string; where: Where[]; select?: string[] },
    query?: any
  ): Promise<T | null> {
    if (typeof collectionOrData === 'string') {
      // Original better-auth interface
      return this.typeormAdapter.findOne({ model: collectionOrData, where: [query], select: undefined });
    } else {
      // TypeORMAdapter interface
      return this.typeormAdapter.findOne(collectionOrData);
    }
  }

  public async findMany<T>(
    collectionOrData: string | {
      model: string;
      where?: Where[];
      limit?: number;
      sortBy?: { field: string; direction: "asc" | "desc" };
      offset?: number;
      select?: string[];
    },
    query?: any
  ): Promise<T[]> {
    if (typeof collectionOrData === 'string') {
      // Original better-auth interface
      return this.typeormAdapter.findMany({
        model: collectionOrData,
        where: query ? [query] : undefined,
        limit: undefined,
        sortBy: undefined,
        offset: undefined,
        select: undefined
      });
    } else {
      // TypeORMAdapter interface
      return this.typeormAdapter.findMany(collectionOrData);
    }
  }

  public async update<T>(
    collectionOrData: string | { model: string; where: Where[]; update: Record<string, any> },
    query?: any,
    data?: any
  ): Promise<T | null> {
    if (typeof collectionOrData === 'string') {
      // Original better-auth interface
      return this.typeormAdapter.update({ model: collectionOrData, where: [query], update: data });
    } else {
      // TypeORMAdapter interface
      return this.typeormAdapter.update(collectionOrData);
    }
  }

  public async updateMany(
    collectionOrData: string | { model: string; where: Where[]; update: Record<string, any> },
    query?: any,
    data?: any
  ): Promise<number> {
    if (typeof collectionOrData === 'string') {
      // Original better-auth interface
      return this.typeormAdapter.updateMany({ model: collectionOrData, where: [query], update: data });
    } else {
      // TypeORMAdapter interface
      return this.typeormAdapter.updateMany(collectionOrData);
    }
  }

  public async delete(
    collectionOrData: string | { model: string; where: Where[] },
    query?: any
  ): Promise<void> {
    if (typeof collectionOrData === 'string') {
      // Original better-auth interface
      return this.typeormAdapter.delete({ model: collectionOrData, where: [query] });
    } else {
      // TypeORMAdapter interface
      return this.typeormAdapter.delete(collectionOrData);
    }
  }

  public async deleteMany(
    collectionOrData: string | { model: string; where: Where[] },
    query?: any
  ): Promise<number> {
    if (typeof collectionOrData === 'string') {
      // Original better-auth interface
      return this.typeormAdapter.deleteMany({ model: collectionOrData, where: [query] });
    } else {
      // TypeORMAdapter interface
      return this.typeormAdapter.deleteMany(collectionOrData);
    }
  }
}
