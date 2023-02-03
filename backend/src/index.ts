import App from './app';
import DBHandler from './database/DBHandler';
import MysqlDatabase from './database/MysqlDatabase';

// Where this is running
const WEB_API_PORT = 10090;

// Specify database the app will use
DBHandler.set_database(new MysqlDatabase(
    process.env.DB_HOST,
    'backend_user',
    process.env.DB_BACKEND_USER_PASSWORD,
    'cosmos'
));

// Start app
const app = new App();
app.express.listen(WEB_API_PORT, () => {
    console.log(`server running on port ${WEB_API_PORT}`);
});
