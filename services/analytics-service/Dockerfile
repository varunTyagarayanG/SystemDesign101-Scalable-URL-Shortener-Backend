FROM node:18-alpine

WORKDIR /app

# Copy and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source files
COPY src ./src

EXPOSE 4002
CMD ["npm", "start"]
