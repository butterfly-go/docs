# Deployment

## Docker

```dockerfile
FROM golang:1.25-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o service .

FROM alpine:latest
RUN apk --no-cache add ca-certificates

WORKDIR /root/
COPY --from=builder /app/service .
COPY config.yaml .

CMD ["./service"]
```

## Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: your-registry/user-service:latest
        ports:
        - containerPort: 8080  # HTTP
        - containerPort: 9090  # gRPC
        - containerPort: 2223  # Metrics
        env:
        - name: BUTTERFLY_CONFIG_TYPE
          value: "consul"
        - name: BUTTERFLY_CONFIG_CONSUL_ADDRESS
          value: "consul:8500"
        - name: BUTTERFLY_TRACING_ENDPOINT
          value: "otel-collector:4318"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Graceful Shutdown

The framework automatically handles graceful shutdown. Register cleanup functions via `TeardownFunc`:

```go
config := &app.Config{
    Service: "my-service",
    TeardownFunc: []func() error{
        func() error {
            sqlDB, _ := db.DB()
            return sqlDB.Close()
        },
        func() error {
            return messageQueue.Close()
        },
    },
}
```

## Performance Optimization

1. **Database Connection Pool**
   ```go
   sqlDB, _ := db.DB()
   sqlDB.SetMaxIdleConns(10)
   sqlDB.SetMaxOpenConns(100)
   sqlDB.SetConnMaxLifetime(time.Hour)
   ```

2. **Caching Strategy**
   - Implement multi-level caching
   - Use Redis as distributed cache
   - Set reasonable cache expiration times

3. **Enable gzip Compression**
   ```go
   import "github.com/gin-contrib/gzip"
   
   r.Use(gzip.Gzip(gzip.DefaultCompression))
   ```

4. **Connection Pools** for HTTP clients, databases, and Redis
