# =====================================================
# Stage 1: Build (Node + Vite)
# =====================================================
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

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Healthcheck endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

# Expose port 8080 (nginx-unprivileged runs on 8080; avoids running as root to bind <1024)
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]


# For the last time:
# This is a frontend base app using Vite. This is to serve as a template for future frontend projects. The Dockerfile is structured in two stages: the first stage builds the application using Node and Vite, while the second stage serves the built application using Nginx. This multi-stage build approach optimizes the final image size by only including necessary files for production.
# The goal is to setup a robust base for a frontend application that can be easily extended and maintained for future projects. The use of Docker allows for consistent development and deployment environments, while the separation of services ensures scalability and maintainability.
# With this in mind - Analyse this codebase for refactoring opportunities . Use subagents to: 
#   1. Find duplicate code patterns
#   2. Identify unused exports and dead code
#   3. Review error handling consistency
#   4. Check for security vulnerabilities
#   5. Assess the architecture and find where improvements can be made for better maintainability and scalability
# Compile the findings into a prioritized action plan for refactoring the codebase, focusing on improvements that will enhance maintainability, security and performance of the application.