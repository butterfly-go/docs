# Testing

## Unit Test Example

```go
package main

import (
    "net/http"
    "net/http/httptest"
    "testing"
    
    "butterfly.orx.me/core/app"
    "github.com/gin-gonic/gin"
    "github.com/stretchr/testify/assert"
)

func TestPingRoute(t *testing.T) {
    gin.SetMode(gin.TestMode)
    
    config := &app.Config{
        Service: "test-service",
        Router: func(r *gin.Engine) {
            r.GET("/ping", func(c *gin.Context) {
                c.JSON(200, gin.H{"message": "pong"})
            })
        },
    }
    
    router := gin.New()
    config.Router(router)
    
    w := httptest.NewRecorder()
    req, _ := http.NewRequest("GET", "/ping", nil)
    
    router.ServeHTTP(w, req)
    
    assert.Equal(t, 200, w.Code)
    assert.Contains(t, w.Body.String(), "pong")
}
```

## Mock Logger (testsuite)

The framework provides a mock logger for capturing and asserting log output in unit tests:

```go
import (
    "testing"
    "log/slog"
    
    "butterfly.orx.me/core/testsuite"
)

func TestUserCreation(t *testing.T) {
    // Create mock logger and capture helper
    logger, mockLog := testsuite.NewMockLog()
    
    // Pass logger directly to code under test
    service := NewUserService(logger)
    service.CreateUser("test@example.com")
    
    // Assert log output
    if !mockLog.ContainsMessage("user created") {
        t.Error("expected 'user created' log message")
    }
    
    // Check specific log levels
    if mockLog.CountLevel(slog.LevelError) > 0 {
        t.Error("unexpected error logs")
    }
    
    // Get all messages
    messages := mockLog.Messages()
    t.Logf("logged messages: %v", messages)
    
    // Get full entries with attributes
    entries := mockLog.Entries()
    for _, entry := range entries {
        t.Logf("level=%s msg=%s attrs=%v", entry.Level, entry.Message, entry.Attrs)
    }
    
    // Reset between test cases
    mockLog.Reset()
}

func TestWithDefaultLogger(t *testing.T) {
    _, mockLog := testsuite.NewMockLog()
    
    // Set as the default slog logger (returns restore function)
    restore := mockLog.SetAsDefault()
    defer restore()
    
    // Any code using slog.Default() will now be captured
    slog.Info("this will be captured")
    
    if !mockLog.ContainsMessage("this will be captured") {
        t.Error("message not captured")
    }
}
```

## Testing with Wire

Wire makes testing easier by allowing you to swap implementations:

```go
// test/wire_test.go
//go:build wireinject
// +build wireinject

package test

import (
    "github.com/google/wire"
    "your-app/internal/test/mocks"
)

var TestSet = wire.NewSet(
    mocks.ProvideMockDatabase,
    mocks.ProvideMockRedis,
    mocks.ProvideMockLogger,
    wire.ProvideUserRepository,
    wire.ProvideUserService,
    wire.ProvideUserHandler,
)

func InitializeTestApp() (*UserHandler, error) {
    wire.Build(TestSet)
    return &UserHandler{}, nil
}
```
