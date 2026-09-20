
# official LTS debian-based image
FROM node:22-slim

# sets the working directory inside the container.
WORKDIR /app

# install python, make, g++ for node-gyp ...
RUN apt-get update && \
	apt-get install -y python3 make g++

# remove package indexes
RUN rm -rf /var/lib/apt/lists/*

# add in .dockerignore to exclude files.
COPY . .

# npm ci (clean install) --dev (avoid installing devDependencies)
RUN npm ci --only=dev

CMD ["npm", "start"]
