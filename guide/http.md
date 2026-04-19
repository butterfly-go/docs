# HTTP Service

## Gin Framework Integration

The framework integrates the Gin Web framework by default and automatically configures the following features:

- Disabled default logging (using framework logging system)
- Recovery middleware
- OpenTelemetry tracing middleware

```go
func setupHTTPRoutes(r *gin.Engine) {
    // Add custom middleware
    r.Use(customAuthMiddleware())
    
    // Register routes
    r.GET("/", homeHandler)
    
    // API versioning
    v1 := r.Group("/api/v1")
    v1.Use(rateLimitMiddleware())
    {
        v1.GET("/resources", listResources)
        v1.POST("/resources", createResource)
    }
}

func homeHandler(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{
        "service": "user-service",
        "version": "1.0.0",
    })
}
```

## Twirp RPC Support

The framework provides convenient registration methods for Twirp RPC:

```go
import (
    "butterfly.orx.me/core/utils/httputils"
    "your-service/rpc/userservice"
)

func setupHTTPRoutes(r *gin.Engine) {
    // Create Twirp service
    twirpServer := userservice.NewUserServiceServer(
        &userServiceImpl{},
        nil, // hooks
    )
    
    // Register Twirp handler
    httputils.RegisterTwirpHandler(r, "/twirp/", twirpServer)
}
```

## Error Handling Middleware

```go
func errorHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next()
        
        if len(c.Errors) > 0 {
            err := c.Errors.Last()
            
            logger := log.FromContext(c.Request.Context())
            logger.Error("request failed", 
                "path", c.Request.URL.Path,
                "method", c.Request.Method,
                "error", err.Error(),
            )
            
            c.JSON(500, gin.H{
                "error": "internal server error",
            })
        }
    }
}
```
