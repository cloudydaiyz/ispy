import { Context } from "../context";
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from "../../env";

import { Entities } from "@cloudydaiyz/ispy-shared";
import jwt from "jsonwebtoken";

type AuthJwtPayload = { user: string, role: Entities.UserRole };

export async function authenticate(ctx: Context, request: Entities.AccessToken): Promise<void> {
    try {
        jwt.verify(request.accessToken, ACCESS_TOKEN_SECRET!);
    } catch {
        throw new Error("Authentication error");
    }
}

export async function refreshCredentials(ctx: Context, request: Entities.RefreshToken): Promise<Entities.BearerAuth> {
    try {
        const payload = jwt.verify(request.refreshToken, REFRESH_TOKEN_SECRET!) as AuthJwtPayload;
        const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET!, { expiresIn: '1h' });
        const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET!, { expiresIn: '2h' });
        return { accessToken, refreshToken };
    } catch {
        throw new Error("Authentication error");
    }
}

export async function joinGame(ctx: Context, request: Entities.BasicAuth): Promise<Entities.BearerAuth> {
    await ctx.db.writeUser(request.username, {
        id: `${Date.now()}`,
        username: request.username,
        password: request.password,
        role: "player",
    });

    const ranking = await ctx.db.newPlayer(request.username);

    await ctx.db.writePlayer(request.username, {
        username: request.username,
        points: 0,
        ranking,
        completed: false,
        tasksSubmitted: [],
    });

    const accessToken = jwt.sign({ user: request.username, role: "player" }, ACCESS_TOKEN_SECRET!, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ user: request.username, role: "player" }, REFRESH_TOKEN_SECRET!, { expiresIn: '2h' });
    return { accessToken, refreshToken };
}