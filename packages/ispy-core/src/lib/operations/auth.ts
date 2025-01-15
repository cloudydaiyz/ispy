import { Context } from "../context";
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, SCHEDULED_FUNCTION_NAME } from "../../env";
import { AUTH_SALT_ROUNDS } from "../../constants";
import { AuthJwtPayload } from "../../util";

import { Entities, Requests } from "@cloudydaiyz/ispy-shared";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import ObjectID from "bson-objectid";
import assert from "assert";

export async function authenticate(ctx: Context, request: Entities.AccessToken): Promise<boolean> {
    try {
        jwt.verify(request.accessToken, ACCESS_TOKEN_SECRET);
        return true;
    } catch {
        return false;
    }
}

export async function refreshCredentials(ctx: Context, request: Entities.RefreshToken): Promise<Entities.BearerAuth> {
    try {
        const payload = jwt.verify(request.refreshToken, REFRESH_TOKEN_SECRET) as AuthJwtPayload;
        const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '2h' });
        return { accessToken, refreshToken };
    } catch {
        throw new Error("Authentication error");
    }
}

export async function joinGame(ctx: Context, request: Entities.BasicAuth): Promise<Entities.BearerAuth> {
    const { gameStatsStore, userStore, leaderboardStore, adminStore, playerStore } = ctx.app.db;
    const stats = await gameStatsStore.readGameStats();
    assert(!stats.locked, "This game is currently locked. You are unable to join.");

    const username = request.username;
    const password = await bcrypt.hash(request.password, AUTH_SALT_ROUNDS);
    let role: Entities.UserRole = 'player';

    const user = userStore.readOptionalUser(username);
    assert(!user, "User already exists.");

    const userId = (new ObjectID()).toHexString();
    await userStore.writeUser(request.username, {
        id: userId,
        username,
        password,
        role,
    });

    const admin = await adminStore.readOptionalAdmin(username);
    if(admin) {
        role = 'admin';
        assert(!admin.userId, "Admin already exists.");

        const adminPass = await bcrypt.hash(admin.password, AUTH_SALT_ROUNDS);
        assert(password == adminPass, "Invalid credentials.");

        await adminStore.writeAdmin(username, { userId });
    } else {
        assert(stats.players.length < stats.configuration.maxPlayers, "Max players reached for this game.");
        await playerStore.createPlayer(username, {
            username,
            completed: false,
            points: 0,
            ranking: 0,
            tasksSubmitted: []
        });
        await leaderboardStore.newPlayer(request.username);
    }

    const accessToken = jwt.sign({ user: request.username, role: "player" }, ACCESS_TOKEN_SECRET!, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ user: request.username, role: "player" }, REFRESH_TOKEN_SECRET!, { expiresIn: '2h' });
    return { accessToken, refreshToken };
}

export async function createGame(ctx: Context, request: Requests.CreateGameRequest): Promise<Entities.BearerAuth> {
    const { userStore, adminStore } = ctx.app.db;
    await userStore.writeUser(request.hostUsername, {
        id: (new ObjectID()).toHexString(),
        username: request.hostUsername,
        password: await bcrypt.hash(request.hostPassword, AUTH_SALT_ROUNDS),
        role: "host",
    });
    await adminStore.createAdmins(request.admins);

    for(const task of request.config.tasks) {
        task.id = (new ObjectID()).toHexString();
        for(const response of task.responses) {
            response.id = (new ObjectID()).toHexString();
        }
    }

    const gameStats: Entities.GameStats = {
        id: (new ObjectID()).toHexString(),
        host: request.hostUsername,
        configuration: request.config,
        state: request.config.minPlayers == 0 ? "ready" : "not-ready",
        locked: false,
        players: [],
        admins: [],
        numRequiredTasks: request.config.tasks.reduce((v, t) => t.required ? v + 1 : v, 0),
        startTime: request.config.startTime,
        endTime: request.config.endTime,
        playersCompleted: 0,
        completed: false,
    }
    await ctx.app.db.gameStatsStore.createGameStats(gameStats);
    await ctx.app.scheduler.schedule("start-game", new Date(request.config.startTime));
    await ctx.app.scheduler.schedule("end-game", new Date(request.config.endTime));

    const accessToken = jwt.sign({ user: request.hostUsername, role: "host" }, ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ user: request.hostUsername, role: "host" }, REFRESH_TOKEN_SECRET, { expiresIn: '2h' });
    return { accessToken, refreshToken };
}