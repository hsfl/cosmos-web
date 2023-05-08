import App from './app';
import { DBHandler, SIMDBHandler, CEOHandler } from './database/DBHandler';
import MysqlDatabase from './database/MysqlDatabase';
import CEOdatabase from './database/CEOdb';

// Where this is running
const WEB_API_PORT = 10090;

// Specify database the app will use
DBHandler.set_database(new MysqlDatabase(
    process.env.DB_HOST,
    'backend_user',
    process.env.DB_BACKEND_USER_PASSWORD,
    'cosmos'
));

// Integrate simulated database 
SIMDBHandler.set_database(new MysqlDatabase(
    process.env.DB_HOST,
    'backend_user',
    process.env.DB_BACKEND_USER_PASSWORD,
    'sim_cosmos'
));

CEOHandler.set_database(new CEOdatabase(
    process.env.DB_HOST,
    'backend_user',
    process.env.DB_BACKEND_USER_PASSWORD,
    'cosmos_ceo'
));

// Start app
const app = new App();
app.express.listen(WEB_API_PORT, () => {
    console.log(`server running on port ${WEB_API_PORT}`);
});

// TODO need extra class functionality to manage multiple ip address too 