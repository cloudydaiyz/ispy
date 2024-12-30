// API Client definition

import * as Requests from "./requests";
import * as Api from "./models";
import axios, { AxiosError, AxiosInstance, CreateAxiosDefaults } from "axios";
import { AppMetrics } from "./types";

interface ApiClientConfig extends CreateAxiosDefaults {}

export class ApiClient implements Partial<Requests.HttpRequests> {
    axios: AxiosInstance;
    ready: Promise<void>;

    constructor(config: ApiClientConfig) {
        this.axios = axios.create(config);
        this.ready = this.init();
    }

    private async init(): Promise<void> {
        // Test the ping operation to make sure the config is valid
        console.log("Test ping")
        this.ping().catch(e => {
            console.log("ApiClient: Error encountered");
            handleError(e as AxiosError);
        });
    }

    async ping(): Promise<void> {
        const res = await this.axios.get("/");
        console.log(res.data);
    }

    async createGame(request: Requests.CreateGameRequest): Promise<Api.BearerAuth> {
        const res = await this.axios.post("/game", request);
        return res.data;
    }
}

async function pingTestRoutes(client: ApiClient) {
    // try {
    //     const d1 = await client.axios.post("/test/bad-request");
    //     console.log(d1.status);
    //     console.log("No error?");
    // } catch(e) {
    //     console.log("Error encountered");
    //     console.log(e);
    // }

    try {
        const d1 = await client.axios.post("/test/bad-status");
        console.log(d1.status);
        console.log("No error?");
    } catch(e) {
        console.log("pingTestRoutes: Error encountered");
        handleError(e as AxiosError);
    }
}

function handleError(error: AxiosError) {
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log('Error.Response', error.message);
        // console.log('Error.Response.Data', error.response.data);
        // console.log('Error.Response.Status', error.response.status);
        // console.log('Error.Response.Headers', error.response.headers);
    } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log('Error.Request', error.message);
        console.log('Error.Request', error.request);
    } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error.Message');
        // console.log('Error.Message', error.message);
    }
    console.log('Error.Config');
    console.log('Error.Config', error.config);
}

// const client = new ApiClient({ baseURL: "http://localhost:3000" });
const client = new ApiClient({ baseURL: "http://localhost:3000" });
client.ready.then(() => pingTestRoutes(client));