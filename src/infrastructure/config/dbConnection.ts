import constants from "./constants";
import { Logger } from "../utils/Logger";
import { singleton } from 'tsyringe';
import { DataSource } from "typeorm";
import { resolve } from 'path';

@singleton()
export class DbConnection {
  public datasource!: DataSource;

  public initializeDbConnection = () => {
    // const config = constants.SQL;
    Logger.info(`connecting to ${constants.environment} SQL ...`);

    const domainPath = resolve(__dirname, '../..', 'domain');

    this.datasource = new DataSource({
      type: "postgres",
      host: constants.SQL.host,
      port: constants.SQL.port,
      username: constants.SQL.username,
      password: constants.SQL.password,
      database: constants.SQL.name,
      entities: [ `${ domainPath }/entities/*.{js,ts}`],
      synchronize: true,
      migrationsRun: false,
      logging: false,
      migrations: [`${ domainPath }/migrations/*.ts`],
      migrationsTableName: "migrations_table",
    })

    return this.datasource.initialize()
        .then(() => {
          Logger.info("Data Source has been initialized!")
          this.runMigrations();
        })
        .catch((err) => {
          Logger.error("Error during Data Source initialization", err)
          throw err;
        })
  };

  private runMigrations = () => {
    this.datasource.runMigrations()
        .then(() => {
          Logger.info('Migrations successfully run.');
        })
        .catch(err => {
          Logger.error('Failed to run migrations:', err);
          throw err;
        });
  };
}
