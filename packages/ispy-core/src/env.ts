import assert from "assert";

export const ACCESS_TOKEN_SECRET = process.env.ISPY_ACCESS_TOKEN_SECRET!;
export const REFRESH_TOKEN_SECRET = process.env.ISPY_REFRESH_TOKEN_SECRET!;
export const SCHEDULED_FUNCTION_NAME = process.env.ISPY_SCHEDULED_FUNCTION_NAME!;
// CANONICAL_CORE_URL
// CANONICAL_UI_URL

// All required environment variables
const variablesToVerify = [
    ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET,
    SCHEDULED_FUNCTION_NAME
];

assert(variablesToVerify.every(v => v));