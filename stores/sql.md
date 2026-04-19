# Native SQL Database

## Configuration

```yaml
store:
  db:
    main:
      host: "localhost"
      port: 3306
      user: "root"
      password: "password"
      db_name: "myapp"
```

## Usage

```go
import (
    "butterfly.orx.me/core/store/sqldb"
    "database/sql"
)

// Get native SQL connection
func getDB() *sql.DB {
    // "main" corresponds to store.db.main in configuration file
    return sqldb.GetDB("main")
}

// Use native SQL
func getUserBySQL(id int) (*User, error) {
    db := getDB()
    
    var user User
    err := db.QueryRow(
        "SELECT id, name, email FROM users WHERE id = ?", 
        id,
    ).Scan(&user.ID, &user.Name, &user.Email)
    
    if err != nil {
        return nil, err
    }
    
    return &user, nil
}
```
