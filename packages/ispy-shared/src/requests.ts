// API request models

import { z } from "zod";
import * as Api from "./models";
import { AppMetrics, GameExportPdf } from "./types";

// == Request Models == //

export const CreateGameRequestModel = z.object({
    config: Api.GameConfigurationModel,
    hostUsername: z.string(),
    hostPassword: z.string(),
    admins: Api.AdminModel.array().refine(a => a.length <= 3),
});

export type CreateGameRequest = z.infer<typeof CreateGameRequestModel>;

// == Responses == //

export type HttpResponse = {

}

export type HttpErrorResponse = {
    code: string,
    message: string,
    context?: any,
}

// == API Endpoint Types == //

export interface HttpRequests {
    ping: () => Promise<void>;
    metrics: () => Promise<AppMetrics>;
    createGame: (request: CreateGameRequest) => Promise<Api.BearerAuth>;
    validateGame: (request: Api.GameConfiguration) => Promise<boolean>;
    getGameHistory: () => Promise<Api.GameHistory>;
    exportGamePdf: () => Promise<GameExportPdf>;
    joinGame: (request: Api.BasicAuth) => Promise<Api.BearerAuth>;
    authenticate: (request: Api.AccessToken) => Promise<boolean>;
    refreshCredentials: (refreshToken: Api.RefreshToken) => Promise<Api.BearerAuth>;

    leaveGame: (request: Api.Username) => Promise<void>;
    submitTask: (request: Api.TaskId) => Promise<void>;
    startGame: () => Promise<void>;
    endGame: () => Promise<void>;
    viewPlayerInfo: (request: Api.Username) => Promise<Api.EnhancedPlayer>;
    viewTaskInfo: (request: Api.TaskId) => Promise<Api.PublicTask>;
    viewGameInfo: () => Promise<Api.PublicGameStats>;

    kickPlayer: (request: Api.Username) => Promise<void>;
    kickAllPlayers: () => Promise<void>;
    lockGame: () => Promise<void>;
    unlockGame: () => Promise<void>;
    viewTaskHostInfo: (request: Api.TaskId) => Promise<Api.Task>;
    viewGameHostInfo: () => Promise<Api.Game>;

    removeAdmin: (request: Api.Username) => Promise<void>;
}

// Requests that can be sent from the client to the server
export interface WebsocketClientRequests {
    authenticate: (request: Api.AccessToken) => boolean;

    // initiates the retrieval of task info
    viewTaskInfo: (taskId: Api.TaskId) => void;

    // initiates the retrieval of game info for player
    viewGameInfo: (gameId: Api.GameId) => void;

    // initiates the retrieval of game info for host
    viewGameHostInfo: (gameId: Api.GameId) => void;
}

// Requests that can be sent from the server to the client
export interface WebsocketServerRequests {
    authenticateAck: () => void;
    viewTaskInfoAck: () => void;
    taskInfo: (info: Api.PublicTask) => void;
    viewGameInfoAck: () => void;
    gameInfo: (game: Api.PublicGameStats) => void;
    viewGameHostInfoAck: () => void;
    gameHostInfo: (game: Api.Game) => void;
    gameEnded: (results: Api.GameResults) => void;
}

// Structure for all websocket messages
export const WebsocketRequestModel = z.object({
    // The method to pass the payload to
    method: z.string(),

    // Input for the request method
    payload: z.record(z.string(), z.any()).optional(),
});
export type WebSocketRequest = z.infer<typeof WebsocketRequestModel>;

// Access role requirements for requests
export const REQUEST_ROLE_REQUIREMENTS: Record<keyof HttpRequests, Api.UserRole[] | undefined> = {
    ping: undefined,
    metrics: undefined,
    createGame: undefined,
    validateGame: undefined,
    getGameHistory: undefined,
    exportGamePdf: undefined,
    joinGame: undefined,
    authenticate: undefined,
    refreshCredentials: undefined,

    leaveGame: ["player"],
    submitTask: ["player"],
    viewPlayerInfo: ["player", "host", "admin"],
    viewTaskInfo: ["player"],
    viewGameInfo: ["player"],

    startGame: ["host", "admin"],
    endGame: ["host", "admin"],
    kickPlayer: ["host", "admin"],
    kickAllPlayers: ["host", "admin"],
    lockGame: ["host", "admin"],
    unlockGame: ["host", "admin"],
    viewTaskHostInfo: ["host", "admin"],
    viewGameHostInfo: ["host", "admin"],

    // an admin can remove themself
    removeAdmin: ["host", "admin"],
}