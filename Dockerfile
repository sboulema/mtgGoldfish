# First Stage
FROM node

COPY . .

RUN npm install
RUN npm run gulp

# Second Stage
FROM lipanski/docker-static-website

COPY --from=0 --chmod=0644 dist/ .