# Tag: hsfl2/web_backend:latest
# Tag: hsfl2/web_backend:0.5.0

FROM node:19-bullseye as base

WORKDIR /home/node/app

COPY package*.json ./

RUN npm i

COPY . .

# Copy over web assembly files
COPY --from=hsfl2/web_core_dist:0.2.0 /build/dist/CosmosWebCore.data .
COPY --from=hsfl2/web_core_dist:0.2.0 /build/dist/CosmosWebCore.js /build/dist/CosmosWebCore.wasm /root/web_core_dist/

ENV PATH="${PATH}:/home/web_user/cosmos/bin"

CMD [ "npm", "run", "dev" ]