import assert from "assert";

export const ACCESS_TOKEN_SECRET = process.env.ISPY_ACCESS_TOKEN_SECRET!;
export const REFRESH_TOKEN_SECRET = process.env.ISPY_REFRESH_TOKEN_SECRET!;
export const SCHEDULED_FUNCTION_NAME = process.env.ISPY_SCHEDULED_FUNCTION_NAME!;
export const ROOT = process.env.ISPY_ROOT;
export const TEMPDIR = process.env.ISPY_CORE_TEMPDIR;
export const CORE_CANONICAL = process.env.ISPY_CORE_CANONICAL;
export const UI_CANONICAL = process.env.ISPY_UI_CANONICAL;
// CANONICAL_CORE_URL
// CANONICAL_UI_URL

// All required environment variables
const variablesToVerify = [
    ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET,
    SCHEDULED_FUNCTION_NAME,
];

assert(variablesToVerify.every(v => v));