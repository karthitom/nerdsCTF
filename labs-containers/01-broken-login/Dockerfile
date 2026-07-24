FROM node:18-alpine

WORKDIR /app

# Copy package info and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application code
COPY . .

# Expose the application port
EXPOSE 8000

# Run the app
CMD ["npm", "start"]
