import { Entities, Requests } from "@cloudydaiyz/ispy-shared";
import { Context, WebsocketTarget } from "../context";
import * as Auth from "./auth";
import * as Game from "./game";

// == RECEIVING OPERATIONS == //

export async function authenticate(ctx: Context, request: Entities.AccessToken): Promise<void> {
    const { username, socket } = ctx.req.getRequest();
    const success = await Auth.authenticate(ctx, request);
    if(!success) return;

    socket!.setAuthenticated(true);
    ctx.sock.to([username!]).authenticateAck();
}

export async function startViewTaskInfo(ctx: Context, request: Entities.TaskId): Promise<void> {
    const { username, socket } = ctx.req.getRequest();
    if(!socket!.isAuthenticated()) return;

    socket!.setTaskInfoView(request.taskId);
    const taskInfo = await Game.viewTaskInfo(ctx, request);
    ctx.sock.to([username!]).viewTaskInfoAck(taskInfo);
}

export async function stopViewTaskInfo(ctx: Context): Promise<void> {
    const { socket } = ctx.req.getRequest();
    if(!socket!.isAuthenticated()) return;
    socket!.setTaskInfoView();
}

export async function startViewGameInfo(ctx: Context): Promise<void> {
    const { username, socket } = ctx.req.getRequest();
    if(!socket!.isAuthenticated()) return;

    socket!.setViewGameInfo(true);
    const gameInfo = await Game.viewGameInfo(ctx);
    ctx.sock.to([username!]).viewGameInfoAck(gameInfo);
}

export async function stopViewGameInfo(ctx: Context): Promise<void> {
    const { socket } = ctx.req.getRequest();
    if(!socket!.isAuthenticated()) return;
    socket!.setViewGameInfo(false);
}

export async function startViewGameHostInfo(ctx: Context): Promise<void> {
    const { username, socket } = ctx.req.getRequest();
    if(!socket!.isAuthenticated()) return;

    socket!.setViewGameInfo(true);
    const gameInfo = await Game.viewGameHostInfo(ctx);
    ctx.sock.to([username!]).viewGameHostInfoAck(gameInfo);
}

export async function stopViewGameHostInfo(ctx: Context): Promise<void> {
    const { socket } = ctx.req.getRequest();
    if(!socket!.isAuthenticated()) return;
    socket!.setViewGameHostInfo(false);
}