FROM node:20 as builder
COPY . /app
WORKDIR /app
RUN yarn

FROM gcr.io/distroless/nodejs20
WORKDIR /app
COPY --from=builder /app/index.js .
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules .
CMD [ "index.js" ]
