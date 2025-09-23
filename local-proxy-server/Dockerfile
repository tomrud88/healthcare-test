FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
COPY service-account-key.json ./service-account-key.json

EXPOSE 8080

CMD ["npm", "start"]
