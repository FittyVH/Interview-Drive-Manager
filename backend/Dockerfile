# Use official lightweight Node.js image
FROM node:20-alpine
# Set working directory inside the container
WORKDIR /app
# Copy package files first (layer caching — faster rebuilds)
COPY package*.json ./
# Install only production dependencies
RUN npm install --omit=dev
# Copy the rest of your source code
COPY . .
# Expose the port your app listens on
EXPOSE 3000
# Start the server
CMD ["node", "server.js"]