# Stage 1: Build the React application
FROM node:18-alpine as build-stage

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to leverage Docker cache
# if dependencies haven't changed.
COPY package*.json ./

# Install dependencies
RUN npm install --silent --force
# For yarn, use: RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the React app for production
# This command creates the optimized production build in the 'build' folder
RUN npm run build
# For yarn, use: RUN yarn build

# Stage 2: Serve the application with Nginx
# Use a lean Nginx image
FROM nginx:stable-alpine as production-stage

# Copy the Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove default Nginx index page
RUN rm -rf /usr/share/nginx/html/*

# Copy the built React app from the build-stage to Nginx's public directory
COPY --from=build-stage /app/build /usr/share/nginx/html

# Expose port 80 for HTTP traffic
EXPOSE 80

# Command to run Nginx when the container starts
CMD ["nginx", "-g", "daemon off;"]