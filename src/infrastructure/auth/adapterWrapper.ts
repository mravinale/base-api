import { Adapter, Where } from "better-auth/types";
import { TypeORMAdapter } from "./typeormAdapter";
import { DataSource } from "typeorm";

/* tslint:disable:member-ordering */
/**
 * AdapterWrapper class that wraps the TypeORMAdapter to make it compatible with the Adapter interface
 * This resolves type compatibility issues between the TypeORMAdapter implementation and the Adapter interface
 */
export class AdapterWrapper implements Adapter {
  // All properties first (public, then private)
  public readonly id: string;
  private typeormAdapter: TypeORMAdapter;
  
  // Constructor after all properties
  public constructor(dataSource: DataSource | null) {
    this.typeormAdapter = new TypeORMAdapter(dataSource);
    this.id = this.typeormAdapter.id;
  }
  
  // All methods after constructor
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
      return this.typeormAdapter.create({ model: collectionOrData, data });
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
      return this.typeormAdapter.findOne({ model: collectionOrData, where: query ? [query] : [] });
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
      return this.typeormAdapter.findMany({ model: collectionOrData, where: query ? [query] : undefined });
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
      return this.typeormAdapter.update({ model: collectionOrData, where: query ? [query] : [], update: data });
    } else {
      // TypeORMAdapter interface
      return this.typeormAdapter.update(collectionOrData);
    }
  }

  public async delete(
    collectionOrData: string | { model: string; where: Where[] },
    query?: any
  ): Promise<void> {
    if (typeof collectionOrData === 'string') {
      // Original better-auth interface
      return this.typeormAdapter.delete({ model: collectionOrData, where: query ? [query] : [] });
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
      return this.typeormAdapter.deleteMany({ model: collectionOrData, where: query ? [query] : [] });
    } else {
      // TypeORMAdapter interface
      return this.typeormAdapter.deleteMany(collectionOrData);
    }
  }

  public async updateMany<T>(
    collectionOrData: string | { model: string; where: Where[]; update: Record<string, any> },
    query?: any,
    data?: any
  ): Promise<number> {
    if (typeof collectionOrData === 'string') {
      // Original better-auth interface
      return this.typeormAdapter.updateMany({ model: collectionOrData, where: query ? [query] : [], update: data });
    } else {
      // TypeORMAdapter interface
      return this.typeormAdapter.updateMany(collectionOrData);
    }
  }
}
