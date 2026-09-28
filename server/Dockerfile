FROM node:20-slim

# Install Python, curl, and ffmpeg
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 curl ffmpeg ca-certificates && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

ENV PORT=10000
EXPOSE 10000

CMD ["node", "server.cjs"]
