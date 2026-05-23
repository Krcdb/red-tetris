FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json webpack.config.js ./
COPY public ./public
COPY src ./src
EXPOSE 3000
CMD ["npx", "webpack", "serve", "--mode", "development", "--host", "0.0.0.0", "--port", "3000"]
