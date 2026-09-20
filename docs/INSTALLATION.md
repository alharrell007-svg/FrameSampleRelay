# Install, upgrade, and remove FrameSampleRelay

This is an unpublished source candidate. Follow the [README](../README.md#requirements-in-order) for prerequisites and the complete command options. No npm installation is required. Keep the extracted folder in a permanent location.

1. Install Node.js and FFmpeg/ffprobe separately. Confirm each runs from your terminal.
2. Start LM Studio's local API server. Load a vision-capable specialist and copy its exact API identifier. Leave your conversational model loaded if resources permit.
3. Extract the ZIP into a new folder such as `C:\FrameSampleRelay`. Preserve any earlier installation.
4. Open a terminal in that new folder and run:

```powershell
node cli.mjs setup --root "C:\VideoLibrary" --model "your-loaded-vision-model-id"
```

The video folder must exist. Add `--ffmpeg-dir "C:\Tools\ffmpeg\bin"` if necessary. Generated configuration, JSON and HTML contain local paths and must stay private.

5. Run `node cli.mjs doctor --config video-tool.config.json`. Resolve errors until it reports `"ready": true`.
6. Back up the current MCP configuration before installation. Open the generated `add-to-lm-studio.html` and click **Add to LM Studio**. Review the proposed **framesamplerelay** entry. The link's encoding is automated-tested. Human desktop handoff passed on rc.2; rc.3 retains the same setup implementation.
7. If the button fails, use LM Studio's integrations panel → Install → Edit mcp.json. Merge only the `framesamplerelay` member from `lm-studio-entry.json` into the existing `mcpServers` object. Preserve every unrelated entry. Do not paste a second complete JSON document into that file.
8. In a new test chat, enable **mcp/framesamplerelay** and your filesystem integration, restricted to the same video folder. Add the README routing instruction. Use one video-analysis integration in that test chat so results are attributable; preserve older integrations in other chats.
9. Ask “What is in the video in my folder?” without giving a path or attaching a file. Confirm discovery followed by `analyze_video`, then a description. If several videos exist, asking which one is expected.

## Upgrade and rollback

The tool function `analyze_video`, its arguments, configuration fields, `video-tool.config.json`, and `LM_STUDIO_API_TOKEN` remain unchanged. The new integration key and MCP server identity are `framesamplerelay`. Temporary analysis directories now use `framesamplerelay-`; older releases may have left directories with their old prefix. Diagnostic scratch directories retain the internal `local-video-doctor-` prefix.

Extract updates into a different folder and run setup there. Setup refuses overwriting existing generated files. Do not rename or overwrite your working copy. After a successful isolated chat test, deliberately choose which integration your normal chat uses. Rollback means restoring that chat's previous integration selection and previous configuration entry; retain the old files until satisfied.

## Uninstall and reinstall

1. Disable **mcp/framesamplerelay** in chats using it. Wait for analyses to finish.
2. Back up `mcp.json`; remove only its `framesamplerelay` member and save valid JSON. Do not remove a previous installation under another name.
3. Confirm the integration is gone and its process stopped. You may then delete this extracted folder and its generated files. Keep any videos stored separately. Do not remove models, Node, FFmpeg or other integrations.
4. For reinstall testing, extract into another fresh folder, repeat setup and doctor, then add the newly generated entry. Confirm paths refer to this copy.

Closing/reopening LM Studio can interrupt other chats. Perform the real restart check only when their users are ready. Process-restart automated tests do not prove a desktop app restart.

[Official configuration guidance](https://lmstudio.ai/docs/app/mcp) · [Official install-link format](https://lmstudio.ai/docs/app/mcp/deeplink).
