# Dockerfile for React Vite Threat Intel Frontend Shell
FROM node:20-alpine AS dev

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
