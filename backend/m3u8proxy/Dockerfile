# Use Node.js LTS as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install -g
RUN npm install

# Copy project files
COPY . .

# Build the application
RUN npm run build

# Set environment variables with defaults
ENV HOST=0.0.0.0
ENV PORT=3030
ENV PUBLIC_URL=https://p.quickwatch.co
ENV CORSANYWHERE_WHITELIST=http://localhost:5173,http://localhost:5174,https://quickwatch.co,http://192.168.1.8:5173

# Expose the port the app runs on
EXPOSE 3030

# Command to run the application
CMD ["npm", "start"]
