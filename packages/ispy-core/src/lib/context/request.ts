import { Entities } from "@cloudydaiyz/ispy-shared";
import { AbstractWebsocket, AccessWebsocketConnection } from "./ws-ctx";

export type CurrentRequest = {
    requestId: string;
    // True if the request was scheduled, false otherwise
    scheduled: boolean;
    // From user's access token, if any
    username?: string;
    // User information, if retrieved from the db (usually to confirm role). Used if access token is provided.
    currentUser?: Entities.User;
    // Information about the current connection if the current request was sent through a websocket
    accessWs?: AccessWebsocketConnection;
    // Raw websocket of the requester, if any
    ws?: AbstractWebsocket;
}