> Historical evidence from the predecessor candidate (0.2.0-rc.1), preserved without rerunning all model combinations. These results are not new FrameSampleRelay rc.3 test runs. See [current validation](RELEASE-VALIDATION.md).

# Tested configurations

Release candidate 0.2.0-rc.1; tests performed September 19, 2026. These are exact local configurations, not model-family guarantees. Tests use three generated six-second 320×240 H.264 MP4s with no audio. Three repetitions per clip are used for isolated orchestration and independent vision; live end-to-end coverage is identified separately. All raw outputs, including questionable ones, remain in the private release review.

| Run | Chat | Vision | Attempts | Structural successes | Correct video calls | Completed real analyses |
|---|---|---|---:|---:|---:|---:|
| end-to-end-gemma | Gemma 4 12B / Q4_K_M | Gemma 4 12B / Q4_K_M | 3/3 | 1 | 1 | 1 |
| end-to-end-gptoss | GPT-OSS 20B / MXFP4 | Gemma 4 12B / Q4_K_M | 3/3 | 3 | 3 | 3 |
| end-to-end-ministral | Ministral 3 14B / Q3_K_S | Gemma 4 12B / Q4_K_M | 3/3 | 3 | 3 | 3 |
| end-to-end-qwen | Qwen3.5 9B / Q4_K_M | Gemma 4 12B / Q4_K_M | 3/3 | 3 | 3 | 3 |
| orchestration-gemma | Gemma 4 12B / Q4_K_M | Oracle stub (no vision) | 9/9 | 4 | 5 | 0 |
| orchestration-gptoss | GPT-OSS 20B / MXFP4 | Oracle stub (no vision) | 9/9 | 9 | 9 | 0 |
| orchestration-ministral | Ministral 3 14B / Q3_K_S | Oracle stub (no vision) | 9/9 | 9 | 9 | 0 |
| orchestration-qwen | Qwen3.5 9B / Q4_K_M | Oracle stub (no vision) | 9/9 | 9 | 9 | 0 |
| vision-gemma | — | Gemma 4 12B / Q4_K_M | 9/9 | 9 | 0 | 9 |
| vision-ministral | — | Ministral 3 14B / Q3_K_S | 9/9 | 9 | 0 | 9 |
| vision-qwen | — | Qwen3.5 9B / Q4_K_M | 9/9 | 6 | 0 | 6 |
| vision-qwen-thinking-off | — | Qwen3.5 9B / Q4_K_M | 9/9 | 9 | 0 | 9 |

## Exact model files

| Model | File | Quantization | Image projector | Hub revision |
|---|---|---|---|---|
| Ministral 3 14B Instruct 2512 (Unsloth) | Ministral-3-14B-Instruct-2512-Q3_K_S.gguf | Q3_K_S | mmproj-F32.gguf | Direct GGUF; no Hub revision recorded |
| Gemma 4 12B (lmstudio-community) | gemma-4-12B-it-Q4_K_M.gguf | Q4_K_M | mmproj-gemma-4-12B-it-BF16.gguf | 5 |
| Qwen3.5 9B (lmstudio-community) | Qwen3.5-9B-Q4_K_M.gguf | Q4_K_M | mmproj-Qwen3.5-9B-BF16.gguf | 3 |
| GPT-OSS 20B (lmstudio-community) | gpt-oss-20b-MXFP4.gguf | MXFP4 | None; text-only | 7 |

## Environment and controls

- Windows build 26200.9457, 25H2, x64; LM Studio 0.4.24+1.
- Engine: llama.cpp-win-x86_64-nvidia-cuda12-avx2 2.41.0. Node.js 24.19.0; FFmpeg and ffprobe 9.0.1 essentials.
- CPU: Intel Core i5-13600K, 20 logical processors; approximately 32 GiB RAM; NVIDIA RTX 3070, 8 GiB VRAM.
- Vision: six evenly spaced frames, maximum 640×640 JPEGs, temperature 0.2, maximum 700 output tokens, 180-second overall timeout.
- Chat: temperature 0.2, maximum 700 output tokens per turn, automatic tool selection, parallel tool calls disabled, up to five turns. Exact prompts are in the harness.
- Original Ministral and Gemma instances: 16384 context, parallel 4. Gemma thinking was disabled in the UI; repeated vision responses reported zero reasoning tokens.
- Qwen test instance: 8192 context, parallel 1, explicitly loaded with GPU offload disabled. Default thinking remained enabled and reasoning tokens were observed.
- Other inherited sampling/runtime defaults were not exhaustively captured. Model weight hashes were not calculated; filenames, file sizes, source identifiers, Hub revisions and prompt-template hashes were recorded privately. This limits bit-for-bit reproducibility.
- Resource pressure changed as previously loaded models were temporarily unloaded with permission. Timings include warm-cache effects and are not a controlled model speed ranking.

## Interpretation and gaps

Orchestration-only uses a deterministic answer stub and does not count as vision inference. A nonempty answer is not an accuracy pass. Gemma repeatedly added nonexistent black borders to the multi-scene fixture; that defect is preserved in the private outputs. Synthetic scenes give known ground truth but do not establish performance on diverse real-world footage. GPT-OSS is not an image model and is refused as a specialist; its orchestration results must be read separately.

Package setup, prerequisite detection, two extracted copies and stdio start/restart were checked on the existing Windows machine. A candidate host-API integration attempt returned HTTP 403 because plugin invocation was disabled in the host's API permissions; its temporary registration was removed. At the time of those historical tests, candidate-specific desktop checks remained unverified. Subsequent rc.2 installation, natural-language routing, normal close/reopen, and uninstall/reinstall passed; see current validation. Full process termination was not independently verified. A clean second computer and macOS/Linux remain unverified.

No data was published. The owner must review output quality and release gates before a public compatibility claim.

## Configuration variants and scope

- The run named vision-qwen uses host-default thinking: six of nine descriptions completed, while all three occlusion attempts exhausted the 700-token output limit with no final text.
- Gemma orchestration sometimes overescaped Windows backslashes in the discovered path. The path validator refused those ambiguous arguments; its image-processing capability does not establish reliable chat orchestration. Failed calls and final apologies remain in the private output review.
- Ministral vision described an upper-left to lower-right/downward trajectory in repeated simple-motion answers. The synthetic square actually stays at a constant height; successful image transport did not prevent this factual error.
- Structural success requires no recorded error: a model that makes a bad call then recovers remains a failed attempt in that strict column, while its valid-call count and final output preserve the recovery. No random seed was explicitly set, so repeated requests are not a statistical independence guarantee.
- The separate vision-qwen-thinking-off run sets visionReasoningEffort to none, which sends reasoning_effort: none. All nine attempts completed and reported zero reasoning tokens. A small text probe also verified that setting on the same installed model/host. This is evidence for this exact configuration only.
- Qwen orchestration and end-to-end runs retain default chat thinking. End-to-end uses Gemma as the specialist, not Qwen.
- The temporary GPT-OSS instance uses context 8192, parallel 1 and GPU offload disabled. Chat thinking/reasoning remains at host defaults; usage counts are retained in the private traces. It is text-only and is deliberately not sent image tests.
- Full-flow runs use three attempts per chat configuration (one per clip). Isolated orchestration and vision use nine (three per clip). No skipped case is counted as a success.
- The later harness saves hashes of the server, configuration loader and harness. Earlier runs made before that metadata was introduced lack per-run hashes. The final archive has its own SHA-256 inventory.
- The title “occlusion count” hints at the intended visual event. These synthetic tests are not blinded benchmarks, nor a claim about diverse real footage. Sampling does not establish exact transition times or continuous motion.
- Media/error tests passed for all six accepted containers, including M4V; only the H.264 MP4 fixtures were used for model-quality comparisons.
