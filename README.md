# Swiss for Open Toolformer 🧀

This repository contains the source code for the Swiss project. Swiss is a human feedback and annotation collection application. 
Swiss is currently used to provide a public inference web application for Open Toolformer. 

### This project is a work in progress and the below instructions may not be up to date.

## Deploying

The quickest way to deploy an instance of Swiss is to pull and run the appropriate docker images. There are separate images 
for the frontend and backend applications. In the future, these steps will be automated.

1. Pull the application images onto your host system. 
```
docker pull ehavener/swiss-frontend:latest
docker pull ehavener/swiss-backend:latest
```
Note: These images are defined by `frontend/Dockerfile` and `backend/Dcokerfile`. They should
be current with the main branch, however they need to be built and released on the docker hub manually when changes are merged into to main.

2. Set up the appropriate environment variables onto your host system.
All applications will require that the `SECRET_KEY` environment variable is available inside your `swiss-backend` docker container. Some applications may require additional
API keys and secrets to be set.


3. Run the images to start the frontend and backend applications.
```
docker run -d --rm -p 3000:3000/tcp ehavener/swiss-frontend:latest
docker run -e SECRET_KEY="your key here" -e cohere_api_key="your key here" ehavener/swiss-backend:latest
```

TODO: steps for database initialization and JWT secret key generation

## Developing

Containers are not yet supported for developing Swiss.