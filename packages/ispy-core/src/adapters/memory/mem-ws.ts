import { Entities, Requests } from "@cloudydaiyz/ispy-shared";
import { ReadWebsocketConnection, WebsocketConnection, ModifyWebsocketConnection, WebsocketOperationsContext, WebsocketTarget, AccessWebsocketConnection } from "../../lib/context";
import { AppError, InvalidInputError } from "../../lib/errors";

let connections: WebsocketConnection[] = [];

function getTargets(connections: WebsocketConnection[], target: WebsocketTarget) {
    const matched: WebsocketConnection[] = [];
    if(target instanceof Array) {
        for(const c of connections) {
            if(target.includes(c.username)) {
                matched.push(c);
            }
        }
    } else if(target == 'all') {
        matched.push(...connections);
    } else {
        for(const c of connections) {
            if(c.role == target) {
                matched.push(c);
            }
        }
    }
    return matched;
}

function sendToTargets(payload: Requests.WebsocketRequest, connections: WebsocketConnection[], target: WebsocketTarget) {
    const matched = getTargets(connections, target);
    matched.forEach(c => c.ws.send(JSON.stringify(payload)));
}

// Immutable implementation for in-memory websocket operations
class WebsocketOperator implements WebsocketOperationsContext {
    private readonly target?: WebsocketTarget;

    constructor(target?: WebsocketTarget) {
        this.target = target;
    }

    get(username: string): AccessWebsocketConnection {
        const [ read ] = this.read(username);
        const modify = this.modify(username);
        return { ...read, ...modify };
    };

    to(target: WebsocketTarget): WebsocketOperationsContext {
        return new WebsocketOperator(target);
    };

    connect(target: WebsocketConnection): void {
        InvalidInputError.assert(!connections.find(c => c.username == target.username), "User already connected.");
        connections.push(target);
    };

    disconnect(target: WebsocketTarget): void {
        const matched = getTargets(connections, target);
        matched.forEach(c => c.ws.close());
    };

    read(username?: string): ReadWebsocketConnection[] {
        const target = username ? [username] : this.target;
        AppError.assert(target, undefined, { detailedMessage: "No target currently set." });
        const matched = getTargets(connections, target);
        return matched.map(m => ({
            getUsername: () => m.username,
            getRole: () => m.role,
            getTaskInfoView: () => m.taskInfoView,
            isViewingGameInfo: () => m.isViewingGameInfo,
            isViewingGameHostInfo: () => m.isViewingGameHostInfo,
        }));
    };

    modify(username?: string): ModifyWebsocketConnection {
        const target = username ? [username] : this.target;
        AppError.assert(target, undefined, { detailedMessage: "No target currently set." });
        const matched = getTargets(connections, target);
        return {
            setTaskInfoView: async (taskId?: string) => { matched.forEach(m => { m.taskInfoView = taskId } ) },
            setViewGameInfo: async (flag: boolean) => { matched.forEach(m => { m.isViewingGameInfo = flag } ) },
            setViewGameHostInfo: async (flag: boolean) => { matched.forEach(m => { m.isViewingGameHostInfo = flag } ) },
        }
    };

    authenticateAck(): void {
        AppError.assert(this.target, undefined, { detailedMessage: "No target currently set." });
        sendToTargets({
            method: "authenticateAck",
        }, connections, this.target);
    };

    viewGameInfoAck(request: Entities.PublicGameStats): void {
        AppError.assert(this.target, undefined, { detailedMessage: "No target currently set." });
        sendToTargets({
            method: "viewGameInfoAck",
            payload: request,
        }, connections, this.target);
    };

    gameInfo(request: Entities.PublicGameStats): void {
        AppError.assert(this.target, undefined, { detailedMessage: "No target currently set." });
        sendToTargets({
            method: "gameInfo",
            payload: request,
        }, connections, this.target);
    };

    viewGameHostInfoAck(request: Entities.Game): void {
        AppError.assert(this.target, undefined, { detailedMessage: "No target currently set." });
        sendToTargets({
            method: "viewGameHostInfoAck",
            payload: request,
        }, connections, this.target);
    };

    gameHostInfo(request: Entities.Game): void {
        AppError.assert(this.target, undefined, { detailedMessage: "No target currently set." });
        sendToTargets({
            method: "gameHostInfo",
            payload: request,
        }, connections, this.target);
    };

    gameEnded(request: Entities.Game): void {
        AppError.assert(this.target, undefined, { detailedMessage: "No target currently set." });
        sendToTargets({
            method: "gameEnded",
            payload: request,
        }, connections, this.target);
    };
}

export default WebsocketOperator;