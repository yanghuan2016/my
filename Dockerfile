FROM ubuntu:14.04
COPY . /src
RUN \
   apt-get update && \
   apt-get install --no-install-recommends wget -y && \
   cd /usr/local && \
   wget -c http://download.romenscd.cn:8082/node-v0.12.9-linux-x64.tar.gz && \
   tar -xf node-v0.12.9-linux-x64.tar.gz && \
   mv node-v0.12.9-linux-x64 /usr/local/node && \
   ln -s /usr/local/node/bin/node /usr/bin/node && \
   ln -s /usr/local/node/bin/npm /usr/bin/npm && \
   rm -rf node-v0.12.9-linux-x64.tar.gz && \
   apt-get remove wget -y && \
   rm -rf /var/lib/apt/lists/*
RUN \
   apt-get update && apt-get install --no-install-recommends  python g++ make git -y && \
   npm install gulp -g && \
   npm install pm2 -g && \
   cd /src && \
   npm install && \
   cd /src && \
   gulp && \
   rm -rf /var/lib/apt/lists/* && \
   apt-get remove g++ make git wget python -y

RUN \
   cd /src/quotation && \
   npm install && \
   npm run build && \
   rm -rf /src/quotation/node_modules

EXPOSE 3300

CMD ["node", "/src/app.js"]
