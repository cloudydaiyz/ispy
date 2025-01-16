import { Entities, Requests } from "@cloudydaiyz/ispy-shared";
import { CurrentRequest, Operation } from "../../lib/context";
import { Library } from "../../lib/library";
import { ZodError, ZodType } from "zod";
import express from "express";

import ObjectID from "bson-objectid";
import assert from "assert";
import { AuthJwtPayload, extractAccessToken, extractRefreshToken } from "../../util";
import { ExpiredPermissionsError, IllegalStateError, InvalidAuthError, InvalidInputError, InvalidPermissionsError } from "../../lib/errors/err";

// {
//     'Access-Control-Allow-Origin': '*',
//     'Access-Control-Allow-Headers': '*',
//     'Access-Control-Allow-Method': 'OPTION,GET,POST',
//     'Access-Control-Max-Age': 600,
//     'Access-Control-Allow-Credentials': true,
// }

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

        assert(creds, new InvalidAuthError("Invalid basic auth."));
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
    throw new InvalidPermissionsError("Invalid permissions.");
}

interface HttpRouteProps<I> {
    lib: Library,
    app: express.Application,
    route: keyof Requests.HttpOperations,
    body?: ZodType<I>,
}

export function httpRoute<I>(props: HttpRouteProps<I>) {
    const {
        lib,
        app,
        body,
        route,
    } = props;

    const path = Requests.Paths[route];
    const method = Requests.REQUEST_METHODS[route];
    const roles = Requests.REQUEST_ROLE_REQUIREMENTS[route];

    async function processRequest(request: express.Request, response: express.Response) {
        let reqbody = request.body;
        let username = undefined;
        let currentUser = undefined;
        let socket = undefined;

        // Check for auth & populate the local context if necessary
        if(request.headers.authorization) {
            const authParams = extractAuth(request.headers.authorization);
            if(authParams.basic) {
                reqbody = { ...reqbody, ...authParams.basic };
            } else if(authParams.bearerAuth) {
                reqbody = { ...reqbody, ...authParams.bearerAuth };
            } else if(authParams.bearerRefresh) {
                reqbody = { ...reqbody, ...authParams.bearerRefresh };
            } else {
                throw new Error("Invalid auth.");
            }

            if(authParams.bearerAuth || authParams.bearerRefresh) {
                username = authParams.bearerPayload!.user;
                currentUser = await lib.local.getCurrentUser(username);
                // if(ws) {
                //     socket = await lib.local.getCurrentWs(username);
                // }
            }
        }

        // Validate permissions
        if(roles) {
            assert(username && currentUser, "Must provide credentials for this operation.");

            const target: string | undefined = request.body.username;
            assert(!target || typeof target == "string", "Invalid target username type. Must be a string.");
            validateRole(username, currentUser.role, roles, target);
        }

        const req: CurrentRequest = {
            requestId: (new ObjectID()).toHexString(),
            scheduled: false,
            username, 
            currentUser, 
            socket,
        };
        const validatedBody = body?.parse(request.body) as any;

        const llib = lib.withLocalCtx({ req });
        const result = await llib.http[route](validatedBody);
        if(result) {
            response.status(200).json(result);
        } else {
            response.status(204).json(result);
        }
    }

    async function handleRequest(request: express.Request, response: express.Response) {
        try {
            await processRequest(request, response);
        } catch(e) {
            if(e instanceof ZodError) {
                response.send(400).json({ message: e.message });
            } else if(e instanceof InvalidInputError) {
                response.send(400).json({ message: e.message });
            } else if(e instanceof IllegalStateError) {
                response.send(400).json({ message: e.message });
            } else if(e instanceof InvalidAuthError) {
                response.send(401).json({ message: "Invalid auth" });
            } else if(e instanceof ExpiredPermissionsError) {
                response.send(401).json({ message: "Expired permissions" });
            } else if(e instanceof InvalidPermissionsError) {
                response.send(403).json({ message: "Invalid permissions" });
            } else {
                response.send(500).json({ message: "A server error has occurred" });
            }
        }
    }

    app[method](path, handleRequest);
}