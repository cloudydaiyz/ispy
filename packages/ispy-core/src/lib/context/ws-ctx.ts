import { Entities, Requests } from "@cloudydaiyz/ispy-shared";

export interface AbstractWebsocket {
    send: (message: string) => void;
    close: () => void;
}

export type WebsocketConnection = {
    ws: AbstractWebsocket;
    username: string;
    role: Entities.UserRole;
    taskInfoView?: string;
    isViewingGameInfo: boolean;
    isViewingGameHostInfo: boolean;
}

// Specific information about a webocket connection
export interface ReadWebsocketConnection {
    getUsername: () => string;
    getRole: () => Entities.UserRole;
    // Specifies the ID of the task the user is viewing, if any
    getTaskInfoView: () => string | undefined;
    isViewingGameInfo: () => boolean;
    isViewingGameHostInfo: () => boolean;
}

// Operations that can be performed on websocket connections
export interface ModifyWebsocketConnection {
    setTaskInfoView: (taskId?: string) => Promise<void>;
    setViewGameInfo: (flag: boolean) => Promise<void>;
    setViewGameHostInfo: (flag: boolean) => Promise<void>;
}

// Operations that cna be performed on a single websocket connection
export type AccessWebsocketConnection = ReadWebsocketConnection & ModifyWebsocketConnection;

export type WebsocketTarget = string[] | Entities.UserRole | 'all';

export interface WebsocketInitOperations {
    // Sets up connection information
    connect: (target: WebsocketConnection) => void;
    // Disconnects the connection with the target
    disconnect: (target: WebsocketTarget) => void;
}

// Websocket requests that can be sent to client(s)
// Setup on app setup
export interface WebsocketOperationsContext extends Requests.WebsocketServerOperations, WebsocketInitOperations {
    // Sets the target of the following request
    // Must be called before each method
    // Returns another context with target set to params to chain calls
    to: (target: WebsocketTarget) => WebsocketOperationsContext;
    // Obtains information about websocket connections for the target
    read: () => ReadWebsocketConnection[];
    // Sets up a bulk operation that can be performed on the target
    modify: () => ModifyWebsocketConnection;
    // Obtains read & write information for the given user
    get: (username: string) => AccessWebsocketConnection;
};