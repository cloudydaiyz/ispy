import { Entities, Requests } from "@cloudydaiyz/ispy-shared";
import { CurrentRequest, Operation } from "../../lib/context";
import { Library } from "../../lib/library";
import { ZodType } from "zod";
import { Request as ExpressRequest, Response as ExpressResponse } from "express";

import ObjectID from "bson-objectid";
import assert from "assert";
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from "../../env";
import { AuthJwtPayload, extractAccessToken, extractRefreshToken } from "../../util";

interface PerformProps<I> {
    request: ExpressRequest,
    response?: ExpressResponse,
    bodyParser?: ZodType<I>,
    roleRequirements?: Requests.RoleRequirement[],
    http?: keyof Requests.HttpOperations,
    ws?: keyof Requests.WebsocketClientOperations,
}

type AuthorizationParams = {
    basic?: Entities.BasicAuth;
    bearerAuth?: Entities.AccessToken;
    bearerRefresh?: Entities.RefreshToken;
    bearerPayload?: AuthJwtPayload;
};

function extractAuth(auth: string): AuthorizationParams {
    const params: AuthorizationParams = {};

    const basicAuthRegex = /^Basic\s+(.+)$/;
    const basicAuthMatch = auth.match(basicAuthRegex);
    if(basicAuthMatch) {
        const basicToken = atob(basicAuthMatch[1]);
        const basicTokenRegex = /^(.+):(.+)$/;
        const creds = basicToken.match(basicTokenRegex);

        assert(creds, "Invalid basic auth.");
        params.basic = { username: creds[1], password: creds[2] };
    }

    const bearerAuthRegex = /^Bearer\s+(.+)$/;
    const bearerAuthMatch = auth.match(bearerAuthRegex);
    if(bearerAuthMatch) {
        const bearerToken = bearerAuthMatch[1];
        let verifyAccessToken: AuthJwtPayload | null = null;
        let verifyRefreshToken: AuthJwtPayload | null = null;

        verifyAccessToken = extractAccessToken(bearerToken);
        if(verifyAccessToken) {
            params.bearerAuth = { accessToken: bearerToken };
            params.bearerPayload = verifyAccessToken;
        } else {
            verifyRefreshToken = extractRefreshToken(bearerToken);
        }

        if(verifyRefreshToken) {
            params.bearerRefresh = { refreshToken: bearerToken };
            params.bearerPayload = verifyRefreshToken;
        }

        assert(verifyAccessToken || verifyRefreshToken, "Invalid bearer auth.");
    }

    return params;
}

function validateRole(username: string, role: Entities.UserRole, requirements: Requests.RoleRequirement[], target?: string) {
    for(const requirement of requirements) {
        if(
            requirement == role 
            || (role == "player" && requirement == "player-self" && (!target || username == target))
            || (role == "admin" && requirement == "admin-self" && (!target || username == target))
        ) {
            return;
        }
    }
    throw new Error("Invalid permissions.");
}

export async function perform<I>(lib: Library, props: PerformProps<I>) {
    const {
        request,
        response,
        bodyParser,
        roleRequirements,
        http,
        ws,
    } = props;

    let body = request.body;
    let username = undefined;
    let currentUser = undefined;
    let socket = undefined;

    // Check for auth & populate the local context if necessary
    if(request.headers.authorization) {
        const authParams = extractAuth(request.headers.authorization);
        if(authParams.basic) {
            body = { ...body, ...authParams.basic };
        } else if(authParams.bearerAuth) {
            body = { ...body, ...authParams.bearerAuth };
        } else if(authParams.bearerRefresh) {
            body = { ...body, ...authParams.bearerRefresh };
        } else {
            throw new Error("Invalid auth.");
        }

        if(authParams.bearerAuth || authParams.bearerRefresh) {
            username = authParams.bearerPayload!.user;
            currentUser = await lib.local.getCurrentUser(username);
            if(ws) {
                socket = await lib.local.getCurrentWs(username);
            }
        }
    }

    // Validate permissions
    if(roleRequirements) {
        assert(username && currentUser, "Must provide credentials for this operation.");
        const target: string | undefined = request.body.username;
        assert(!target || typeof target == "string", "Invalid target username type. Must be a string.");
        validateRole(username, currentUser.role, roleRequirements, target);
    }

    const req: CurrentRequest = {
        requestId: (new ObjectID()).toHexString(),
        scheduled: false,
        username, 
        currentUser, 
        socket,
    };
    const validatedBody = bodyParser?.parse(request.body) as any;

    lib = lib.withLocalCtx({ req });
    if(http) {
        assert(response, "No response object found for http request.");
        lib.http[http](validatedBody);
    } else if(ws) {
        lib.sock[ws](validatedBody);
    } else {
        throw new Error("Unidentified request type.");
    }
}