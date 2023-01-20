FROM node:19-bullseye as base

WORKDIR /home/node/app

COPY package*.json ./

RUN npm i

COPY . .

CMD [ "npm", "run", "dev" ]