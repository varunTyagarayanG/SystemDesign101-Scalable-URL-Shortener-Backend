# services/backend/Dockerfile

FROM node:18-alpine

# Set working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if you have one), then install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy all source files into the container
COPY src ./src

# Expose internal port (no host binding here—nginx will proxy)
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
