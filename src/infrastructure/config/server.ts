import bodyParser from "body-parser";
import { RegisterRoutes } from "../../../build/routes";
import express, { Response as ExResponse, Request as ExRequest } from "express";
import swaggerUi from "swagger-ui-express";
import morgan from "morgan";
import { ErrorHandler } from "../utils/ErrorHandler";
import { Logger } from "../utils/Logger";
import constants from "./constants";
import { autoInjectable } from 'tsyringe';
import { DbConnection } from './dbConnection';
import cors from "cors"

@autoInjectable()
export class Server {

    public app: express.Express = express();

    private readonly port: number = constants.port ? Number(constants.port) : 3030;
    private server: any = null;

    constructor(private dbConnection?: DbConnection) {
        this.app.use(cors());

        // Use body parser to read sent json payloads
        this.app.use(
            bodyParser.urlencoded({
                extended: true,
            })
        );

        this.app.use(bodyParser.json());

        // Properly type-cast swagger middleware to work with express
        this.app.use("/docs", swaggerUi.serve as unknown as express.RequestHandler[]);
        this.app.get("/docs", async (_req: ExRequest, res: ExResponse) => {
            const swaggerDocument = await import("../../../build/swagger.json");
            return res.send(swaggerUi.generateHTML(swaggerDocument));
        });

        this.app.get('/', (req, res) => {
            res.send('Check API documentation  -> /docs')
        })

        this.app.use(morgan("dev", {skip: () => !Logger.shouldLog}));
        RegisterRoutes(this.app);
        this.app.use(ErrorHandler.handleError);
    }

    public async start() {
        process.on("uncaughtException", Server.unhandledRejectionHandler);
        process.on("unhandledRejection", Server.uncaughtExceptionHandler);

        if (this.dbConnection) await this.dbConnection.initializeDbConnection();

        this.server = this.app.listen(this.port);
        Logger.info(
            `${constants.environment} server running on port: ${this.port}`
        );
        return this.server;
    }

    public async stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.server) {
                this.server.close((err) => {
                    if (err) {
                        Logger.error('Error closing server', err);
                        reject(err);
                    } else {
                        Logger.info('Server closed successfully');
                        this.server = null;
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    private static unhandledRejectionHandler(err: unknown) {
        if (err instanceof Error) {
            Logger.error('Uncaught Exception thrown', err);
        } else {
            Logger.error('Uncaught Exception thrown', String(err));
        }
        process.exit(1);
    }
    
    private static uncaughtExceptionHandler(reason: unknown) {
        if (reason instanceof Error) {
            Logger.error('Unhandled Rejection at Promise', reason.stack);
        } else if (typeof reason === 'object' && reason !== null && 'stack' in reason) {
            Logger.error('Unhandled Rejection at Promise', (reason as { stack: string }).stack);
        } else {
            Logger.error('Unhandled Rejection at Promise', String(reason));
        }
        process.exit(1);
    }

}
