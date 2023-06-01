import App from './app';

import MysqlDatabase from './database/MysqlDatabase';
import CEOdatabase from './database/CEOdb';

// Where this is running
const WEB_API_PORT = 10090;

// Start server app only after CosmosModule and all else has been loaded
console.log('before new app');
const serverApp = new App();
serverApp.Init(new MysqlDatabase(
    process.env.DB_HOST,
    'backend_user',
    process.env.DB_BACKEND_USER_PASSWORD,
    'cosmos'
),
new MysqlDatabase(
    process.env.DB_HOST,
    'backend_user',
    process.env.DB_BACKEND_USER_PASSWORD,
    'sim_cosmos'
),
new CEOdatabase(
    process.env.DB_HOST,
    'backend_user',
    process.env.DB_BACKEND_USER_PASSWORD,
    'cosmos_ceo'
)).then((app) => {
    console.log('in new app then');
    app.express.listen(WEB_API_PORT, () => {
        console.log(`server running on port ${WEB_API_PORT}`);
    });
});


// TODO need extra class functionality to manage multiple ip address too 