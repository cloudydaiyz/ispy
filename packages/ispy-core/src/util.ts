// Utility types and functions

import { Entities } from "@cloudydaiyz/ispy-shared";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from "./env";

export type AuthJwtPayload = { user: string, role: Entities.UserRole };
export type AnyFunction = (...args: any) => any;
export type Promisified<F extends AnyFunction> = ReturnType<F> extends Promise<any> ? F : (...args: Parameters<F>) => Promise<ReturnType<F>>;

export type PromisifyAll<T extends Record<string, any>> = T[keyof T] extends AnyFunction ? {
    [key in keyof T]: T[key] extends AnyFunction 
        ? ReturnType<T[key]> extends Promise<any> 
            ? T[key]
            : Promisified<T[key]> 
        : T[key];
} : T;

export type PartialAll<T extends Record<string, any>> = {
    [key in keyof T]?: (
        T[key] extends Record<string, any> 
            ? PartialAll<T[key]> 
            : T[key]
    );
};

export function getCurrentPointValue(
    currentTime: number, 
    initialValue: number, 
    startTime: number, 
    endTime: number,
    success: boolean,
) : number {
    return success 
        ? Math.floor(
            (initialValue / (startTime - endTime)) * currentTime 
            - ((initialValue * endTime) / (startTime - endTime))
        )
        : Math.floor(
            (initialValue / (endTime - startTime)) * currentTime 
            - ((initialValue * endTime) / (endTime - startTime))
        );
}

export function extractAccessToken(token: string): AuthJwtPayload | null {
    try {
        return jwt.verify(token, ACCESS_TOKEN_SECRET) as AuthJwtPayload;
    } catch {
        return null;
    }
}

export function extractRefreshToken(token: string): AuthJwtPayload | null {
    try {
        return jwt.verify(token, ACCESS_TOKEN_SECRET) as AuthJwtPayload;
    } catch {
        return null;
    }
}