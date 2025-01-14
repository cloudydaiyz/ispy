import { Entities } from "@cloudydaiyz/ispy-shared";
import { Context } from "../context";
import * as Auth from "./auth";
import * as Game from "./game";

// == RECEIVING OPERATIONS == //

export async function authenticate(ctx: Context, request: Entities.AccessToken): Promise<void> {
    const { username, socket } = ctx.local!.req;
    const success = await Auth.authenticate(ctx, request);
    if(!success) return;

    socket!.setAuthenticated(true);
    ctx.sock.to([username!]).authenticateAck();
}

export async function startViewGameInfo(ctx: Context): Promise<void> {
    const { username, socket } = ctx.local!.req;
    if(!socket!.isAuthenticated()) return;

    socket!.setViewGameInfo(true);
    const gameInfo = await Game.viewGameInfo(ctx);
    ctx.sock.to([username!]).viewGameInfoAck(gameInfo);
}

export async function stopViewGameInfo(ctx: Context): Promise<void> {
    const { socket } = ctx.local!.req;
    if(!socket!.isAuthenticated()) return;
    socket!.setViewGameInfo(false);
}

export async function startViewGameHostInfo(ctx: Context): Promise<void> {
    const { username, socket } = ctx.local!.req;
    if(!socket!.isAuthenticated()) return;

    socket!.setViewGameInfo(true);
    const gameInfo = await Game.viewGameHostInfo(ctx);
    ctx.sock.to([username!]).viewGameHostInfoAck(gameInfo);
}

export async function stopViewGameHostInfo(ctx: Context): Promise<void> {
    const { socket } = ctx.local!.req;
    if(!socket!.isAuthenticated()) return;
    socket!.setViewGameHostInfo(false);
}