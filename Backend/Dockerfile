# Use stable Node version
FROM node:20-alpine

# App directory inside container
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install only production deps
RUN npm install --only=production

# Copy backend source code
COPY . .

# Expose backend port (change if needed)
EXPOSE 5000

# Start backend
CMD ["node", "server.js"]
