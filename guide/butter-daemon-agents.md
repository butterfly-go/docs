# Butter: daemon remote agents

[Butter](https://github.com/orvice/butter) is an AI agent orchestration service built on Butterfly. It can delegate work to **daemon clients**: long-lived gRPC connections from machines behind NAT (for example a developer laptop) that execute tasks with local tools while Telegram, HTTP, and other channels stay on the central server.

This page summarizes the daemon execution path introduced in [Butter PR #19](https://github.com/orvice/butter/pull/19) (gRPC `DaemonConnectorService`, `butter-daemon`, and `DAEMON` remote-agent protocol).

## Architecture

1. **Butter server** listens for daemon gRPC on `grpc_port` (YAML `grpc_port`, default **9090**). It registers [`DaemonConnectorService`](https://github.com/orvice/butter/blob/main/proto/agents/v1/daemon.proto) and tracks connected daemons in an in-memory registry.
2. **`butter-daemon`** dials the server, opens the bidirectional `Connect` stream, sends `DaemonInfo` (id, name, **capabilities**, optional labels), then exchanges task assignments and `DaemonTaskUpdate` messages until the stream ends. It reconnects with exponential backoff.
3. **Agent configuration** references a `remote_agents` entry whose protocol is **DAEMON**. The server routes invocations to a daemon that advertised a matching **capability** (same string as `daemon_capability` on the remote agent).

When `apiToken` is set in Butter config, the daemon must send gRPC metadata `Authorization: Bearer <token>` (same token as the HTTP API). If `apiToken` is empty, the daemon stream is not authenticated at the gateway.

## Server configuration

In the Butter YAML config (loaded via `BUTTERFLY_CONFIG_FILE_PATH`):

```yaml
# Optional; defaults to 9090 when omitted or zero.
grpc_port: 9090

# When non-empty, required on daemon gRPC metadata (Bearer) and HTTP API routes.
apiToken: ""

remote_agents:
  - id: "local-coder"
    name: "Laptop OpenCode"
    # url is required for A2A; unused for DAEMON.
    url: ""
    protocol: 2  # REMOTE_AGENT_PROTOCOL_DAEMON
    daemon_capability: "opencode"
```

Use `daemon_capability` values that match a capability your `butter-daemon` registers. The reference client always registers **`opencode`** and **`shell`** (see `cmd/butter-daemon`).

## Wiring an agent to a daemon

In an agent’s `config`, set `remote_agent_ids` to the `id` of a `DAEMON` remote agent (same pattern as A2A remotes):

```yaml
agents:
  - name: coding-assistant
    description: "Runs coding work on a connected daemon"
    type: 1
    config:
      model: "flash"
      instruction: "You delegate implementation to your remote coding agent when asked."
      remote_agent_ids: ["local-coder"]
```

At runtime Butter builds an ADK agent bridge (`internal/runtime/daemon`) that sends `DaemonTask` messages on the stream and maps streaming updates back into the orchestration flow.

## `butter-daemon` client

Build or run the `cmd/butter-daemon` binary. It reads a YAML file (default path `daemon.yaml`, overridable with `-config`):

```yaml
server: "127.0.0.1:9090"   # host:port of Butter gRPC listener
token: ""                  # same as apiToken when the server enforces it
daemon_id: "my-laptop"     # optional; defaults to hostname when empty
name: "Dev machine"

labels: {}   # reserved for future routing; not used for selection in phase 1

executors:
  opencode:
    work_dir: "/path/to/repo"
    binary: "opencode"     # optional; defaults to "opencode" on PATH
  shell:
    work_dir: "/tmp"
```

The process uses **insecure** transport today (`grpc.WithTransportCredentials(insecure.NewCredentials())`); run behind mutual trust (VPN, SSH tunnel, or future TLS) as appropriate for your environment.

## Related protobuf

Definitions live under `proto/agents/v1/` in the Butter repository:

- `daemon.proto` — `DaemonConnectorService`, `DaemonInfo`, `DaemonTask`, `DaemonTaskUpdate`, and task status enum.
- `agent.proto` — `RemoteAgentProtocol` includes `REMOTE_AGENT_PROTOCOL_DAEMON`; `RemoteAgent.daemon_capability` selects the executor capability.

For deeper design notes, see Butter’s internal `docs/design-daemon-agent.md` in the same repository.
