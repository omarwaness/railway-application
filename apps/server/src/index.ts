import { env } from "./lib/env";

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from "./lib/auth";
import tokenRoutes from "./routes/token";
import projectRoutes from "./routes/projects";
import serviceRoutes from "./routes/services";
import environmentRoutes from "./routes/environments";
import deploymentRoutes from "./routes/deployments";
import domainRoutes from "./routes/domains";
import variableRoutes from "./routes/variables";
import type { HonoEnv } from "./types";


const app = new Hono<HonoEnv>()

// The client runs on its own origin, so every request here is cross-origin.
// `credentials` is what lets the session cookie ride along — with it on, the
// allowed origin has to be the exact URL, never "*".
app.use(
    "*",
    cors({
        origin: env.CLIENT_URL,
        credentials: true,
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type"],
    }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Chained on purpose: Hono only carries route types through the value each
// `.route()` returns, so splitting these into separate `app.route(...)`
// statements would leave `AppType` with no routes and the RPC client untyped.
// Outside the chain below on purpose: this is infrastructure, not API surface,
// and it has no business appearing in the client's typed route map. It must
// stay unauthenticated — Railway's healthcheck carries no session.
app.get("/health", (c) => c.json({ status: "ok" }));

const routes = app
    .get('/', (c) => c.text('Hono!'))
    .route("/token", tokenRoutes)
    .route("/projects", projectRoutes)
    .route("/services", serviceRoutes)
    .route("/environments", environmentRoutes)
    .route("/deployments", deploymentRoutes)
    .route("/domains", domainRoutes)
    .route("/variables", variableRoutes);

/** The shape the client's RPC client is built from — types only, no runtime cost. */
export type AppType = typeof routes;

export default {
  // Railway hands the port in at runtime; `env` supplies 4000 only for local runs.
  port: env.PORT,
  fetch: app.fetch,
}
