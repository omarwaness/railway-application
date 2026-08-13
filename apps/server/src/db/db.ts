import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env } from '../lib/env';

// Via `env` rather than `process.env` directly: that module validates on import
// and throws with every missing variable named at once, so a misconfigured
// deploy fails at boot instead of on the first query.
const client = postgres(env.DATABASE_URL, {
    // One long-lived container, so the pool is bounded by what the database
    // will grant rather than by request volume. Railway's Postgres plans start
    // around 100 connections; 10 leaves room for migrations and a psql session.
    max: 10,
    // Recycle idle connections so a proxy or database restart doesn't leave the
    // pool holding sockets the other end has already forgotten about.
    idle_timeout: 30,
});

export const db = drizzle(client);
