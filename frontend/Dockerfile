FROM node:20-alpine

WORKDIR /app

COPY package*.json .
RUN npm install

COPY . ./frontend

WORKDIR /app/frontend

EXPOSE 5173

CMD ["npm", "start"]
