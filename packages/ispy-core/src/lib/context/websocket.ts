import { Entities, Requests } from "@cloudydaiyz/ispy-shared";

export interface AbstractWebsocket {
    send: (message: string) => void;
    disconnect: () => void;
}

export type WebsocketConnection = {
    ws: AbstractWebsocket;
    username: string;
    role: Entities.UserRole;
    taskInfoView?: string;
    isAuthenticated: boolean;
    isViewingGameInfo: boolean;
    isViewingGameHostInfo: boolean;
}

// Specific information about a webocket connection
export interface ReadWebsocketConnection {
    getUsername: () => string;
    getRole: () => Entities.UserRole;
    // Specifies the ID of the task the user is viewing, if any
    getTaskInfoView: () => string | undefined;
    isAuthenticated: () => boolean;
    isViewingGameInfo: () => boolean;
    isViewingGameHostInfo: () => boolean;
}

// Operations that can be performed on websocket connections
export interface ModifyWebsocketConnection {
    setAuthenticated: (flag: boolean) => Promise<void>;
    setTaskInfoView: (taskId?: string) => Promise<void>;
    setViewGameInfo: (flag: boolean) => Promise<void>;
    setViewGameHostInfo: (flag: boolean) => Promise<void>;
}

export type WebsocketTarget = string[] | Entities.UserRole | 'all';

// Websocket requests that can be sent to client(s)
// Setup on app setup
export interface WebsocketOperationsContext extends Requests.WebsocketServerOperations {
    // Sets up connection information
    connect: (target: WebsocketConnection) => void;
    // Sets the target of the following request
    // Must be called before each method
    // Returns another context with targets set to params to chain calls
    to: (target: WebsocketTarget) => WebsocketOperationsContext;
    // Obtains information about websocket connections for the target
    read: () => ReadWebsocketConnection[];
    // Sets up a bulk operation that can be performed on the target
    modify: () => ModifyWebsocketConnection;
    // Disconnects the connection with the target
    disconnect: () => void;
};