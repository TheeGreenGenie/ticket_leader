# ── Build stage ───────────────────────────────────────────────────────────────
# node:20-slim is Debian/glibc-based so Rollup's prebuilt linux-x64-gnu binary
# loads natively. Without it Vite falls back to WASM Rollup (~15x slower) —
# that is what was causing the long step 5.
FROM node:20-slim AS build
WORKDIR /app

# Suppress audit/fund noise; raise network timeout for slow registries
RUN npm config set audit false \
 && npm config set fund false \
 && npm config set fetch-timeout 120000

# Copy manifests first — this layer is cached unless deps change
COPY package*.json .npmrc ./

# Install deps + guarantee the prebuilt Rollup native binary in one layer.
# npm ci sometimes skips optional platform binaries inside Docker; without the
# gnu binary Vite falls back to WASM Rollup which is ~15x slower.
RUN npm ci && npm install --no-save @rollup/rollup-linux-x64-gnu

# Copy source and build.
# NODE_OPTIONS gives Node enough heap to parse Three.js (38 MB) without GC thrash.
COPY . .
RUN NODE_OPTIONS="--max-old-space-size=3072" npm run build

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
