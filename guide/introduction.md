# Introduction

Butterfly is a Go microservice framework. You supply routes, gRPC services and settings. Butterfly provides the rest of what a production service needs: configuration, tracing, metrics, structured logging, data store clients, health checks and graceful shutdown.

## What you get

- **HTTP and gRPC servers** ([Gin](https://github.com/gin-gonic/gin), grpc-go, optional Twirp), each with tracing, request ids, access or call logs and panic recovery already installed. See [HTTP](/guide/http) and [gRPC](/guide/grpc).
- **Configuration** from a YAML file or Consul, with your own settings in the same document. See [Configuration](/guide/configuration).
- **Stores** configured by name: Redis, MySQL and PostgreSQL (`database/sql` and GORM), MongoDB, S3-compatible object storage. Instrumented, health-checked and closed on shutdown. See [Data stores](/stores/overview).
- **Observability**: OpenTelemetry tracing, Prometheus metrics, `log/slog` logging with trace correlation. See [Prometheus](/observability/prometheus), [Tracing](/observability/tracing) and [Logging](/observability/logging).
- **Operations**: `/healthz` and `/readyz` plus gRPC health on a separate admin port, and a [graceful shutdown](/guide/graceful-shutdown) that drains traffic and releases resources in order. See [Health checks](/observability/health).

## Requirements

Go 1.26 or newer.

## Installation

```bash
go get butterfly.orx.me/core
```

Next, the [Quick Start](/guide/quick-start).
