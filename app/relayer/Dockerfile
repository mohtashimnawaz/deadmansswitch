FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# ensure entrypoint is executable
RUN chmod +x ./entrypoint.sh

CMD ["./entrypoint.sh"]
