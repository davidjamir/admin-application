export const AUTH_COOKIE_NAME = "7forge_session";

/** Cookie `maxAge` (seconds) and JWT `exp` must stay aligned. */
export const AUTH_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

/** Passed to `SignJWT#setExpirationTime` — keep in sync with `AUTH_SESSION_MAX_AGE_SECONDS`. */
export const AUTH_SESSION_JWT_EXPIRES = "7d" as const;
