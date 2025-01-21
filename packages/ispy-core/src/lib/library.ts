import { Entities, Requests } from "@cloudydaiyz/ispy-shared";
import { AccessWebsocketConnection, Context, GlobalContext, LocalContext, WebsocketInitOperations } from "./context";
import * as Operations from "./operations";
import { Readable } from "stream";
import { PromisifyAll } from "../util";

type LibraryHttpOperations = Requests.HttpOperations & {
    exportGamePdfFile: () => Promise<Readable>
}

function httpOperations(ctx: Context): LibraryHttpOperations {
    return {
        ping: async () => {},
        metrics: () => Operations.metrics(ctx),
        createGame: (req: Requests.CreateGameRequest) => Operations.createGame(ctx, req),
        getGameState: () => Operations.getGameState(ctx),
        validateGame: (req: Entities.GameConfiguration) => Operations.validateGame(ctx, req),
        getGameHistory: () => Operations.getGameHistory(ctx),
        exportGamePdf: () => Operations.exportGamePdf(ctx),
        exportGamePdfFile: () => Operations.exportGamePdfFile(ctx),
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

type LibraryWebsocketOperations = PromisifyAll<Requests.WebsocketClientOperations> & WebsocketInitOperations;

function sockOperations(ctx: Context): LibraryWebsocketOperations {
    return {
        connect: ctx.sock.connect,
        disconnect: ctx.sock.disconnect,
        authenticate: (req: Entities.AccessToken) => Operations.Socket.authenticate(ctx, req),
        startViewGameInfo: () => Operations.Socket.startViewGameInfo(ctx),
        stopViewGameInfo: () => Operations.Socket.stopViewGameInfo(ctx),
        startViewGameHostInfo: () => Operations.Socket.startViewGameHostInfo(ctx),
        stopViewGameHostInfo: () => Operations.Socket.stopViewGameHostInfo(ctx),
    }
}

function localOperations(ctx: Context): LocalRequests {
    return {
        getCurrentUser: (username: string) => ctx.app.db.userStore.readUser(username),
        getCurrentWs: async (username: string) => ctx.sock.get(username),
    }
}

interface LocalRequests {
    getCurrentUser: (username: string) => Promise<Entities.User>;
    getCurrentWs: (username: string) => Promise<AccessWebsocketConnection>;
}

export interface Library {
    boot: () => Promise<void>;
    shutdown: () => Promise<void>;
    http: LibraryHttpOperations;
    sock: LibraryWebsocketOperations;
    local: LocalRequests;
}

export class Library {
    private readonly ctx: Context;

    constructor(globalCtx: GlobalContext, localCtx?: LocalContext) {
        const ctx: Context = { ...globalCtx, local: localCtx };

        this.boot = async () => {},
        this.shutdown = async () => {},
        this.http = httpOperations(ctx);
        this.sock = sockOperations(ctx);
        this.local = localOperations(ctx);
        this.ctx = ctx;
    }

    withLocalCtx(localCtx: LocalContext): Library {
        return new Library(this.ctx, localCtx);
    }
}

export function createLibrary(ctx: GlobalContext): Library {
    return new Library(ctx);
}