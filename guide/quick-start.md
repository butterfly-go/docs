# Quick Start

## Basic Application Example

```go
package main

import (
    "github.com/gin-gonic/gin"
    "butterfly.orx.me/core/app"
)

func main() {
    // Create application configuration
    config := &app.Config{
        Service:   "my-service",
        Namespace: "my-namespace", // optional namespace prefix for config key
        Router: func(r *gin.Engine) {
            r.GET("/ping", func(c *gin.Context) {
                c.JSON(200, gin.H{"message": "pong"})
            })
        },
    }
    
    // Create and run application
    application := app.New(config)
    application.Run()
}
```

## Creating a Complete Application

```go
package main

import (
    "context"
    "net/http"
    
    "butterfly.orx.me/core/app"
    "butterfly.orx.me/core/store/mongo"
    "butterfly.orx.me/core/store/redis"
    "butterfly.orx.me/core/store/gorm"
    "github.com/gin-gonic/gin"
    "google.golang.org/grpc"
    pb "your-service/proto"
)

// Custom configuration structure
type MyConfig struct {
    APIKey     string `yaml:"api_key"`
    MaxRetries int    `yaml:"max_retries"`
}

func (c *MyConfig) Print() {
    // Implement configuration printing logic
}

func main() {
    config := &app.Config{
        Service:   "user-service",
        Namespace: "my-namespace", // optional: config key becomes "my-namespace/user-service"
        Config:    &MyConfig{},
        
        // HTTP route registration
        Router: setupHTTPRoutes,
        
        // gRPC service registration
        GRPCRegister: setupGRPCServer,
        
        // Initialization functions
        InitFunc: []func() error{
            initDatabase,
            initCache,
            initMessageQueue,
        },
        
        // Teardown functions
        TeardownFunc: []func() error{
            closeDatabase,
            closeCache,
        },
    }
    
    app := app.New(config)
    app.Run()
}
```

## Initialization Flow

When `app.Run()` is called, the following happens automatically:

1. **Config & Store connections** — config backend (File or Consul) is created, YAML is parsed, and all configured store clients (Redis, MongoDB, SQL, S3) are initialized
2. **App config** — your custom config struct is unmarshaled from the same YAML
3. **Logging** — `slog` is configured based on `log` section (level, format, source)
4. **Metrics** — Prometheus registry and OTEL meter provider are set up, metrics endpoint starts on `:2223`
5. **Tracing** — OTEL tracer provider is configured (gRPC or HTTP exporter)
6. **Custom InitFunc** — your user-defined initialization functions run
7. **Servers** — HTTP server starts on `:8080`, gRPC server on `:9090` (if configured)

Store connections include automatic cleanup — if initialization fails partway through, already-created connections are properly closed.
