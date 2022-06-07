FROM node:17-bullseye as base

WORKDIR /home/node/app

COPY package*.json ./

RUN npm i

COPY . .