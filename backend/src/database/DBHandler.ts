import BaseDatabase from "./BaseDatabase";

// Holds the static reference to the database used by the app
export default class DBHandler {
    private static database: BaseDatabase;

    public static set_database (database: BaseDatabase): void {
        this.database = database;
    };
    
    public static app_db (): BaseDatabase {
        return this.database;
    }
}
