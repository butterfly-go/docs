# Redis

## Configuration

```yaml
store:
  redis:
    cache:
      addr: "localhost:6379"
      password: ""
      db: 0
    session:
      addr: "localhost:6380"
      password: ""
      db: 1
```

## Usage

```go
import (
    "butterfly.orx.me/core/store/redis"
    "encoding/json"
)

// Get Redis client
func getCacheClient() *redis.Client {
    // "cache" corresponds to store.redis.cache in configuration file
    return redis.GetClient("cache")
}
```

## Cache Example

```go
func getUserFromCache(userId string) (*User, error) {
    client := getCacheClient()
    
    // Try to get from cache
    val, err := client.Get(context.Background(), "user:"+userId).Result()
    if err == redis.Nil {
        return nil, nil // Cache miss
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

// Set cache
func setUserCache(user *User) error {
    client := getCacheClient()
    
    data, err := json.Marshal(user)
    if err != nil {
        return err
    }
    
    return client.Set(context.Background(), 
        "user:"+user.ID, 
        data, 
        time.Hour,
    ).Err()
}
```
