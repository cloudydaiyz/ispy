// API client definition

import * as Requests from "./requests";
import * as Api from "./entities";
import axios, { AxiosError, AxiosInstance, CreateAxiosDefaults, InternalAxiosRequestConfig } from "axios";
const Paths = Requests.Paths;

interface ApiClientConfig extends CreateAxiosDefaults {}

export class ApiClient implements Partial<Requests.HttpRequests> {
    axios: AxiosInstance;
    ready: Promise<void>;
    accessToken?: string;
    refreshToken?: string;

    constructor(config: ApiClientConfig) {
        this.axios = axios.create(config);

        // Interceptor functions //
        const onRequest = (request: InternalAxiosRequestConfig<any>) => {
            const username = request.data.username;
            const password = request.data.password;
            const accessToken = request.data.accessToken;
            const refreshToken = request.data.refreshToken;

            let authCount = 0;

            // Basic authentication
            if(username && password) {
                request.headers['Authorization'] = 'Basic ' + btoa(username + ':' + password);
                authCount++;
            }

            // Bearer authentication
            if(accessToken) {
                request.headers['Authorization'] = 'Bearer ' + accessToken;
                authCount++;
            }

            if(refreshToken) {
                request.headers['Authorization'] = 'Bearer ' + refreshToken;
                authCount++;
            }

            if(authCount > 1) {
                throw new Error("Invalid request; cannot have more than one form of authentication in one request");
            }

            // Omit auth from the request
            delete request.data.username;
            delete request.data.password;
            delete request.data.accessToken;
            delete request.data.refreshToken;
            return request;
        }

        const onRequestError = (error: any) => {
            // Error during request setup
            console.error('Error during request setup');
            return Promise.reject(error);
        }

        const $onResponseError = () => {
            const refresh = async () => {
                if(!this.refreshToken) {
                    throw new Error("Unable to refresh credentials for request");
                }
                await this.refreshCredentials({ refreshToken: this.refreshToken });
            } 

            // Tries to refresh credentials once on auth error
            let authRetry = false;
            return async function (e: any) {
                // Request was made but no response received
                // OR response returned with error
                console.log('Error during response handling');

                const error = e as AxiosError;
                if(error.response?.status == 401 && !authRetry) {
                    authRetry = true;
                    await refresh();
                }
                authRetry = false;
                return Promise.reject(error);
            };
        }

        // Interceptor definitions //
        this.axios.interceptors.request.use(
            onRequest,
            onRequestError,
        );
        this.axios.interceptors.response.use(
            undefined,
            $onResponseError(),
        );

        this.ready = this.init();
    }

    private async init(): Promise<void> {
        // Test the ping operation to make sure the config is valid
        this.ping().catch(e => {
            console.log("ApiClient: Error encountered during setup ping. Please check "
                + "your configuration input and ensure its validity.");
            console.log(e);
        });
    }

    private setCredentials(auth: Api.BearerAuth): void {
        this.accessToken = auth.accessToken;
        this.refreshToken = auth.refreshToken;
    }

    private useAuth() {
        if(!this.accessToken) {
            throw new Error("Unable to perform request; no access token");
        }
        return { headers: { 'Authorization': 'Bearer ' + this.accessToken } };
    }

    private useRefresh() {
        if(!this.refreshToken) {
            throw new Error("Unable to perform request; no access token");
        }
        return { headers: { 'Authorization': 'Bearer ' + this.refreshToken } };
    }

    ping = async () => console.log(await this.axios.get(Paths.ping).then(r => r.data));
    metrics = () => this.axios.get(Paths.metrics).then(r => r.data);
    createGame = (request: Requests.CreateGameRequest) => this.axios
        .post(Paths.createGame, request)
        .then(r => { this.setCredentials(r.data); return r.data });
    validateGame = async (request: Api.GameConfiguration) => {
        try {
            await this.axios.post(Paths.validateGame, request);
        } catch {
            return false;
        }
        return true;
    }
    getGameHistory = () => this.axios.get(Paths.getGameHistory).then(r => r.data);
    exportGamePdf = () => this.axios.post(Paths.exportGamePdf).then(r => r.data);
    joinGame = (request: Api.BasicAuth) => this.axios
        .post(Paths.joinGame, request)
        .then(r => { this.setCredentials(r.data); return r.data });
    authenticate = (request: Api.AccessToken) => this.axios.post(Paths.authenticate, request).then(r => r.data);
    refreshCredentials = (request: Api.RefreshToken) => this.axios
        .post(Paths.refreshCredentials, request, this.useRefresh())
        .then(r => { this.setCredentials(r.data); return r.data });
    
    leaveGame = async (request: Api.Username) => { await this.axios.post(Paths.leaveGame, request, this.useAuth()) };
    submitTask = async (request: Api.TaskId) => { await this.axios.post(Paths.submitTask, request, this.useAuth()) };
    viewPlayerInfo = (request: Api.Username) => this.axios.post(Paths.viewPlayerInfo, request, this.useAuth()).then(r => r.data);
    viewTaskInfo = (request: Api.TaskId) => this.axios.post(Paths.viewTaskInfo, request, this.useAuth()).then(r => r.data);
    viewGameInfo = () => this.axios.post(Paths.viewGameInfo, undefined, this.useAuth()).then(r => r.data);

    startGame = async () => { await this.axios.post(Paths.startGame, undefined, this.useAuth()) };
    endGame = async () => { await this.axios.post(Paths.endGame, undefined, this.useAuth()) };
    kickPlayer = async (request: Api.Username) => { await this.axios.post(Paths.kickPlayer, request, this.useAuth()) };
    kickAllPlayers = async () => { await this.axios.post(Paths.kickAllPlayers, undefined, this.useAuth()) };
    lockGame = async () => { await this.axios.post(Paths.lockGame, undefined, this.useAuth()) };
    unlockGame = async () => { await this.axios.post(Paths.unlockGame, undefined, this.useAuth()) };
    viewTaskHostInfo = (request: Api.TaskId) => this.axios.post(Paths.viewTaskHostInfo, request, this.useAuth()).then(r => r.data);
    viewTaskGameInfo = () => this.axios.post(Paths.viewGameHostInfo, undefined, this.useAuth()).then(r => r.data);

    removeAdmin = async (request: Api.Username) => { await this.axios.post(Paths.removeAdmin, request, this.useAuth()) };
}

// Sample usage:
// const client = new ApiClient({ baseURL: "http://localhost:3000" });