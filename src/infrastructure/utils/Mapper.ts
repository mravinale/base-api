import { createMapper, Mapper, MappingConfiguration } from '@automapper/core';
import { classes } from '@automapper/classes';
import { singleton } from 'tsyringe';

@singleton()
export class MapperService {
  constructor() {
    this.mapper = createMapper({
      strategyInitializer: classes()
    });
  }

  public getMapper(): Mapper {
    return this.mapper;
  }

  public addProfile(profile: (mapper: Mapper) => void): void {
    profile(this.mapper);
  }

  private mapper: Mapper;
}
