FROM node:18-alpine

WORKDIR /app


COPY package.json package-lock.json* ./
RUN npm install


COPY src ./src

EXPOSE 4002
CMD ["npm", "start"]
