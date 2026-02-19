# =====================================================
# Stage 1: Build (Node + Vite)
# =====================================================
# TODO: Pin the builder image to an immutable SHA-256 digest for supply-chain
# security.  Mutable tags (e.g. node:22-alpine) can be silently replaced.
# How to get the current digest:
#   docker pull node:22-alpine
#   docker inspect node:22-alpine --format='{{index .RepoDigests 0}}'
# Then replace the line below with:
#   FROM node:22-alpine@sha256:<digest> AS builder
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy dependency files first (improves layer caching)
COPY package.json yarn.lock ./

# Install dependencies
# Uses BuildKit cache for faster rebuilds
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn install --frozen-lockfile

# Copy project files
COPY . .

# Build the Vite app (outputs to /app/dist)
RUN yarn build


# =====================================================
# Stage 2: Production (Nginx static server)
# =====================================================
FROM nginxinc/nginx-unprivileged:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy shared security headers include (referenced by every location block in default.conf)
COPY nginx/security_headers.conf /etc/nginx/conf.d/security_headers.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Healthcheck endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

# Expose port 8080 (nginx-unprivileged runs on 8080; avoids running as root to bind <1024)
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]