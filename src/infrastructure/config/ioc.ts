import { IocContainer } from '@tsoa/runtime';
import { container } from 'tsyringe';
import { MapperService } from '../utils/Mapper';
import { UsersRepository } from '../../application/users/usersRepository';
import { UsersService } from '../../application/users/usersService';
import { UsersController } from '../../application/users/usersController';
import { OrganizationRepository } from '../../application/organization/organizationRepository';
import { OrganizationService } from '../../application/organization/organizationService';
import { OrganizationController } from '../../application/organization/organizationController';
import { SecurityController } from '../../application/security/securityController';
import { SecurityService } from '../../application/security/securityService';
import { DbConnection } from './dbConnection';
import { CryptoService } from '../utils/CryptoService';
import { Logger } from '../utils/Logger';

// Ensure all dependencies are registered
function registerDependencies() {
    // Register infrastructure services
    container.registerSingleton(MapperService);
    container.registerSingleton(DbConnection);
    container.registerSingleton(CryptoService);
    container.registerSingleton(Logger);
    
    // Register repositories
    container.registerSingleton(UsersRepository);
    container.registerSingleton(OrganizationRepository);
    
    // Register application services
    container.registerSingleton(UsersService);
    container.registerSingleton(OrganizationService);
    container.registerSingleton(SecurityService);
    
    // Register controllers
    container.registerSingleton(UsersController);
    container.registerSingleton(OrganizationController);
    container.registerSingleton(SecurityController);
}

// Initialize the container
registerDependencies();

export const iocContainer: IocContainer = {
    get: <T>(controller: { prototype: T }): T => {
        return container.resolve<T>(controller as never);
    },
};
