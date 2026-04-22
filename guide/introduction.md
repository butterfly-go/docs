# Introduction

Butterfly is a lightweight microservice framework designed for the Go language, aimed at simplifying the development and deployment of microservices. The framework provides core functionalities such as configuration management, service runtime, HTTP/gRPC support, data storage, and observability, allowing developers to focus on implementing business logic.

## Core Features

- **Configuration Management**: Supports file configuration and Consul configuration center, flexibly controlled through environment variables
- **Service Runtime**: Provides application lifecycle management with Google Wire dependency injection
- **Transport Layer Support**: 
  - HTTP server (based on Gin framework)
  - gRPC server support (port 9090)
  - Twirp RPC support
- **Data Storage**: 
  - GORM (MySQL and other relational databases)
  - MongoDB v2 driver
  - Redis client
  - Native SQL database connections
  - S3-compatible object storage (AWS SDK v2)
- **Observability**:
  - Prometheus metrics collection and exposure (port 2223)
  - OpenTelemetry distributed tracing
  - Structured logging system (based on `log/slog`)
- **Middleware Integration**: Automatic integration of OpenTelemetry middleware for request tracing
- **Testing Utilities**: Mock logging support for unit testing

## Installation

```bash
go get butterfly.orx.me/core
```
