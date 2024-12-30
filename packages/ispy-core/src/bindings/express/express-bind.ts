import express from "express";
import expressWs from "express-ws";

export function binding() {
    const port = 3000;
    const wsapp = expressWs(express());

    wsapp.app.get("/", (req, res) => {
        console.log(JSON.stringify(req.body, null, 4));
        res.status(200).send("ping pong");
    });

    wsapp.app.ws("/", function(ws, req) {
        ws.on('message', function(msg) {
            console.log(msg);
        });
        console.log('web socket testing', req);
    });

    wsapp.app.listen(port, () => {
        console.log("This app is listening now!");
    });
}