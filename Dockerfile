FROM node:20 as builder
COPY . /app
WORKDIR /app
RUN yarn && \
    mkdir /dist && \
    mv /app/index.js /dist && \
    mv /app/package.json /dist && \
    mv /app/node_modules /dist

FROM gcr.io/distroless/nodejs20
COPY --from=builder /dist /app
WORKDIR /app
CMD [ "index.js" ]
