import express from "express";
import expressWs from "express-ws";
import { httpRoute, wsRoutes } from "./route";
import { Library } from "../../lib/library";
import { Entities, Requests } from "@cloudydaiyz/ispy-shared";
import { z } from "zod";

// For experimentation
function addTestHttpRoutes(app: express.Application) {
    app.get("/test/ping", (req, res) => {
        console.log(JSON.stringify(req.body, null, 4));
        res.status(200).send("You have pinged this app.");
    });

    app.post("/test/bad-status", (req, res) => {
        res.status(101).send();
    });
}

export function binding(lib: Library) {
    const port = 3000;
    const wsapp = expressWs(express());
    const app = wsapp.app;

    // addTestRoutes(wsapp.app);

    httpRoute({ lib, app, route: "ping" });
    httpRoute({ lib, app, route: "metrics" });
    httpRoute({ lib, app, route: "createGame", body: Requests.CreateGameRequestModel });
    httpRoute({ lib, app, route: "getGameState" });
    httpRoute({ lib, app, route: "validateGame", body: z.any() });
    httpRoute({ lib, app, route: "getGameHistory" });
    httpRoute({ lib, app, route: "exportGamePdf" });
    httpRoute({ lib, app, route: "joinGame", body: Entities.BasicAuthModel });
    httpRoute({ lib, app, route: "authenticate", body: Entities.AccessTokenModel });
    httpRoute({ lib, app, route: "refreshCredentials", body: Entities.RefreshTokenModel });

    httpRoute({ lib, app, route: "leaveGame", body: Entities.UsernameModel });
    httpRoute({ lib, app, route: "submitTask", body: Requests.SubmitTaskRequestModel });
    httpRoute({ lib, app, route: "startGame" });
    httpRoute({ lib, app, route: "viewPlayerInfo", body: Entities.UsernameModel });
    httpRoute({ lib, app, route: "viewTaskInfo", body: Entities.TaskIdModel });
    httpRoute({ lib, app, route: "viewGameInfo" });

    httpRoute({ lib, app, route: "kickPlayer", body: Entities.UsernameModel });
    httpRoute({ lib, app, route: "kickAllPlayers" });
    httpRoute({ lib, app, route: "lockGame" });
    httpRoute({ lib, app, route: "unlockGame" });
    httpRoute({ lib, app, route: "viewTaskHostInfo", body: Entities.TaskIdModel });
    httpRoute({ lib, app, route: "viewGameHostInfo" });

    httpRoute({ lib, app, route: "endGame" });
    httpRoute({ lib, app, route: "removeAdmin", body: Entities.UsernameModel });

    wsRoutes(lib, app);

    app.listen(port, () => {
        console.log("This app is now listening on port " + port);
    });
}