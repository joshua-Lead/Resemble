FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY server.js ./
COPY main.js main.css index.html shop.html product.html about.html design-system.html collections.html client-care.html account.html checkout.html confirmation.html cart.html wishlist.html auth.html admin.html .env.production.example .env.example ./
COPY railway.toml render.yaml .dockerignore DOCKER-HEALTHCHECK.sh ./
COPY assets ./assets
COPY data ./data
RUN chmod +x /app/DOCKER-HEALTHCHECK.sh
EXPOSE 8787
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=5 CMD /app/DOCKER-HEALTHCHECK.sh
CMD ["node","server.js"]
