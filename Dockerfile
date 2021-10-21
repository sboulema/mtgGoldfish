# First Stage
FROM node

COPY . .

RUN npm install
RUN npm run gulp

RUN chmod -R ugo-x,u+rwX,go+rX,go-w dist

# Second Stage
FROM lipanski/docker-static-website

COPY --from=0 dist/ .