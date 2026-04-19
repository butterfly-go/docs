# Application Structure

## App Config

The `app.Config` struct is the central configuration for your application:

```go
config := &app.Config{
    Service:   "user-service",
    Namespace: "my-namespace",
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
```

## Custom Configuration

Define a custom configuration struct that will be populated from your YAML config:

```go
type MyConfig struct {
    APIKey     string `yaml:"api_key"`
    MaxRetries int    `yaml:"max_retries"`
}

func (c *MyConfig) Print() {
    // Implement configuration printing logic
}
```

## Route Setup

```go
func setupHTTPRoutes(r *gin.Engine) {
    // API route group
    api := r.Group("/api/v1")
    {
        api.GET("/users", listUsers)
        api.GET("/users/:id", getUser)
        api.POST("/users", createUser)
        api.PUT("/users/:id", updateUser)
        api.DELETE("/users/:id", deleteUser)
    }
    
    // Health checks
    r.GET("/health", healthCheck)
    r.GET("/ready", readinessCheck)
}
```

## gRPC Setup

```go
func setupGRPCServer(s *grpc.Server) {
    // Register gRPC services
    pb.RegisterUserServiceServer(s, &userServiceServer{})
}
```

## Complete Example

```go
package main

import (
    "context"
    "fmt"
    "net/http"
    "time"
    "log/slog"
    
    "butterfly.orx.me/core/app"
    "butterfly.orx.me/core/log"
    "butterfly.orx.me/core/store/gorm"
    "butterfly.orx.me/core/store/redis"
    "github.com/gin-gonic/gin"
    gormDriver "gorm.io/gorm"
)

var (
    db     *gormDriver.DB
    cache  *redis.Client
    logger = slog.With("service", "user-service")
)

type User struct {
    gormDriver.Model
    Name     string `json:"name" binding:"required"`
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"-"`
}

type Config struct {
    JWTSecret string `yaml:"jwt_secret"`
    MaxUsers  int    `yaml:"max_users"`
}

func (c *Config) Print() {
    logger.Info("config loaded", 
        "max_users", c.MaxUsers,
    )
}

func main() {
    config := &app.Config{
        Service: "user-service",
        Config:  &Config{},
        Router:  setupRoutes,
        InitFunc: []func() error{
            initDB,
            initCache,
        },
    }
    
    app := app.New(config)
    app.Run()
}

func initDB() error {
    var err error
    db, err = gorm.NewDB("root:password@tcp(localhost:3306)/users?charset=utf8mb4")
    if err != nil {
        return fmt.Errorf("failed to connect database: %w", err)
    }
    return db.AutoMigrate(&User{})
}

func initCache() error {
    cache = redis.GetClient("cache")
    if cache == nil {
        logger.Warn("cache not configured")
    }
    return nil
}

func setupRoutes(r *gin.Engine) {
    r.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{"status": "healthy"})
    })
    
    api := r.Group("/api/v1")
    {
        api.GET("/users", listUsers)
        api.GET("/users/:id", getUser)
        api.POST("/users", createUser)
        api.PUT("/users/:id", updateUser)
        api.DELETE("/users/:id", deleteUser)
    }
}
```
