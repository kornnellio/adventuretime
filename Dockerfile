# syntax=docker/dockerfile:1

# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies needed for native modules (bcrypt, canvas, sharp)
RUN apk add --no-cache libc6-compat python3 make g++ pkgconfig pixman-dev cairo-dev pango-dev jpeg-dev giflib-dev

# ---- Dependencies ----
FROM base AS deps

# Copy package files
COPY package.json package-lock.json* ./

# Install ALL dependencies (need devDeps for build)
# Use --legacy-peer-deps for React 19 compatibility
# --ignore-scripts to skip canvas compilation (canvas is only for dev scripts)
RUN npm ci --legacy-peer-deps --ignore-scripts

# Rebuild bcrypt native module (needed for auth)
RUN npm rebuild bcrypt

# ---- Builder ----
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Setup TinyMCE before build
RUN npm run setup-tinymce

# Build the application
# Dummy env vars for build time (real values come from Cloud Run secrets)
ENV NEXT_TELEMETRY_DISABLED=1
ENV RESEND_API_KEY=re_dummy_key_for_build
ENV MONGODB_URI=mongodb://localhost:27017/dummy
ENV NEXTAUTH_SECRET=dummy_secret_for_build
ENV NEXTAUTH_URL=http://localhost:3000

RUN npm run build

# ---- Runner ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3006

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3006

CMD ["node", "server.js"]
