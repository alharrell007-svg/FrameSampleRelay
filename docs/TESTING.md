# Reproducible test procedure

Run tests on a copy. Record the exact released archive hash, tool version, OS build, LM Studio version, inference engine, Node/FFmpeg/ffprobe versions, model filenames and quantizations, image projector, context size, thinking state, GPU offload, and concurrency. Do not unload another person's active model or restart their application without agreement.

## Deterministic checks

From the package folder:

```powershell
node --test --test-isolation=none tests/core.test.mjs tests/setup.test.mjs
```

This tests input validation, escaping folder links, missing dependencies, final-answer handling, HTTP errors, restart of a simulated loopback service, and the MCP server process starting twice. **The simulated service restart is not a real LM Studio restart test.**

## Synthetic videos

Create a new output folder:

```powershell
node scripts/make-fixtures.mjs fixtures
```

The optional second argument is an explicit FFmpeg executable path. The generator refuses to overwrite existing video files. It produces original 320×240, 12 fps, six-second H.264 MP4s, no audio:

1. **simple motion:** red square changes position left to right.
2. **multiple scenes:** red square, blue circle, then yellow triangle.
3. **occlusion count:** three blue circles above a dark stationary rectangle; a yellow square passes behind it.

The JSON manifest contains expected content, technical characteristics and SHA-256 hashes. Exact encoded hashes can vary with FFmpeg builds; preserve the generated hashes for comparisons on a given run. This is a controlled diagnostic suite, not a substitute for varied real-world footage.

Configure a test copy of the tool to allow **only this fixtures folder**. Keep its config and generated outputs outside the distributable source directory if preparing a public archive.

## Media and failure handling

```powershell
node scripts/failure-tests.mjs test-config.json fixtures failure-results.json
```

This uses a loopback vision stub, so it tests extraction and error handling independently of model quality. It covers missing files, outside paths, spaces, corrupt/unsupported files, nested directories, cancellation cleanup, MP4/MOV/M4V/MKV/AVI/WEBM extraction, one-second and 65-second clips, and duration/size caps. It creates and removes its own extra fixtures. Run it while no other candidate test is creating temporary directories.

## A. Orchestration only

```powershell
node scripts/compatibility.mjs --mode orchestration --config test-config.json --fixtures fixtures --output results/chat-01 --chat-model "exact-loaded-chat-id" --repeats 3 --lm-version "0.4.24"
```

The harness exposes a narrow **test-only list_videos** function, `analyze_video`, and a text-only `read_file` distractor. The user asks naturally about a title without giving its path. The model must discover the path, call the right function with valid arguments, receive a result, and produce a final answer.

In this isolated mode, `analyze_video` returns the fixture's deterministic expected description. **It does not run vision.** This permits fair testing of text-only orchestration models and does not count as successful video analysis. The discovery helper is part of the harness, not the shipped MCP server or an assertion about any particular filesystem integration.

Chat settings: temperature 0.2, maximum 700 output tokens per request, tool choice automatic, parallel calls disabled, up to five turns, 180-second request timeout. The exact system prompt, requests' tool calls, returned tool content, final text, errors, token usage and timing are recorded. Reasoning text is not saved, but usage counts are retained. Model/host defaults not explicitly overridden must also be recorded.

## B. Vision only

```powershell
node scripts/compatibility.mjs --mode vision --config test-config.json --fixtures fixtures --output results/vision-01 --repeats 3 --lm-version "0.4.24"
```

The configured specialist receives real extracted frames. The conversational model is absent. Keep the same six frames, resize settings, questions and vision sampling settings across model configurations. Record whether thinking was enabled. The server's model metadata check rejects text-only specialists and unloaded identifiers without loading them.

To test a supported reasoning override, use a separate config with `visionReasoningEffort` set to `none`, and a new output directory. The optional `--chat-reasoning` flag independently sets the conversational request's reasoning effort. Never combine default and adjusted runs into a single success rate. New runs record source-file hashes; earlier preparation runs made before this metadata was added have no per-run source hashes.

## C. End to end

```powershell
node scripts/compatibility.mjs --mode end-to-end --config test-config.json --fixtures fixtures --output results/end-to-end-01 --chat-model "exact-loaded-chat-id" --repeats 3 --lm-version "0.4.24"
```

This combines real model tool selection, actual frame extraction, live vision analysis, and a final chat-model answer. It runs the implementation directly behind function calls; it is not a substitute for an LM Studio UI integration test. Separately install the MCP entry into a test chat, enable the real filesystem integration, and repeat natural questions there.

Use a new output directory for every configuration; existing configuration records cannot be overwritten. `--max-failures 3` can stop after three consecutive failed attempts. `run-status.json` explicitly records unexecuted cases. Do not treat skipped attempts as passes, or delete failed attempts before sharing a summary.

## Assess results

`structuralSuccess` means the requested path/tool/result flow completed without recorded errors. A chat that first makes a bad call and then recovers remains false under this strict metric; its valid-call count and final answer still show that recovery. It **does not** prove that the final description is true or faithful. Manually compare both the specialist output and the conversational paraphrase to the visible video and manifest. Record omitted objects, invented borders, incorrect counts, unsupported speech/motion claims, and any improvement or deterioration in paraphrasing. Keep the actual answer even when it is wrong.

Three repetitions detect obvious recurring failures but are too few to estimate rare failure rates. Test different questions, distractor tools, longer chat histories, real-world video, and more samples before claiming broad reliability.

## Installation and restart checklist

- Extract only the candidate archive into a new directory. Follow README without copying the development runtime or configuration.
- Test PATH discovery and explicit executable paths, a missing prerequisite, and a path containing spaces.
- Run setup and doctor. Re-running setup should refuse to overwrite configuration.
- Test the server from that extracted directory, then test it through LM Studio with a separate integration label if needed.
- Uninstall only that entry; confirm other integrations still exist.
- Reinstall from the archive into another new directory.
- Restart the candidate process. A real LM Studio restart and a genuinely clean second-machine installation require separate checks; preserve running chats/models first.
- Compare hashes of the original working tool and its MCP configuration after testing.

Raw result files can contain local paths and prompts. Keep them private until manually reviewed and sanitized. Never share the original household configuration, baseline backup, or personal footage as a compatibility fixture.
