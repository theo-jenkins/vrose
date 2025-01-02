FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY frontend/package.json frontend/package-lock.json /app/
RUN npm install

# Copy all frontend files
COPY frontend/ /app/

# Expose the port for the React app
EXPOSE 3000

# Start the React development server
CMD ["npm", "start"]
