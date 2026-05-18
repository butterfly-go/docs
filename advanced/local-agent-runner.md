# Local Agent Runner

本文记录 Butter 接入本地 CLI 型 agent 的推荐方案，目标场景是让一种新的 agent 直接调用用户机器或内网环境里的 `codex`、`opencode` 等 CLI。

## 结论

推荐沿用现有 daemon 能力，把它产品化为 `butter-agent` 这一类本地 agent runner，而不是为 `codex`、`opencode` 重新增加一套 server 协议或新的 `AgentType`。

整体模型可以看作 C/S 架构，更准确地说是“server 控制面 + 本地 agent runner 客户端”：

- server 负责 agent 配置、任务调度、入口适配、权限和状态管理。
- `butter-agent` 运行在用户机器、个人电脑或内网环境中，主动连接 server。
- 本地 runner 注册自己支持的 capability，例如 `codex`、`opencode`。
- server 将任务路由到具备对应 capability 的 runner。
- runner 在本地调用 CLI，并把进度和最终结果回传给 server。

这种反连模式不要求 server 直接访问用户本地机器，适合 NAT、内网、本地凭证和本地 CLI 场景。

## 现有基础

Butter 当前已经具备接入本地 CLI 型 agent 的主干能力：

- server 侧支持 `RemoteAgent.protocol = DAEMON`，并通过 `daemon_capability` 路由到已连接的 daemon。
- runner 构建链路已经能把 daemon agent 包装成 ADK sub-agent 使用。
- daemon gRPC 长连接已经支持 capability 注册、任务下发、取消、进度更新和结果回传。
- client 侧已有 executor 机制，当前 `opencode` executor 可以作为接入新 CLI 的样板。

因此，接入 `codex` 这类新 agent 时，优先复用 daemon bridge 和 capability 路由。

## 推荐架构

```text
User entry
  └─ HTTP / Telegram / Discord / Cron
      └─ Butter server
          └─ RemoteAgent(protocol=DAEMON, daemon_capability="codex")
              └─ butter-agent
                  └─ CodexExecutor
                      └─ local codex CLI
```

server 只关心 `RemoteAgent` 和 capability，不感知具体 CLI 的参数、认证和本地执行细节。CLI 差异应封装在 `butter-agent` 的 executor 中。

## 最小实现路径

1. 保持 server 侧协议不变，继续使用 `RemoteAgent(protocol=DAEMON)`。
2. 新增 `cmd/butter-agent`，作为面向用户运行的本地 agent runner。
3. 将现有 daemon 连接、注册、任务接收、取消处理等逻辑下沉到可复用的内部包。
4. 在 runner 中引入按配置启用的 executor，例如 `codex`、`opencode`。
5. 新增 `CodexExecutor`：
   - `Capability()` 返回 `codex`。
   - `Execute(ctx, task, onUpdate)` 使用 `exec.CommandContext` 调用本地 `codex` CLI。
   - stdout 可增量回传给 `onUpdate`，最终输出作为任务结果返回。
6. 后台配置一个 daemon remote agent：
   - `protocol = REMOTE_AGENT_PROTOCOL_DAEMON`
   - `daemon_capability = "codex"`
7. 目标业务 agent 通过 `remote_agent_ids` 引用该 remote agent。

## `butter-agent` 与 `butter-daemon`

建议拆出 `butter-agent` cmd，但它应是现有 daemon 机制的产品化和命名优化，不是新协议。

当前 `cmd/butter-daemon` 混合了承载本地 agent runner 所需的多类职责：

- 连接 server。
- 注册 capabilities。
- 接收和取消任务。
- 管理 executor。
- 内置 `opencode`、`shell` 等具体执行器。

随着 `codex`、`opencode` 和自定义 CLI agent 增多，`butter-agent` 更适合作为对外入口。`butter-daemon` 可以保留为兼容入口，或者逐步变成 `butter-agent` 的 alias。

## 配置建议

本地配置应描述 runner 连接 server 所需的信息，以及启用哪些 executor。示例：

```yaml
server:
  address: "https://butter.example.com"
  token: "${BUTTER_AGENT_TOKEN}"

agents:
  codex:
    enabled: true
    binary: "codex"
    work_dir: "/workspace"
    args:
      - "--approval-policy"
      - "never"
  opencode:
    enabled: true
    binary: "opencode"
    work_dir: "/workspace"
```

server 侧的 `RemoteAgent` 保持简洁，只保存协议和 capability。CLI 参数、工作目录、sandbox、approval 策略和本地凭证都应留在本地 runner 配置中，避免污染 server 侧 agent model。

## Executor 设计原则

- server 不特判 `codex` 或 `opencode`，只通过 capability 路由。
- 每种 CLI 都实现同一个 executor 接口。
- 先实现同步命令和 stdout 增量回传，保证端到端路径简单可用。
- stderr、退出码、超时、输出截断和取消语义应在 executor 层统一处理。
- 后续可以抽出通用 CLI executor，`codex`、`opencode` 只提供参数构造和结果解析逻辑。

## 风险与后续优化

- 当前 bridge 更偏同步等待最终结果，长任务体验依赖入口侧是否能透传中间 update。
- capability 查找如果只取第一个可用 runner，后续需要补充负载均衡、标签路由或队列能力。
- 本地 CLI 输出可能很长，需要明确截断、分页或附件化策略。
- 本地凭证和执行权限应只存在 runner 所在环境，server 不应持有这些敏感信息。
- 任务取消要映射到进程取消，避免本地 CLI 在 server 任务结束后继续运行。

## 推荐落地顺序

1. 先把现有 daemon client 逻辑整理成可被 `butter-agent` 复用的内部包。
2. 新增 `cmd/butter-agent`，默认兼容当前 daemon 注册和任务协议。
3. 将 executor 注册改为配置驱动。
4. 基于现有 `opencode` 样板实现 `CodexExecutor`。
5. 配置 `RemoteAgent(protocol=DAEMON, daemon_capability=codex)` 跑通端到端。
6. 再优化流式 update、负载均衡、超长输出和统一 CLI executor。
