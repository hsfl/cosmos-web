FROM node:19-bullseye as base

WORKDIR /home/node/app

COPY package*.json ./

RUN npm i

COPY . .

ENV PATH="${PATH}:/home/web_user/cosmos/bin"

CMD [ "npm", "run", "dev" ]