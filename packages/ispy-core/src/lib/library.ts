import { Entities, Requests } from "@cloudydaiyz/ispy-shared";
import { Context } from "./context";
import * as Operations from "./operations";

export interface Library {
    http: Requests.HttpOperations;
    sock: Requests.WebsocketClientOperations;
}

export function createLibrary(ctx: Context): Library {
    return {
        http: {
            ping: async () => {},
            metrics: () => Operations.metrics(ctx),
            createGame: (req: Requests.CreateGameRequest) => Operations.createGame(ctx, req),
            getGameState: () => Operations.getGameState(ctx),
            validateGame: (req: Entities.GameConfiguration) => Operations.validateGame(ctx, req),
            getGameHistory: () => Operations.getGameHistory(ctx),
            exportGamePdf: () => Operations.exportGamePdf(ctx),
            joinGame: (req: Entities.BasicAuth) => Operations.joinGame(ctx, req),
            authenticate: (req: Entities.AccessToken) => Operations.authenticate(ctx, req),
            refreshCredentials: (req: Entities.RefreshToken) => Operations.refreshCredentials(ctx, req),

            leaveGame: (req: Entities.Username) => Operations.leaveGame(ctx, req),
            submitTask: (req: Requests.SubmitTaskRequest) => Operations.submitTask(ctx, req),
            startGame: () => Operations.startGame(ctx),
            viewPlayerInfo: (req: Entities.Username) => Operations.viewPlayerInfo(ctx, req),
            viewTaskInfo: (req: Entities.TaskId) => Operations.viewTaskHostInfo(ctx, req),
            viewGameInfo: () => Operations.viewGameInfo(ctx),

            kickPlayer: (req: Entities.Username) => Operations.kickPlayer(ctx, req),
            kickAllPlayers: () => Operations.kickAllPlayers(ctx),
            lockGame: () => Operations.lockGame(ctx),
            unlockGame: () => Operations.unlockGame(ctx),
            viewTaskHostInfo: (req: Entities.TaskId) => Operations.viewTaskHostInfo(ctx, req),
            viewGameHostInfo: () => Operations.viewGameHostInfo(ctx),
            
            endGame: () => Operations.endGame(ctx),
            removeAdmin: (req: Entities.Username) => Operations.removeAdmin(ctx, req),
        },
        sock: {
            authenticate: function (request: Entities.AccessToken): boolean {
                throw new Error("Function not implemented.");
            },
            viewTaskInfo: function (request: Entities.TaskId): void {
                throw new Error("Function not implemented.");
            },
            viewGameInfo: function (request: Entities.GameId): void {
                throw new Error("Function not implemented.");
            },
            viewGameHostInfo: function (request: Entities.GameId): void {
                throw new Error("Function not implemented.");
            },
            cancelViewTaskInfo: function (request: Entities.TaskId): void {
                throw new Error("Function not implemented.");
            },
            cancelViewGameInfo: function (request: Entities.GameId): void {
                throw new Error("Function not implemented.");
            }
        }
    }
}