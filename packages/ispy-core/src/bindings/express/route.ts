import { Entities, Requests } from "@cloudydaiyz/ispy-shared";
import { AccessWebsocketConnection, CurrentRequest } from "../../lib/context";
import { Library } from "../../lib/library";
import { ZodError, ZodType } from "zod";
import express from "express";

import ObjectID from "bson-objectid";
import expressWs from "express-ws";

import { AuthJwtPayload, extractAccessToken, extractRefreshToken } from "../../util";
import { AppError, IllegalStateError, InvalidAuthError, InvalidInputError, InvalidPermissionsError } from "../../lib/errors";

const DEFAULT_HTTP_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Method': 'OPTION,GET,POST',
    'Access-Control-Max-Age': '600',
    'Access-Control-Allow-Credentials': 'true',
};

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

        InvalidAuthError.assert(creds, "Invalid basic auth.");
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

        InvalidAuthError.assert(verifyAccessToken || verifyRefreshToken, "Invalid bearer auth.");
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
    route: keyof Requests.HttpOperations | RouteParams,
    body?: ZodType<I>,
    onSuccess?: (response: express.Response, result: any) => void,
}

// Params associated with a specific route
// Explicitly defined if a route name isn't available in the shared library, but must be declared
interface RouteParams {
    path: string,
    method: Requests.HttpMethod,
    roles: Requests.RoleRequirement[] | undefined,
    op: (input: any) => any,
}

// path, method, roles, operation

export function httpRoute<I>(props: HttpRouteProps<I>) {
    const {
        lib,
        app,
        body,
        route,
        onSuccess
    } = props;

    const path = typeof route == 'string' ? Requests.Paths[route] : route.path;
    const method = typeof route == 'string' ? Requests.REQUEST_METHODS[route] : route.method;
    const roles = typeof route == 'string' ? Requests.REQUEST_ROLE_REQUIREMENTS[route] : route.roles;

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
            }
        }

        // Validate permissions
        if(roles) {
            InvalidAuthError.assert(username && currentUser, "Must provide credentials for this operation.");

            const target: string | undefined = request.body.username;
            InvalidInputError.assert(!target || typeof target == "string", "Invalid target username type. Must be a string.");
            validateRole(username, currentUser.role, roles, target);
        }

        const req: CurrentRequest = {
            requestId: (new ObjectID()).toHexString(),
            scheduled: false,
            username, 
            currentUser, 
            accessWs: socket,
        };
        const validatedBody = body ? body.parse(request.body) : body;

        const fullLib = lib.withLocalCtx({ req });
        const result = typeof route == 'string' 
            ? await fullLib.http[route](validatedBody as any) 
            : await route.op(validatedBody);

        for(const header in DEFAULT_HTTP_HEADERS) {
            const val = DEFAULT_HTTP_HEADERS[header as keyof typeof DEFAULT_HTTP_HEADERS];
            response.header(header, val);
        }

        if(onSuccess) {
            onSuccess(response, result);
            return;
        }

        if(result) {
            response.status(200).json(result);
        } else {
            response.status(204).send();
        }
    }

    async function handleRequest(request: express.Request, response: express.Response) {
        try {
            await processRequest(request, response);
        } catch(e) {

            // Cast errors to AppError for generalized handling
            if(e instanceof ZodError) {
                e = new InvalidInputError("Invalid request body");
            }
            if(!(e instanceof AppError)) {
                e = new AppError("A server error has occurred");
            }

            const err = e as AppError;
            console.error('HTTP Request Error: ' + err);
            response.status(err.statusCode).json(err.toJSON());
        }
    }

    app[method](path, handleRequest);
}

export function wsRoutes(lib: Library, app: expressWs.Application) {
    const LIB_WS_OPS_IGNORE = ["connect", "disconnect", "authenticate"];
    const LIB_WS_OPS = Object.keys(lib.sock).filter(o => !LIB_WS_OPS_IGNORE.includes(o));

    app.ws("/", (ws, req) => {
        let username: string | null = null; 
        let currentUser: Entities.User | null = null;
        let accessWs: AccessWebsocketConnection | null = null;

        ws.on('message', async (msg) => {
            console.log(msg);

            const wsreq = Requests.WebsocketRequestModel.parse(msg);
            const method = wsreq.method as keyof Requests.WebsocketClientOperations;
            if(method == "authenticate") {
                const body = Entities.AccessTokenModel.parse(wsreq.payload);
                const req: CurrentRequest = {
                    requestId: (new ObjectID()).toHexString(),
                    scheduled: false,
                    ws,
                };
                lib.withLocalCtx({ req }).sock.authenticate(body);

                username = req.username!;
                currentUser = await lib.local.getCurrentUser(username);
                accessWs = await lib.local.getCurrentWs(username);
            }

            if(LIB_WS_OPS.includes(method)) {
                IllegalStateError.assert(username && currentUser && accessWs, "Unable to perform operation. Connection unauthenticated.");
                const req: CurrentRequest = {
                    requestId: (new ObjectID()).toHexString(),
                    scheduled: false,
                    username,
                    currentUser,
                    accessWs,
                    ws,
                };
                await lib.withLocalCtx({ req }).sock[method](undefined as any);
            }
        });

        ws.on('close', () => { if(username) lib.sock.disconnect([ username ]) });

        ws.on('open', () => {
            setTimeout(() => { if(!username) ws.close() }, 10000);
            console.log('Web socket active. User must authenticate within 10 seconds.', req);
        });
    });
}