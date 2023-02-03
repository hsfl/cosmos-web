import { Response } from 'express';
import { AppError } from './AppError';
import { StatusCodes } from 'http-status-codes';
import { new_api_response } from '../utils/response';

// Custom error-handler

class ErrorHandler {
    public handleError(error: Error | AppError, response?: Response): void {
        // Expected errors within request-response cycle
        if (this.isTrustedError(error) && response) {
            this.handleTrustedError(error as AppError, response);
        } else {
            this.handleCriticalError(error, response);
        }
    }

    // Any non-custom error or any non-user-errors could be critical errors
    private isTrustedError(error: Error): boolean {
        if (error instanceof AppError) {
            return error.isOperational;
        }
        return false;
    }

    // Forseeable user errors
    private handleTrustedError(error: AppError, response: Response): void {
        response.status(error.httpCode).json(new_api_response(error.message));
    }

    // Unexpected errors
    private handleCriticalError(error: Error | AppError, response?: Response): void {
        if (response) {
        response
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json(new_api_response('Internal server error'));
        }
        // Immediately crash on serious programmer errors
        console.log('Application encountered a critical error. Exiting');
        process.exit(1);
    }
}

export const errorHandler = new ErrorHandler();
