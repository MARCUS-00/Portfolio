/*
 * Minimal static server for dist/, behaving like typical static hosts:
 * directory index, trailing-slash redirect, and 404.html for unknown paths.
 * For local preview and tests only; deploy dist/ to any static host.
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml", ".woff2": "font/woff2", ".pdf": "application/pdf", ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8", ".json": "application/json",
};

export function serve({ root, port = 4173, host = "127.0.0.1" } = {}) {
  const server = createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
      const file = normalize(join(root, path));
      if (!file.startsWith(normalize(root + sep)) && file !== normalize(root)) return send(res, 400, "Bad request");
      let s = await stat(file).catch(() => null);
      if (s && s.isDirectory()) {
        if (!path.endsWith("/")) { res.writeHead(301, { Location: path + "/" }); return res.end(); }
        return sendFile(res, 200, join(file, "index.html"));
      }
      if (s && s.isFile()) return sendFile(res, 200, file);
      return sendFile(res, 404, join(root, "404.html"));
    } catch {
      send(res, 500, "Server error");
    }
  });
  return new Promise((resolve) => server.listen(port, host, () => resolve(server)));
}

async function sendFile(res, status, file) {
  const body = await readFile(file).catch(() => null);
  if (!body) return send(res, 404, "Not found");
  const cache = /\/assets\//.test(file.replaceAll("\\", "/")) ? "public, max-age=31536000, immutable" : "no-cache";
  res.writeHead(status, { "Content-Type": TYPES[extname(file)] || "application/octet-stream", "Cache-Control": cache });
  res.end(body);
}
function send(res, status, text) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === normalize(process.argv[1])) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
  const port = Number(process.env.PORT) || 4173;
  serve({ root, port }).then(() => console.log(`Serving dist/ at http://127.0.0.1:${port}/`));
}
