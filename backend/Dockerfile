# Use Node.js LTS version
FROM node:20-slim

# Install dependencies required for Oracle Instant Client
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    libaio1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Download and install Oracle Instant Client
RUN wget https://download.oracle.com/otn_software/linux/instantclient/2113000/instantclient-basic-linux.x64-21.13.0.0.0dbru.zip \
    && unzip instantclient-basic-linux.x64-21.13.0.0.0dbru.zip \
    && rm instantclient-basic-linux.x64-21.13.0.0.0dbru.zip \
    && mkdir -p /opt/oracle/instantclient \
    && mv instantclient_21_13/* /opt/oracle/instantclient/ \
    && rm -rf instantclient_21_13 \
    && echo /opt/oracle/instantclient > /etc/ld.so.conf.d/oracle-instantclient.conf \
    && ldconfig

# Set Oracle environment variables
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient:$LD_LIBRARY_PATH
ENV ORACLE_HOME=/opt/oracle/instantclient

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --production

# Copy application code (excluding wallet via .dockerignore)
COPY . .

# Copy wallet folder separately (if exists locally)
# This will be used instead of Base64 decode
COPY wallet /app/wallet

# Set wallet permissions
RUN chmod -R 600 /app/wallet/* && chmod 755 /app/wallet

# Expose port
EXPOSE 10000

# Start the application
CMD ["npm", "start"]
