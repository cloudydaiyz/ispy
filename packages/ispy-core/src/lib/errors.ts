import assert from "assert";

export type AppErrorOptions = {
    requestId?: string,
    detailedMessage?: string,
    statusCode?: number,
}

// Error that can occur while the application is running (e.g. while handling a request)
// Does not include errors that happen on application setup or teardown
export class AppError extends Error {
    static defaultMessage: string = "A server error has occurred.";
    errorType: string = "server";
    statusCode: number = 500;
    timestamp: number;
    requestId?: string;
    detailedMessage?: string;

    constructor(message?: string, opt?: AppErrorOptions) {
        super(message);
        this.name = "AppError";
        this.timestamp = Date.now();
        this.statusCode = opt?.statusCode || this.statusCode;
        this.requestId = opt?.requestId;
        this.detailedMessage = opt?.detailedMessage;
    }

    toString() {
        return JSON.stringify({
            timestamp: this.timestamp,
            errorType: this.errorType,
            message: this.message,
            statusCode: this.statusCode,
            requestId: this.requestId,
        }, null, 4);
    }

    toJSON() {
        return {
            errorType: this.errorType,
            message: this.message,
        };
    }

    static assert(value: unknown, message?: string, opt?: AppErrorOptions): asserts value {
        assert(value, new this(message || this.defaultMessage, opt));
    }
}

export class InvalidInputError extends AppError {
    static defaultMessage = "Invalid input";
    errorType = "invalid-input";
    statusCode = 400;
}

export class IllegalStateError extends AppError {
    static defaultMessage = "Illegal state";
    errorType = "illegal-state";
    statusCode = 400;
}

export class InvalidAuthError extends AppError {
    static defaultMessage = "Invalid auth";
    errorType = "invalid-auth";
    statusCode = 401;
}

export class ExpiredPermissionsError extends AppError {
    static defaultMessage = "Auth expired";
    errorType = "expired-auth";
    statusCode = 401;
}

export class InvalidPermissionsError extends AppError {
    static defaultMessage = "Invalid permissions";
    errorType = "invalid-permissions";
    statusCode = 403;
}