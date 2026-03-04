# Frontend Service

## Overview

The Frontend Service is a Node.js-based microservice that provides a web interface for the QuotesMesh demo application. It serves as the user-facing component, displaying random quotes fetched from the backend Quotes Service. The service is built with Express.js and includes OpenTelemetry instrumentation for observability.

## Features

- **Web Interface**: Serves an HTML page displaying random quotes with a clean, dark-themed UI.
- **API Proxying**: Proxies requests to the Quotes Service for fetching quotes.
- **Health Check**: Provides a `/health` endpoint for monitoring service status.
- **Observability**: Integrated with OpenTelemetry for tracing and metrics collection using Jaeger and Prometheus.
- **Containerized**: Includes a multi-stage Dockerfile for efficient container builds.
- **Security**: Runs as a non-root user in the container.

## Prerequisites

- Node.js (version 20 or later)
- Docker (for containerized deployment)
- Access to the Quotes Service (backend API)

## Installation

### Local Development

1. Clone the repository and navigate to the service directory:
   ```
   cd services/frontend-service
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the service:
   ```
   npm start
   ```

The service will run on `http://localhost:3000` by default.

### Docker

1. Build the Docker image:
   ```
   docker build -t frontend-service .
   ```

2. Run the container:
   ```
   docker run -p 3000:3000 -e QUOTES_SERVICE_URL=http://quotes-service:8000 frontend-service
   ```

For production, use the provided `docker-compose.yml` in the parent `services` directory.

## Usage

### Accessing the Application

- Open a web browser and navigate to `http://localhost:3000` (or the exposed port).
- The page displays a random quote with a "New Quote" button to refresh.

### API Endpoints

- `GET /`: Serves the main HTML page with a random quote.
- `GET /health`: Returns service health status in JSON format.
- `GET /quotes`: Proxies to the Quotes Service to fetch all quotes.

### Configuration

The service can be configured using environment variables:

- `PORT`: Port to run the server on (default: 3000)
- `QUOTES_SERVICE_URL`: URL of the Quotes Service (default: http://localhost:8000)
- `NODE_ENV`: Environment mode (default: production in container)

## Dependencies

- **Express.js**: Web framework for Node.js
- **Axios**: HTTP client for API requests
- **OpenTelemetry**: Instrumentation for observability
- **Prom-Client**: Prometheus metrics client

See `package.json` for full dependency list.

## Health Check

The service includes a health check endpoint at `/health` and a Docker health check that verifies the endpoint is responsive.

## Deployment

This service is designed to run in a containerized environment. Refer to the Kubernetes manifests in `k8s-local/frontent/` for deployment configurations.

## Contributing

1. Make changes to the code.
2. Test locally.
3. Submit a pull request.

## License

This project is part of the QuotesMesh demo and follows the same licensing terms.