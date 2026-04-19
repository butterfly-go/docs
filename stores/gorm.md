# GORM (MySQL)

GORM connections are created manually via `NewDB()` and managed by the application. The framework automatically integrates OpenTelemetry tracing plugin for GORM queries.

## Setup

```go
import (
    "butterfly.orx.me/core/store/gorm"
)

func initDatabase() error {
    db, err := gorm.NewDB("user:password@tcp(localhost:3306)/dbname?charset=utf8mb4")
    if err != nil {
        return err
    }
    
    // Auto migrate
    db.AutoMigrate(&User{}, &Order{})
    
    // Store to global variable or dependency injection container
    database = db
    return nil
}
```

## Usage Example

```go
func createUser(c *gin.Context) {
    var user User
    if err := c.ShouldBindJSON(&user); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    if err := database.Create(&user).Error; err != nil {
        c.JSON(500, gin.H{"error": "failed to create user"})
        return
    }
    
    c.JSON(201, user)
}
```

## Connection Pool Configuration

```go
sqlDB, _ := db.DB()
sqlDB.SetMaxIdleConns(10)
sqlDB.SetMaxOpenConns(100)
sqlDB.SetConnMaxLifetime(time.Hour)
```

## Multiple Databases

Define multiple database connections in the configuration file:

```yaml
store:
  db:
    primary:
      host: "primary.db.com"
      port: 3306
      user: "app"
      password: "secret"
      db_name: "main"
    analytics:
      host: "analytics.db.com"
      port: 3306
      user: "reader"
      password: "secret"
      db_name: "analytics"
```

Use by key when accessing:

```go
primaryDB := sqldb.GetDB("primary")
analyticsDB := sqldb.GetDB("analytics")
```
