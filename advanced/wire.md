# Dependency Injection with Google Wire

Google Wire is a compile-time dependency injection tool for Go. It generates code for dependency injection at build time, making it safer and faster than runtime dependency injection.

## Setup

```bash
go get github.com/google/wire
go get github.com/google/wire/cmd/wire
```

## Provider Functions

Create provider functions that construct your dependencies:

```go
// internal/wire/providers.go
package wire

import (
    "context"
    
    "butterfly.orx.me/core/store/gorm"
    "butterfly.orx.me/core/store/redis"
    "butterfly.orx.me/core/log"
    "github.com/google/wire"
    gormDB "gorm.io/gorm"
    redisClient "github.com/redis/go-redis/v9"
)

func ProvideDatabase() (*gormDB.DB, error) {
    return gorm.NewDB("user:password@tcp(localhost:3306)/myapp?charset=utf8mb4")
}

func ProvideRedis() *redisClient.Client {
    return redis.GetClient("cache")
}

func ProvideLogger() *log.Logger {
    return log.FromContext(context.Background())
}

func ProvideUserRepository(db *gormDB.DB) *UserRepository {
    return &UserRepository{db: db}
}

func ProvideUserService(repo *UserRepository, cache *redisClient.Client, logger *log.Logger) *UserService {
    return &UserService{
        repo:   repo,
        cache:  cache,
        logger: logger,
    }
}

func ProvideUserHandler(service *UserService) *UserHandler {
    return &UserHandler{service: service}
}
```

## Service Layers

### Repository

```go
// internal/repository/user.go
package repository

import (
    "context"
    "gorm.io/gorm"
)

type User struct {
    gorm.Model
    Name     string `json:"name"`
    Email    string `json:"email"`
    Password string `json:"-"`
}

type UserRepository struct {
    db *gorm.DB
}

func (r *UserRepository) Create(ctx context.Context, user *User) error {
    return r.db.WithContext(ctx).Create(user).Error
}

func (r *UserRepository) GetByID(ctx context.Context, id uint) (*User, error) {
    var user User
    err := r.db.WithContext(ctx).First(&user, id).Error
    return &user, err
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*User, error) {
    var user User
    err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error
    return &user, err
}

func (r *UserRepository) Update(ctx context.Context, user *User) error {
    return r.db.WithContext(ctx).Save(user).Error
}

func (r *UserRepository) Delete(ctx context.Context, id uint) error {
    return r.db.WithContext(ctx).Delete(&User{}, id).Error
}
```

### Service

```go
// internal/service/user.go
package service

import (
    "context"
    "encoding/json"
    "fmt"
    "time"
    
    "butterfly.orx.me/core/log"
    "github.com/redis/go-redis/v9"
    "your-app/internal/repository"
)

type UserService struct {
    repo   *repository.UserRepository
    cache  *redis.Client
    logger *log.Logger
}

func (s *UserService) CreateUser(ctx context.Context, name, email string) (*repository.User, error) {
    s.logger.Info("creating user", "email", email)
    
    existing, _ := s.repo.GetByEmail(ctx, email)
    if existing != nil {
        return nil, fmt.Errorf("user with email %s already exists", email)
    }
    
    user := &repository.User{Name: name, Email: email}
    if err := s.repo.Create(ctx, user); err != nil {
        s.logger.Error("failed to create user", "error", err)
        return nil, err
    }
    
    s.cacheUser(ctx, user)
    return user, nil
}

func (s *UserService) GetUser(ctx context.Context, id uint) (*repository.User, error) {
    if cached := s.getCachedUser(ctx, id); cached != nil {
        return cached, nil
    }
    
    user, err := s.repo.GetByID(ctx, id)
    if err != nil {
        return nil, err
    }
    
    s.cacheUser(ctx, user)
    return user, nil
}
```

### Handler

```go
// internal/handler/user.go
package handler

import (
    "net/http"
    "strconv"
    
    "github.com/gin-gonic/gin"
    "your-app/internal/service"
)

type UserHandler struct {
    service *service.UserService
}

type CreateUserRequest struct {
    Name  string `json:"name" binding:"required"`
    Email string `json:"email" binding:"required,email"`
}

func (h *UserHandler) CreateUser(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    user, err := h.service.CreateUser(c.Request.Context(), req.Name, req.Email)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusCreated, user)
}

func (h *UserHandler) GetUser(c *gin.Context) {
    idStr := c.Param("id")
    id, err := strconv.ParseUint(idStr, 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
        return
    }
    
    user, err := h.service.GetUser(c.Request.Context(), uint(id))
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
        return
    }
    
    c.JSON(http.StatusOK, user)
}
```

## Wire Injector

```go
//go:build wireinject
// +build wireinject

// cmd/wire.go
package main

import (
    "github.com/google/wire"
    "your-app/internal/wire"
)

var AppSet = wire.NewSet(
    wire.ProvideDatabase,
    wire.ProvideRedis,
    wire.ProvideLogger,
    wire.ProvideUserRepository,
    wire.ProvideUserService,
    wire.ProvideUserHandler,
)

func InitializeApp() (*UserHandler, error) {
    wire.Build(AppSet)
    return &UserHandler{}, nil
}
```

Generate wire code:

```bash
cd cmd && wire
```

## Integration with Butterfly

```go
func main() {
    deps, err := InitializeAppDependencies()
    if err != nil {
        panic(err)
    }
    
    config := &app.Config{
        Service: "user-service",
        Router: func(r *gin.Engine) {
            setupRoutes(r, deps.UserHandler)
        },
        InitFunc: []func() error{
            deps.InitDatabase,
            deps.InitCache,
        },
        TeardownFunc: []func() error{
            deps.CloseDatabase,
            deps.CloseCache,
        },
    }
    
    application := app.New(config)
    application.Run()
}
```

## Advanced Patterns

### Interface-based Injection

```go
type UserRepositoryInterface interface {
    Create(ctx context.Context, user *User) error
    GetByID(ctx context.Context, id uint) (*User, error)
    GetByEmail(ctx context.Context, email string) (*User, error)
    Update(ctx context.Context, user *User) error
    Delete(ctx context.Context, id uint) error
}

func ProvideUserRepository(db *gorm.DB) UserRepositoryInterface {
    return &UserRepository{db: db}
}
```

### Options Pattern

```go
type UserServiceOptions struct {
    CacheTTL     time.Duration
    MaxRetries   int
    EnableAudit  bool
}

func ProvideUserServiceOptions() *UserServiceOptions {
    return &UserServiceOptions{
        CacheTTL:    time.Hour,
        MaxRetries:  3,
        EnableAudit: true,
    }
}

func ProvideUserServiceWithOptions(
    repo UserRepositoryInterface,
    cache *redis.Client,
    logger *log.Logger,
    opts *UserServiceOptions,
) UserServiceInterface {
    return &UserService{
        repo:        repo,
        cache:       cache,
        logger:      logger,
        cacheTTL:    opts.CacheTTL,
        maxRetries:  opts.MaxRetries,
        enableAudit: opts.EnableAudit,
    }
}
```

## Best Practices

1. **Group Related Providers**: Use `wire.NewSet` to group related providers
2. **Use Interfaces**: Define interfaces for better testability and flexibility
3. **Separate Concerns**: Keep providers focused on single responsibilities
4. **Error Handling**: Always handle errors from providers properly
5. **Configuration**: Use configuration structs for flexible setup
6. **Testing**: Create separate Wire sets for testing with mocks
