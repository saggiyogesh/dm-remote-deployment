FROM mhart/alpine-node:8

WORKDIR /app

ADD . /app

RUN npm install

ENTRYPOINT npm run build-start
