import { Entities, Requests } from "@cloudydaiyz/ispy-shared";
import { DatabaseCtx } from "./db"
import { SchedulerCtx } from "./scheduler";

// Interaction between the app and its infrastructure
// Setup on app setup
export type AppContext = {
    db: DatabaseCtx,
    scheduler: SchedulerCtx,
}

// Operations that can be performed on websocket connections
export interface WebsocketModifyConnection {
    setAuthenticated: (flag: boolean) => Promise<void>;
    setTaskInfoView: (taskId?: string) => Promise<void>;
    setViewGameInfo: (flag: boolean) => Promise<void>;
    setViewGameHostInfo: (flag: boolean) => Promise<void>;
}

// Specific information about a webocket connection
export interface WebsocketConnection extends WebsocketModifyConnection {
    getUsername: () => string;
    getRole: () => Entities.UserRole;
    // Specifies the ID of the task the user is viewing, if any
    getTaskInfoView: () => string | undefined;
    isAuthenticated: () => boolean;
    isViewingGameInfo: () => boolean;
    isViewingGameHostInfo: () => boolean;
}

export type WebsocketTarget = string[] | Entities.UserRole | 'all';

// Websocket requests that can be sent to client(s)
// Setup on app setup
export interface WebsocketOperationsContext extends Requests.WebsocketServerOperations {
    // Sets the target of the following request
    // Must be called before each websocket method (from `Requests.WebsocketServerOperations`)
    // Returns self to chain calls
    to: (target: WebsocketTarget) => WebsocketOperationsContext;
    // Obtains information about websocket connections for the target
    get: (target: WebsocketTarget) => WebsocketConnection[];
    // Sets up a bulk operation that can be performed on the target
    bulk: (target: WebsocketTarget) => WebsocketModifyConnection;
    // Disconnects the connection with the target
    disconnect: (target: WebsocketTarget) => void;
};

export type CurrentRequest = {
    requestId: string;
    // From user's access token, if any
    username?: string;
    // User information, if retrieved from the db (usually to confirm role). Used if access token is provided.
    currentUser?: Entities.User;
    // Information about the current connection if the current request was sent through a websocket
    socket?: WebsocketConnection;
}

// Information about the current request that can be set/used in operations
// Setup for each request when request is received
export interface RequestContext {
    setRequest: (request: CurrentRequest) => void;
    getRequest: () => CurrentRequest;
}

export type Context = {
    app: AppContext,
    sock: WebsocketOperationsContext,
    req: RequestContext,
};