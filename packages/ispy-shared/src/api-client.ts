// API Client definition

import * as Requests from "./requests";
import * as Api from "./models";
import axios, { AxiosInstance } from "axios";
import { AppMetrics } from "./types";

interface ApiClientInitializer {
    baseUrl: string;
}

export class ApiClient implements Partial<Requests.HttpRequests> {
    axios: AxiosInstance;

    constructor(init: ApiClientInitializer) {
        this.axios = axios.create({
            baseURL: init.baseUrl,
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
    await client.ping();

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
        console.log("Error encountered");
        // console.log(e);
    }
}

const client = new ApiClient({ baseUrl: "http://localhost:3000" });
pingTestRoutes(client);