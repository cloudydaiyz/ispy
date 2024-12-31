import express from "express";
import expressWs from "express-ws";

// {
//     'Access-Control-Allow-Origin': '*',
//     'Access-Control-Allow-Headers': '*',
//     'Access-Control-Allow-Method': 'OPTION,GET,POST',
//     'Access-Control-Max-Age': 600,
//     'Access-Control-Allow-Credentials': true,
// }

export function binding() {
    const port = 3000;
    const wsapp = expressWs(express());
    addTestRoutes(wsapp.app);

    wsapp.app.get("/", (req, res) => {
        console.log(JSON.stringify(req.body, null, 4));
        res.status(200).send("You have pinged this app.");
    });

    wsapp.app.ws("/", function(ws, req) {
        ws.on('message', function(msg) {
            console.log(msg);
        });
        console.log('Web socket active.', req);
    });

    wsapp.app.listen(port, () => {
        console.log("This app is now listening on port " + port);
    });
}

function addTestRoutes(app: express.Application) {
    app.post("/test/bad-status", (req, res) => {
        res.status(101).send();
    });
}