# Use Node.js as the base image
FROM node:20-alpine as build

# Set working directory
WORKDIR /app

# Copy package.json files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies for root project and server
RUN npm install
RUN cd server && npm install && cd ..

# Copy source files
COPY . .

# Build React app
RUN npm run build

# Production stage
FROM node:20-alpine as production

# Set working directory
WORKDIR /app

# Copy built React app and server code
COPY --from=build /app/build ./build
COPY --from=build /app/server ./server

# Copy web.config file if deploying to IIS
COPY --from=build /app/web.config ./web.config

# Install only production server dependencies
WORKDIR /app/server
COPY --from=build /app/server/package*.json ./
RUN npm install --only=production

# Return to app root
WORKDIR /app

# Create a data directory for persistence and set proper permissions
RUN mkdir -p /app/server/data && \
    chmod 777 /app/server/data

# Expose the port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start the server (which also serves the React app)
CMD ["node", "server/index.js"]
