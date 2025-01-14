import { Entities, Requests } from "@cloudydaiyz/ispy-shared";
import { ReadWebsocketConnection, WebsocketConnection, ModifyWebsocketConnection, WebsocketOperationsContext, WebsocketTarget } from "../../lib/context";
import assert from "assert";

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

// immutable implementation for websocket operations
// private constructor w/ target set
class WebsocketOperator implements WebsocketOperationsContext {
    private target?: WebsocketTarget;
    constructor(target?: WebsocketTarget) {
        this.target = target;
    }

    to(target: WebsocketTarget): WebsocketOperationsContext {
        return new WebsocketOperator(target);
    };

    connect(target: WebsocketConnection): void {
        assert(!connections.find(c => c.username == target.username), "User already connected.");
        connections.push(target);
    };

    disconnect(): void {
        assert(this.target, "No target currently set.");
        const matched = getTargets(connections, this.target);
        matched.forEach(c => c.ws.disconnect());
    };

    read(): ReadWebsocketConnection[] {
        assert(this.target, "No target currently set.");
        const matched = getTargets(connections, this.target);
        return matched.map(m => ({
            getUsername: () => m.username,
            getRole: () => m.role,
            getTaskInfoView: () => m.taskInfoView,
            isAuthenticated: () => m.isAuthenticated,
            isViewingGameInfo: () => m.isViewingGameInfo,
            isViewingGameHostInfo: () => m.isViewingGameHostInfo,
        }));
    };

    modify(): ModifyWebsocketConnection {
        assert(this.target, "No target currently set.");
        const matched = getTargets(connections, this.target);
        return {
            setAuthenticated: async (flag: boolean) => { matched.forEach(m => { m.isAuthenticated = flag } ) },
            setTaskInfoView: async (taskId?: string) => { matched.forEach(m => { m.taskInfoView = taskId } ) },
            setViewGameInfo: async (flag: boolean) => { matched.forEach(m => { m.isViewingGameInfo = flag } ) },
            setViewGameHostInfo: async (flag: boolean) => { matched.forEach(m => { m.isViewingGameHostInfo = flag } ) },
        }
    };

    authenticateAck(): void {
        assert(this.target, "No target currently set.");
        sendToTargets({
            method: "authenticateAck",
        }, connections, this.target);
    };

    viewGameInfoAck(request: Entities.PublicGameStats): void {
        assert(this.target, "No target currently set.");
        sendToTargets({
            method: "viewGameInfoAck",
            payload: request,
        }, connections, this.target);
    };

    gameInfo(request: Entities.PublicGameStats): void {
        assert(this.target, "No target currently set.");
        sendToTargets({
            method: "gameInfo",
            payload: request,
        }, connections, this.target);
    };

    viewGameHostInfoAck(request: Entities.Game): void {
        assert(this.target, "No target currently set.");
        sendToTargets({
            method: "viewGameHostInfoAck",
            payload: request,
        }, connections, this.target);
    };

    gameHostInfo(request: Entities.Game): void {
        assert(this.target, "No target currently set.");
        sendToTargets({
            method: "gameHostInfo",
            payload: request,
        }, connections, this.target);
    };

    gameEnded(request: Entities.Game): void {
        assert(this.target, "No target currently set.");
        sendToTargets({
            method: "gameEnded",
            payload: request,
        }, connections, this.target);
    };
}

export default WebsocketOperator;