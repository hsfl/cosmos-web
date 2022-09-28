FROM node:18-bullseye as base

WORKDIR /home/node/app

COPY package*.json ./

RUN npm i

COPY . .