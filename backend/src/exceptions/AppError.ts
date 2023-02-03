import { StatusCodes } from 'http-status-codes';
// Extend the default Error class

interface AppErrorArgs {
  name?: string;
  httpCode: StatusCodes;
  description: string;
  // True for user error, false if programmer error in which case crash immediately
  isOperational?: boolean;
}

export class AppError extends Error {
    public readonly name: string;
    public readonly httpCode: StatusCodes;
    public readonly isOperational: boolean = true;

    constructor(args: AppErrorArgs) {
        super(args.description);

        Object.setPrototypeOf(this, new.target.prototype);

        this.name = args.name || 'Error';
        this.httpCode = args.httpCode;

        if (args.isOperational !== undefined) {
        this.isOperational = args.isOperational;
        }

        Error.captureStackTrace(this);
    }
}
