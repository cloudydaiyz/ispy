import { Entities, Requests } from "@cloudydaiyz/ispy-shared";
import { DatabaseCtx } from "./db"
import { SchedulerCtx } from "./scheduler";
import assert from "assert";

// Interaction between the app and its infrastructure
// Setup on app setup
export type AppContext = {
    db: DatabaseCtx,
    scheduler: SchedulerCtx,
}

// Websocket requests to be sent to client(s)
// Setup on app setup
export type SocketContext = Requests.WebsocketClientRequests;

export type CurrentRequest = {
    requestId: string;
    // from user's access token, if any
    username?: string;
    // user information, if retrieved from the db (usually to confirm role)
    currentUser?: Entities.User;
}

// Information about the current request that can be set/used in operations
// Setup for each request when request is received
export class RequestContext {
    request?: CurrentRequest;
    constructor() {}
    setRequest(request: CurrentRequest): void { this.request = request };
    getRequest(): CurrentRequest {
        if(this.request) return this.request;
        throw new Error("No request information currently available");
    };
}

export type Context = {
    app: AppContext,
    sock: SocketContext,
    req: RequestContext,
};