FROM node:19-alpine as firststage
WORKDIR /book
COPY package*.json .
RUN npm install
COPY . .

FROM firststage as final
RUN npm install --production
COPY . .
CMD ["node", "index.js"]
