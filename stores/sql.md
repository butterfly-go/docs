# Native SQL

## Configuration

```yaml
store:
  db:
    main:
      driver: "mysql"        # mysql (default), or postgres
      host: "localhost"
      port: 3306
      user: "root"
      password: "password"
      db_name: "myapp"
      ssl_mode: "disable"    # PostgreSQL only
```

The key (`cache`, `main`, ...) is the name you pass to the getter. See [Data stores](/stores/overview) for behavior shared by all stores, and the [configuration reference](/guide/configuration#core-configuration-reference) for every option.

## Usage

`store.db.<name>` supports MySQL and PostgreSQL (`driver: mysql` or `postgres`). `sqldb.GetDB` returns the standard `*sql.DB`:

```go
import (
    "context"

    "butterfly.orx.me/core/store/sqldb"
)

func getUser(ctx context.Context, id int) (*User, error) {
    db := sqldb.GetDB("main") // store.db.main

    var user User
    err := db.QueryRowContext(ctx,
        "SELECT id, name, email FROM users WHERE id = ?", id, // use $1 on PostgreSQL
    ).Scan(&user.ID, &user.Name, &user.Email)
    if err != nil {
        return nil, err
    }
    return &user, nil
}
```
