# Privacy and security review

## Data flow and network boundary

The MCP transport is stdin/stdout. The host starts Node as a local child process. The sole model-facing operation is `analyze_video(path, question)`.

The source is checked against an owner-selected folder, canonicalized, opened and copied to an isolated temporary directory. ffprobe reads metadata. FFmpeg decodes six selected frames by default. JPEGs and the question go to the configured LM Studio port at literal `127.0.0.1`. The response's final text goes back to the host. Frames are not returned as tool attachments.

No DNS, external endpoint setting, proxy lookup, redirect following, remote MCP transport, telemetry, update checker, shell interpreter, or automatic dependency download exists in the runtime. FFmpeg receives separate argument-array entries, never a shell command. Forced demuxers exclude playlists/concat manifests; only `file` protocol is enabled, with MOV external data references disabled. The account owner controls the executable paths and must trust those executables.

An optional LM Studio token is read only from `LM_STUDIO_API_TOKEN` and placed in the Authorization header for loopback requests. It is not logged or printed by diagnostics. Missing/invalid credentials cause a generic error. The token and the unencrypted loopback request are still accessible to appropriately privileged local software.

LM Studio, the host chat, third-party filesystem tools, model downloads and application updates have independent logging/network behavior. This package cannot guarantee that the rest of a user's environment is offline. With local LM Studio inference and no forwarding integrations, its video-analysis data path stays on the computer.

## Restrictions and tests

- Exact argument allowlist: only path and question, with size bounds.
- Absolute paths, realpath containment, no drive-root grants, no escaping symlinks/junctions, no hard links.
- On Windows: UNC/device paths, ADS, traversal, reserved names and ambiguous trailing dots/spaces refused.
- Read limits, duration and pixel limits, bounded JPEGs and API response size, finite inference/subprocess timeouts.
- One active call per process; cooperative cancellation terminates the current child and removes known temporary files.
- Cleanup deletes exact owned files and an empty owned directory, never recursively deletes an input path.
- No model auto-load or unload. Vision capability and loaded identifier are checked first.
- Empty/incomplete/reasoning-only answers are errors; hidden reasoning is not substituted for the final description.

Automated tests exercise representative path escapes, links, missing prerequisites, missing/unloaded/text-only models, redirect refusal, authentication failure, and cleanup. These are targeted tests, not a formal security proof or independent penetration test.

## Remaining risks and release gates

The process is not an OS sandbox. Filesystem checks reduce accidental and model-directed overreach but do not fully defeat races by an attacker who can concurrently alter the allowed root or temporary files. Windows Temp inherits account ACLs; POSIX temporary directories are owner-only where supported. A hostile local account/process, a replaced FFmpeg executable, or a decoder vulnerability is outside these application-level guarantees.

Malformed media can still stress CPU/memory before a timeout. The bounded input size does not strictly bound decoder memory. Consider a restricted service account or OS-level resource limits for untrusted uploads; this candidate is intended for owner-provided local files.

File contents and model outputs can contain prompt injections. The vision system prompt treats scene text as untrusted, and the README supplies host instructions, but prompting is not a guarantee against model misbehavior. The specialist is not given any tools. The host should expose only necessary, restricted integrations.

Forced process termination or power loss can leave source copies/JPEGs in temporary storage. No startup deletion sweep runs, avoiding accidental removal of another active job. An explicit stale-file cleanup feature remains future work. LM Studio logs and chat histories are not cleaned by this tool.

Safe diagnostics omit paths, identifiers and token values. Compatibility tests deliberately retain exact outputs and paths in private result folders; they are not safe-to-share diagnostics. Scan any public release and human-review sanitized reports before publication.

MIT and the owner attribution are approved. The repository is [alharrell007-svg/FrameSampleRelay](https://github.com/alharrell007-svg/FrameSampleRelay), publicly available. GitHub private vulnerability reporting is enabled and was verified September 21, 2026. See [reporting policy](../SECURITY.md). Do not post sensitive reproductions publicly.
