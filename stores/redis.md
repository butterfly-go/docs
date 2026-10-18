# Redis

## Configuration

```yaml
store:
  redis:
    cache:
      addr: "localhost:6379"
      password: ""
      db: 0
```

The key (`cache`, `main`, ...) is the name you pass to the getter. See [Data stores](/stores/overview) for behavior shared by all stores, and the [configuration reference](/guide/configuration#core-configuration-reference) for every option.

## Usage

```go
import (
    "context"
    "encoding/json"
    "errors"
    "time"

    "butterfly.orx.me/core/store/redis"
    goredis "github.com/redis/go-redis/v9"
)

func getUserFromCache(ctx context.Context, id string) (*User, error) {
    // "cache" is store.redis.cache in the configuration file.
    client := redis.GetClient("cache")

    val, err := client.Get(ctx, "user:"+id).Result()
    if errors.Is(err, goredis.Nil) {
        return nil, nil // cache miss
    }
    if err != nil {
        return nil, err
    }

    var user User
    if err := json.Unmarshal([]byte(val), &user); err != nil {
        return nil, err
    }
    return &user, nil
}

func setUserCache(ctx context.Context, user *User) error {
    data, err := json.Marshal(user)
    if err != nil {
        return err
    }
    return redis.GetClient("cache").Set(ctx, "user:"+user.ID, data, time.Hour).Err()
}
```

`redis.Nil` is not exported by the framework. Import go-redis for it, as above.
