import "./lib/env";

import { Hono } from 'hono'
import { auth } from "./lib/auth";
import tokenRoutes from "./routes/token";
import type { HonoEnv } from "./types";


const app = new Hono<HonoEnv>()

app.get('/', (c) => c.text('Hono!'))

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/token", tokenRoutes);

export default {
  port: 4000,
  fetch: app.fetch,
}