import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import app from "./src/backend/index";
import { createLocalD1 } from "./src/backend/db/local-d1";

const localDb = createLocalD1("./data/local.sqlite");

export default defineConfig({
  plugins: [
    react(),
    {
      name: "hono-cloudflare-middleware",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url || !req.url.startsWith("/api")) {
            return next();
          }

          try {
            const host = req.headers.host || "localhost:3000";
            const url = `http://${host}${req.url}`;

            const buffers: Buffer[] = [];
            for await (const chunk of req) {
              buffers.push(chunk);
            }
            const hasBody = !["GET", "HEAD"].includes(req.method || "") && buffers.length > 0;
            const body = hasBody ? Buffer.concat(buffers) : undefined;

            const headers = new Headers();
            for (const [key, value] of Object.entries(req.headers)) {
              if (value !== undefined) {
                if (Array.isArray(value)) {
                  value.forEach((v) => headers.append(key, v));
                } else {
                  headers.set(key, value);
                }
              }
            }

            const webReq = new Request(url, {
              method: req.method,
              headers,
              body,
              // @ts-ignore
              duplex: hasBody ? "half" : undefined,
            });

            const env = {
              DB: localDb,
              MIDTRANS_SERVER_KEY: "SB-Mid-server-demo-dessertbox",
              MIDTRANS_CLIENT_KEY: "SB-Mid-client-demo-dessertbox",
              MIDTRANS_IS_PRODUCTION: "false",
            };

            const webRes = await app.fetch(webReq, env);

            res.statusCode = webRes.status;
            webRes.headers.forEach((val, key) => {
              res.setHeader(key, val);
            });

            const arrayBuffer = await webRes.arrayBuffer();
            res.end(Buffer.from(arrayBuffer));
          } catch (err: any) {
            console.error("API Middleware Error:", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      },
    },
  ],
  server: {
    port: 3000,
  },
});
