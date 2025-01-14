import { Entities, Requests } from "@cloudydaiyz/ispy-shared";
import { Context, GlobalContext, LocalContext } from "./context";
import * as Operations from "./operations";
import { PromisifyAll } from "../util";

function httpOperations(ctx: Context): Requests.HttpOperations {
    return {
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
    };
}

function sockOperations(ctx: Context): PromisifyAll<Requests.WebsocketClientOperations> {
    return {
        authenticate: (req: Entities.AccessToken) => Operations.Socket.authenticate(ctx, req),
        startViewGameInfo: () => Operations.Socket.startViewGameInfo(ctx),
        stopViewGameInfo: () => Operations.Socket.stopViewGameInfo(ctx),
        startViewGameHostInfo: () => Operations.Socket.startViewGameHostInfo(ctx),
        stopViewGameHostInfo: () => Operations.Socket.stopViewGameHostInfo(ctx),
    }
}

export interface Library {
    boot: () => Promise<void>;
    shutdown: () => Promise<void>;
    http: Requests.HttpOperations;
    sock: PromisifyAll<Requests.WebsocketClientOperations>;
}

export class Library {
    private readonly ctx: Context;

    constructor(globalCtx: GlobalContext) {
        const ctx: Context = { ...globalCtx };

        this.boot = async () => {},
        this.shutdown = async () => {},
        this.http = httpOperations(ctx);
        this.sock = sockOperations(ctx);
        this.ctx = ctx;
    }

    addLocal(localCtx: LocalContext): Library {
        this.ctx.local = localCtx;
        return this;
    }
}

export function createLibrary(ctx: GlobalContext): Library {
    return new Library(ctx);
}