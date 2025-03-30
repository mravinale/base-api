import 'reflect-metadata';
import 'module-alias/register';
import { initContainer } from './infrastructure/config/ioc'; 
import { container } from 'tsyringe';
import { Server } from './infrastructure/config/server';

// Initialize the IoC container FIRST
initContainer();

// Now resolve the Server instance and start it
const server = container.resolve(Server);

server.start();

export default server;
