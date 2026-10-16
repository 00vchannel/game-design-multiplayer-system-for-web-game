---
name: game-design-multiplayer-system-for-web-game-00vchannel
description: "Add or debug 2–4 player multiplayer in a browser game using a host-owned simulation and a Cloudflare relay. Includes a runnable starter, integration contracts, background-tab handling, disconnect cleanup, and round synchronization. Use for Canvas or Three.js games; preserve the user's gameplay."
---

# Game design: Multiplayer system for web game 00vchannel

by Deep Frame Studio

Use the user's gameplay request with the included multiplayer foundation. The desktop host simulates the game; Cloudflare Workers and SQLite Durable Objects relay messages. This is not direct peer-to-peer networking or a cloud-hosted game simulation. Guests may join from desktop or mobile browsers. Hosting allowances have limits.

## Start here

1. Inspect the existing project and request. Preserve decisions already made. Ask only for missing details that materially change gameplay or integration. Installing this skill alone is not permission to build or deploy a game. If gameplay needs exploration, use a brainstorming skill only when available and relevant; it is not a prerequisite.
2. Read [integration contracts](references/integration.md). For a new project, use this installed skill's `assets/starter`. For an existing game, compare its networking version and merge only required changes. An older downloaded starter may differ from the installed skill; never replace the entire game to update it.
3. Save the pre-change state. Identify inputs, shared state, interactions, win/loss, and rendering. Usually gameplay work belongs in `src/game/adapter.js`, `src/main.js`, and presentation files. Preserve `src/net`, `shared/protocol.js`, and `worker/index.js` unless a diagnosed problem requires changing them.
4. Keep the existing package versions and lockfile. Follow the starter README to run both the frontend and the local relay. A Vite page alone does not demonstrate working multiplayer. When verification is needed or requested, use [verification scenarios](references/verification.md); a successful build does not prove runtime behavior.
5. Read [deployment guidance](references/deployment.md) only when deploying. Use the user's account and authorized scope. Installing a skill or logging in does not authorize publication. Do not enable paid services.

## Networking invariants

- Only the host owns shared game state. Guests send actions, not authoritative scores, item ownership, or world snapshots. Bind player identity to the server-side socket, not a client-supplied ID.
- Run fixed-step simulation in `host.worker.js`. Use `requestAnimationFrame` only for rendering. Gameplay adapters must not access the DOM, `window`, Three.js objects, or network APIs.
- On `visibilitychange` or `blur`, clear inputs without closing the room or declaring the host gone. Operating systems may suspend workers; limit catch-up work after waking and wait for fresh heartbeats. Do not use fake audio, disable power saving, or repeatedly reload as a workaround.
- End rooms for actual departure, closed connections, connection failure, or expiry. The starter has no host migration, reconnect-after-refresh, or offline continuation; do not promise these features.
- Isolate rounds with `round`, snapshots with `revision`, and repeated inputs with `seq`. Reset only after receiving the server's new round. Do not carry old items, timers, inputs, or sequence numbers into a new game.
- Expire stale movement inputs. Send one interaction per press, not every frame while held. Release keyboard and touch inputs on release, cancellation, or loss of focus.
- Resolve contested objects synchronously in one host `applyInput`: check then mutate without `await` between them. In `syncPlayers`, return disconnected players' held objects to an accessible location.
- Keep shared data bounded and JSON-serializable. Reject NaN, Infinity, cycles, scene objects, audio, materials, and image data. Send identifiers and gameplay values. Update `validateState` with schema changes; never remove validation to hide errors.
- Keep admission, capacity, rounds, room phases, and forwarding in the relay. Keep gameplay ticks on the host. Preserve hibernating WebSockets, attachment recovery, SQLite migrations, and message/rate limits.

## Debugging and completion

Read [troubleshooting](references/troubleshooting.md) for the observed failure. Do not switch platforms, add unrelated MCP servers, disable origin checks, or rewrite the whole system to fix one symptom.

Respond in the user's language. Distinguish files installed, skill loaded, local multiplayer verified, and public-network behavior verified. Updating the skill never updates an existing game's networking automatically. The portable identifier ends in `-00vchannel`; agent menus may show that identifier instead of the display title. Technical references include Traditional Chinese and may be explained in the user's language.
