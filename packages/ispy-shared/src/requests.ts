// API request models

import { z } from "zod";
import * as Api from "./entities";

// == Request Models == //

export const CreateGameRequestModel = z.object({
    config: Api.GameConfigurationModel,
    hostUsername: z.string(),
    hostPassword: z.string(),
    admins: Api.AdminModel.array().refine(a => a.length <= 3),
});


export const SubmitTaskRequestModel = Api.TaskIdModel.extend({
    responses: z.string().array(),
});

export type CreateGameRequest = z.infer<typeof CreateGameRequestModel>;
export type SubmitTaskRequest = z.infer<typeof SubmitTaskRequestModel>;

// == Responses == //

// Error
// ZodError | InvalidInputError
// InvalidStateError
// InvalidPermissionsError
// ServerError

export type HttpErrorType = "etc" | "invalid-input" | "invalid-state" | "invalid-permissions" | "server";

export type HttpErrorResponse = {
    type: HttpErrorType,
    code: string,
    message: string,
    context?: any,
}

// == API Endpoint Types == //

export interface HttpRequests {
    ping: () => Promise<void>;
    metrics: () => Promise<Api.AppMetrics>;
    createGame: (request: CreateGameRequest) => Promise<Api.BearerAuth>;
    getGameState: () => Promise<Api.GameState>;
    validateGame: (request: Api.GameConfiguration) => Promise<boolean>;
    getGameHistory: () => Promise<Api.GameHistory>;
    exportGamePdf: () => Promise<Api.GameExport>;
    joinGame: (request: Api.BasicAuth) => Promise<Api.BearerAuth>;
    authenticate: (request: Api.AccessToken) => Promise<void>;
    refreshCredentials: (request: Api.RefreshToken) => Promise<Api.BearerAuth>;

    leaveGame: (request: Api.Username) => Promise<void>;
    submitTask: (request: SubmitTaskRequest) => Promise<Api.TaskSubmission>;
    startGame: () => Promise<void>;
    viewPlayerInfo: (request: Api.Username) => Promise<Api.EnhancedPlayer>;
    viewTaskInfo: (request: Api.TaskId) => Promise<Api.PublicTask>;
    viewGameInfo: () => Promise<Api.PublicGameStats>;

    kickPlayer: (request: Api.Username) => Promise<void>;
    kickAllPlayers: () => Promise<void>;
    lockGame: () => Promise<void>;
    unlockGame: () => Promise<void>;
    viewTaskHostInfo: (request: Api.TaskId) => Promise<Api.Task>;
    viewGameHostInfo: () => Promise<Api.Game>;

    endGame: () => Promise<void>;
    removeAdmin: (request: Api.Username) => Promise<void>;
}

// Requests that can be sent from the client to the server
export interface WebsocketServerRequests {
    authenticate: (request: Api.AccessToken) => boolean;

    // initiates the retrieval of task info
    viewTaskInfo: (request: Api.TaskId) => void;

    // initiates the retrieval of game info for player
    viewGameInfo: (request: Api.GameId) => void;

    // initiates the retrieval of game info for host
    viewGameHostInfo: (request: Api.GameId) => void;
}

// Requests that can be sent from the server to the client
export interface WebsocketClientRequests {
    authenticateAck: () => void;
    // sent when viewTaskInfo is initially sent
    viewTaskInfoAck: (request: Api.PublicTask) => void;
    // sent when task info changes
    // success and fail values can change if they're scaled
    taskInfo: (request: Api.PublicTask) => void;
    // sent when viewGameInfo is initially sent
    viewGameInfoAck: (request: Api.PublicGameStats) => void;
    // sent when public game stats changes
    // game state, start time, and end time can change
    gameInfo: (request: Api.PublicGameStats) => void;
    // sent when viewGameHostInfo is initially sent
    viewGameHostInfoAck: (request: Api.Game) => void;
    // sent when game changes
    // game state, start time, end time, task info, and num players can change
    gameHostInfo: (request: Api.Game) => void;
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
    getGameState: undefined,
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
    kickPlayer: ["host", "admin"],
    kickAllPlayers: ["host", "admin"],
    lockGame: ["host", "admin"],
    unlockGame: ["host", "admin"],
    viewTaskHostInfo: ["host", "admin"],
    viewGameHostInfo: ["host", "admin"],

    endGame: ["host"],
    // an admin can remove themself
    removeAdmin: ["host", "admin"],
}

// Paths
export const Paths: Record<keyof HttpRequests, string> = {
    ping: "/",
    metrics: "/metrics",
    createGame: "/game",
    getGameState: "/game/state",
    validateGame: "/game/validate",
    getGameHistory: "/game/history",
    exportGamePdf: "/game/export",
    joinGame: "/game/join-game",
    authenticate: "/game/login",
    refreshCredentials: "/game/refresh",

    leaveGame: "/game/leave-game",
    submitTask: "/game/submit-task",
    viewPlayerInfo: "/game/player",
    viewTaskInfo: "/game/task",
    viewGameInfo: "/game",

    startGame: "/game/host/start-game",
    kickPlayer: "/game/host/kick-player",
    kickAllPlayers: "/game/host/kick-all",
    lockGame: "/game/host/lock",
    unlockGame: "/game/host/unlock",
    viewTaskHostInfo: "/game/host/task",
    viewGameHostInfo: "/game/host",

    endGame: "/game/host/end-game",
    removeAdmin: "/game/host/remove-admin",
}