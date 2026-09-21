# FrameSampleRelay 0.2.0-rc.4 validation

This is a repository-reference, documentation and version update from rc.3. Server, setup and security logic are unchanged. Earlier evidence is retained separately, not represented as new rc.4 model tests.

## Evidence and scope

| Check | Result | Version / limits |
|---|---|---|
| Core/setup suite | 20/20 passed | Rerun on rc.4; includes MCP process restart, path checks and install-link encoding |
| Media/failure suite | 17/17 passed | Rerun on rc.4; real FFmpeg with stubbed vision |
| Fresh ZIP installation | Setup and 20/20 tests passed | Separate extracted folder with spaces; generated JSON and installation-link encoding verified; no live MCP entry changed |
| Live diagnostics | Not ready: specialist not loaded | Config and FFmpeg/ffprobe passed; configured Gemma identifier not loaded. No model or setting changed. Live ready-state not revalidated on rc.4 |
| Live vision / chat-to-vision harness | 3/3 each | Inherited rc.2 Gemma specialist and Ministral-to-Gemma; synthetic discovery helper |
| Desktop installation button | Passed | User-guided rc.2, separate integration; original preserved |
| Fresh-chat natural language and real filesystem discovery | Passed | rc.2, discovered video inside permitted folder, then analyze_video |
| Desktop restart/reopen | Passed | Normal close/reopen followed by fresh successful tool call; full process termination not independently verified |
| Candidate uninstall/reinstall | Passed | rc.2 removed and re-added; original integration remained; fresh successful call |
| Outside-folder security | Passed | Installed rc.2 server/config over stdio; real harmless synthetic outside video rejected |
| Boundary-call monitoring | No extraction or inference | Zero subprocess launches, HTTP/HTTPS requests and temporary analysis directories; counters positive-control checked |
| Actual rc.2 ZIP privacy review | Passed | 23 files, no private media/configuration/logs/credentials; not a formal secret-detection proof |

The outside-folder check did not weaken permissions or rely on chat-model refusal. It rejected the request before source copying, ffprobe, extraction or model metadata/inference requests. One initial observer-script Windows file-URL error was corrected; installed code was unchanged. rc.4 uses the identical server implementation.

Final rc.4 archive privacy/inventory checks are recorded in the accompanying preparation report and checksum manifest. Personal screenshots, raw outputs and machine-specific configurations are excluded.

## Inherited rc.2 live configurations

Environment: Windows x64, build 26200.9457; LM Studio 0.4.24+1; existing llama.cpp CUDA 12 AVX2 engine 2.41.0; Node.js 24.19.0; FFmpeg/ffprobe 9.0.1 essentials. Hardware and full model filenames/projectors are retained in [historical tested configurations](TESTED-CONFIGURATIONS.md). No model was loaded or unloaded during those rc.2 runs.

| Role | Exact loaded identifier | Weights | Context / parallel |
|---|---|---|---|
| Chat | `ministral-3-14b-instruct-2512:2` | `Ministral-3-14B-Instruct-2512-Q3_K_S.gguf` | 16384 / 4 |
| Specialist | `google/gemma-4-12b` | `gemma-4-12B-it-Q4_K_M.gguf` | 16384 / 4 |

Chat requests: temperature 0.2, 700 output tokens, automatic tools, parallel calls disabled, at most five turns, 180-second request timeout. Specialist: six evenly spaced JPEGs, fit within 640×640, temperature 0.2, 700 output tokens, 180-second analysis timeout. No `reasoning_effort` override was sent in this run. The specialist previously had thinking disabled in the desktop; that UI switch was not re-inspected during the automated phase; later user-guided desktop checks did not record every model toggle. Effective host defaults beyond captured API metadata are not asserted. Raw API usage and model metadata are preserved privately.

Three copied synthetic six-second H.264 MP4 fixtures: a horizontally moving red square; sequential red square/blue circle/yellow triangle; three blue circles plus a yellow square crossing a central rectangle. They contain no audio. Historical Qwen/GPT-OSS tests were not repeated and are clearly labeled predecessor evidence, including their failures.

## Accuracy defects retained

Gemma again invented thin black borders in the multiple-scenes fixture. Ministral repeated that invented detail in its final answer. In the occlusion answer, Ministral added an explanatory guess about which object covers which; the sampled-frame observations do not justify confident continuous-motion claims. These are known model/output-quality limitations, not hidden passes. Answers about sampled frames can omit events or add unsupported details; audio is never analyzed.


## Remaining limitations

- Live model inference, desktop install/restart/uninstall/reinstall and the separately instrumented installed-candidate outside-folder test were not rerun on rc.4; their earlier results are inherited, not new passes.
- Clean second-computer setup, Node 22 itself, macOS/Linux, additional models/codecs and adversarial filesystem races remain unverified.
- The independent filesystem plugin's outside-folder listing denial is not established by the video-tool rejection test.
- Prior host-API plugin invocation returned 403. Desktop success does not resolve that separate API permission path; no permissions were relaxed.
- Sampled frames can miss events and cannot establish continuous motion or audio. Successful calls do not certify description accuracy.
- Publication status: [v0.2.0-rc.4](https://github.com/alharrell007-svg/FrameSampleRelay/releases/tag/v0.2.0-rc.4) is a public prerelease. GitHub private vulnerability reporting is enabled, verified September 21, 2026. This documentation update does not add runtime test evidence or modify the published ZIP.
