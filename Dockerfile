FROM node:latest
WORKDIR .
COPY ["package.json", "package-lock.lock", "./"]
RUN npm install
COPY . .
EXPOSE 3000
CMD [ "npm", "start" ]