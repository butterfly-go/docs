# Prometheus Metrics

The framework automatically exposes the `/metrics` endpoint on port 2223.

## Custom Metrics

```go
import (
    "butterfly.orx.me/core/observe/otel"
    "github.com/prometheus/client_golang/prometheus"
)

// Get Prometheus registry
registry := otel.PrometheusRegistry()

// Register custom metrics
var (
    requestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "http_request_duration_seconds",
            Help: "HTTP request latencies in seconds.",
        },
        []string{"method", "endpoint", "status"},
    )
    
    activeUsers = prometheus.NewGauge(
        prometheus.GaugeOpts{
            Name: "active_users_total",
            Help: "Number of active users.",
        },
    )
)

func init() {
    registry.MustRegister(requestDuration)
    registry.MustRegister(activeUsers)
}
```

## Using Metrics in Middleware

```go
func measureRequest(c *gin.Context) {
    start := time.Now()
    
    c.Next()
    
    duration := time.Since(start).Seconds()
    requestDuration.WithLabelValues(
        c.Request.Method,
        c.FullPath(),
        fmt.Sprintf("%d", c.Writer.Status()),
    ).Observe(duration)
}
```

## Accessing Metrics

```bash
curl http://localhost:2223/metrics
```
