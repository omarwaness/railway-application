import { Hono } from 'hono'
import { auth } from "./lib/auth";
import type { HonoEnv } from "./types";


const app = new Hono<HonoEnv>()

app.get('/', (c) => c.text('Hono!'))

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

export default {
  port: 4000,
  fetch: app.fetch,
}