FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose ports
EXPOSE 3000 8080

# Default command
CMD ["npm", "run", "dev:local"]
