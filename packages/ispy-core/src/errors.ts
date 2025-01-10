interface Error {
    timestamp: number;
    // error code (e.g. DB201)
    code: string;
    // who caused the error
    culprit: "server" | "client",
    // specific type of this error, if any (e.g. IllegalState)
    type?: string;
    // client-facing message
    clientMessage: string;
    // server message, if any
    serverMessage?: string;
}