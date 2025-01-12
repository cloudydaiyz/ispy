import { Entities, Requests } from "@cloudydaiyz/ispy-shared";
import { DatabaseCtx } from "./db"
import { SchedulerCtx } from "./scheduler";

// Interaction between the app and its infrastructure
// Setup on app setup
export type AppContext = {
    db: DatabaseCtx,
    scheduler: SchedulerCtx,
}

export interface WebsocketModifyConnectionContext {
    setAuthenticated: (flag: boolean) => Promise<void>;
    setViewingTaskInfo: (flag: boolean) => Promise<void>;
    setViewingGameInfo: (flag: boolean) => Promise<void>;
    setViewingGameHostInfo: (flag: boolean) => Promise<void>;
}

// Specific information about a webocket connection
export interface WebsocketConnectionContext extends WebsocketModifyConnectionContext {
    getUsername: () => string;
    getRole: () => Entities.UserRole;
    isAuthenticated: () => boolean;
    isViewingTaskInfo: () => boolean;
    isViewingGameInfo: () => boolean;
    isViewingGameHostInfo: () => boolean;
}

// Websocket requests that can be sent to client(s)
// Setup on app setup
export interface WebsocketOperationsContext extends Requests.WebsocketServerOperations {
    // sets the target of the following request
    // must be called before each websocket method (from `Requests.WebsocketServerOperations`)
    to: (target: string[] | Entities.UserRole | 'all') => WebsocketOperationsContext;
    // obtains information about websocket connections for the target
    get: (target: string[] | Entities.UserRole | 'all') => WebsocketConnectionContext[];
    // sets up a bulk operation that can be performed on the next call on the target
    bulk: (target: string[] | Entities.UserRole | 'all') => WebsocketModifyConnectionContext;
    // disconnects the connection with the target
    disconnect: (target: string[] | Entities.UserRole | 'all') => void;
};

export type CurrentRequest = {
    requestId: string;
    // from user's access token, if any
    username?: string;
    // user information, if retrieved from the db (usually to confirm role)
    currentUser?: Entities.User;
    // if the current request was sent through a websocket, information about the current connection
    socket?: WebsocketConnectionContext;
}

// Information about the current request that can be set/used in operations
// Setup for each request when request is received
export interface RequestContext {
    setRequest(request: CurrentRequest): void;
    getRequest(): CurrentRequest;
}

export type Context = {
    app: AppContext,
    sock: WebsocketOperationsContext,
    req: RequestContext,
};