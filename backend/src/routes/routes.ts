import 'express-async-errors';
import { NextFunction, Response, Request, Router } from 'express';
import { errorHandler } from '../exceptions/ErrorHandler';

const router = Router();

// Express modules
const simRoute = require('./sim');
const dbRoute = require('./db');
const cmdRoute = require('./command');

// Express module/middleware for routes
router.use('/sim', simRoute);
router.use('/db', dbRoute);
router.use('/command', cmdRoute);

// Setting up a very minimal backend for cosmos web's grafana front end
router.get('/', (req, res) => {
    console.log('req received')
    res.send('Hello World!\n')
});


// Error-handler middlewares always last
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    errorHandler.handleError(err, res);
})

export default router;
