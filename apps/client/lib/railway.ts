/**
 * Railway's own pages, linked from anywhere this app has to send someone to
 * Railway itself. Kept here so the token flows — onboarding and settings —
 * can't point at different places.
 */

/** Railway's sign-in, which doubles as its sign-up. */
const RAILWAY_LOGIN = "https://railway.com/login"

/** Where Railway issues the API token this app asks for. */
const RAILWAY_TOKENS = "https://railway.com/account/tokens"

export { RAILWAY_LOGIN, RAILWAY_TOKENS }
