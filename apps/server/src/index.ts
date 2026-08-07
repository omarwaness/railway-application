import "./lib/env";

import { Hono } from 'hono'
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

app.get('/', (c) => c.text('Hono!'))

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/token", tokenRoutes);
app.route("/projects", projectRoutes);
app.route("/services", serviceRoutes);
app.route("/environments", environmentRoutes);
app.route("/deployments", deploymentRoutes);
app.route("/domains", domainRoutes);
app.route("/variables", variableRoutes);

export default {
  port: 4000,
  fetch: app.fetch,
}