# GORM (MySQL)

## Configuration

```yaml
store:
  db:
    main:
      driver: "mysql"        # GORM handles are created for MySQL entries only
      host: "localhost"
      port: 3306
      user: "root"
      password: "password"
      db_name: "myapp"
```

The key (`cache`, `main`, ...) is the name you pass to the getter. See [Data stores](/stores/overview) for behavior shared by all stores, and the [configuration reference](/guide/configuration#core-configuration-reference) for every option.

## Usage

For a `store.db` entry whose driver is MySQL, the framework also builds a GORM handle on the same connection pool, with the tracing plugin installed. Get it with `gorm.GetDB`. It is not created for PostgreSQL entries, so `GetDB` returns `nil` for them. Use `sqldb.GetDB` there.

```go
import (
    "context"
    "errors"

    "butterfly.orx.me/core/store/gorm"
)

func createUser(ctx context.Context, user *User) error {
    db := gorm.GetDB("main") // store.db.main
    return db.WithContext(ctx).Create(user).Error
}

func findUser(ctx context.Context, id uint) (*User, error) {
    var user User
    err := gorm.GetDB("main").WithContext(ctx).First(&user, id).Error
    if errors.Is(err, gorm.ErrRecordNotFound) {
        return nil, nil
    }
    return &user, err
}
```

The `gorm` package re-exports the commonly used GORM types (`DB`, `Model`, `DeletedAt`, ...) and errors (`ErrRecordNotFound`, `ErrDuplicatedKey`, ...), so you usually do not need to import `gorm.io/gorm` yourself. Run migrations from an `InitFunc`:

```go
InitFunc: []func() error{
    func() error { return gorm.GetDB("main").AutoMigrate(&User{}) },
},
```

If you want a GORM connection that is not in the configuration file, `gorm.NewDB(dsn)` opens a MySQL connection with tracing and pool metrics. The framework does not close those. You own them.
