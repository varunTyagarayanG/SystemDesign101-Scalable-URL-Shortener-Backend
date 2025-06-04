# Build a minimal Node.js container
FROM node:18-alpine

WORKDIR /app
# Copy only package.json first, install dependencies
COPY package.json ./
RUN npm install

# Copy source code
COPY src ./src

# Expose port 4000 (can choose any free port for this microservice)
EXPOSE 4000
CMD ["npm", "start"]
