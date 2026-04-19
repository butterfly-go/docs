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

## Initialization Function Chain

The framework uses a function chain pattern to manage the initialization process:

```
1. config.Init()           // Initialize configuration system
2. app.InitAppConfig()     // Load application configuration
3. config.CoreConfigInit() // Initialize core configuration
4. config.LogInit()        // Initialize logging (level, format, source)
5. metric.Init()           // Initialize Prometheus metrics
6. tracing.Init()          // Initialize OpenTelemetry tracing
7. store.Init()            // Initialize storage connections (Redis, SQL, MongoDB, S3)
8. Custom InitFunc         // User-defined initialization
```
