import { Entities } from "@cloudydaiyz/ispy-shared";
import { Context, WebsocketConnection } from "../context";
import * as Auth from "./auth";
import * as Game from "./game";

// == RECEIVING OPERATIONS == //

export async function authenticate(ctx: Context, request: Entities.AccessToken): Promise<void> {
    const { ws } = ctx.local!.req;
    const { user, role } = Auth.extractAccessToken(request);
    const username = user;

    const conn: WebsocketConnection = {
        ws: ws!,
        username,
        role,
        isViewingGameInfo: false,
        isViewingGameHostInfo: false,
    };
    ctx.sock.connect(conn);
    ctx.sock.to([username]).authenticateAck();
    ctx.local!.req.username = username;
}

export async function startViewGameInfo(ctx: Context): Promise<void> {
    if(!ctx.local) {
        throw new Error("Unable to perform operation. Connection unauthenticated.");
    }
    const { username, accessWs } = ctx.local.req;

    accessWs!.setViewGameInfo(true);
    const gameInfo = await Game.viewGameInfo(ctx);
    ctx.sock.to([username!]).viewGameInfoAck(gameInfo);
}

export async function stopViewGameInfo(ctx: Context): Promise<void> {
    if(!ctx.local) {
        throw new Error("Unable to perform operation. Connection unauthenticated.");
    }
    const { accessWs } = ctx.local.req;
    accessWs!.setViewGameInfo(false);
}

export async function startViewGameHostInfo(ctx: Context): Promise<void> {
    if(!ctx.local) {
        throw new Error("Unable to perform operation. Connection unauthenticated.");
    }
    const { username, accessWs } = ctx.local.req;

    accessWs!.setViewGameInfo(true);
    const gameInfo = await Game.viewGameHostInfo(ctx);
    ctx.sock.to([username!]).viewGameHostInfoAck(gameInfo);
}

export async function stopViewGameHostInfo(ctx: Context): Promise<void> {
    if(!ctx.local) {
        throw new Error("Unable to perform operation. Connection unauthenticated.");
    }
    const { accessWs } = ctx.local.req;
    accessWs!.setViewGameHostInfo(false);
}