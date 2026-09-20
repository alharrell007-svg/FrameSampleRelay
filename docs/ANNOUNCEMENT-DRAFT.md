# First-release announcement draft — not posted

FrameSampleRelay — Local Video Analysis from Sampled Frames for LM Studio

FrameSampleRelay connects a tool-capable local chat model to a local vision specialist. A separate filesystem integration discovers a video in an allowed folder; this stdio MCP server uses FFmpeg to sample representative frames and returns the specialist's text analysis.

Windows desktop testing verified installation through the generated button, natural-language discovery and analysis, normal close/reopen recovery, and candidate uninstall/reinstall. A separate test verified rejection of an outside-folder video before extraction or inference. These checks were performed on rc.2; rc.4 retains the same server/setup logic and updates repository references, metadata and documentation.

Sampled stills can miss events. The tool does not analyze audio or establish continuous motion, and models can invent details. Second-computer setup and other platforms remain unverified. Loopback-only connections describe this tool; host logging, inference forwarding and other integrations have separate privacy implications.

Owner and contributor: Aaron Harrell. MIT, Copyright (c) 2026 Aaron Harrell. Repository: [alharrell007-svg/FrameSampleRelay](https://github.com/alharrell007-svg/FrameSampleRelay), currently private for review. Node.js, FFmpeg/ffprobe, LM Studio and a local vision model are separate prerequisites.

Before posting: insert the approved actual release URL/version/checksum and verify all status claims. The repository exists privately and the release is a draft. Public visibility and announcement require separate approval. GitHub private vulnerability reporting is not enabled and is unavailable while the repository is private. Do not advertise an active channel before verification or add a personal email address. This draft has not been posted.
