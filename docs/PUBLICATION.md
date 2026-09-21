# Publication record and historical preparation checklist

Published September 21, 2026: [v0.2.0-rc.4](https://github.com/alharrell007-svg/FrameSampleRelay/releases/tag/v0.2.0-rc.4). The repository is public and GitHub private vulnerability reporting is enabled and verified. The approved ZIP and checksum remain unchanged. No external announcements were made.

The checklist below is retained as historical pre-publication documentation, not a current action plan. Statements about private visibility, draft status and pending approval describe that earlier stage.

# Historical publication plan — before launch

Approved identity: FrameSampleRelay — Local Video Analysis from Sampled Frames for LM Studio. Owner and contributor: Aaron Harrell. MIT, Copyright (c) 2026 Aaron Harrell. Repository: [alharrell007-svg/FrameSampleRelay](https://github.com/alharrell007-svg/FrameSampleRelay). Proposed npm identifier: framesamplerelay.

The repository already exists privately. The existing [release draft](https://github.com/alharrell007-svg/FrameSampleRelay/releases) is for owner review; no public release, npm package, Hub upload or announcement has been published. Do not create another repository or conflicting release draft.

## Before any public publication

1. Review the exact final ZIP, inventory, SHA-256 and [validation scope](RELEASE-VALIDATION.md). Accept or complete remaining [human checks](HUMAN-CHECKS.md).
2. Obtain explicit approval for public visibility and the exact artifact/version to publish. Keep the repository private and the release a draft until then. MIT and owner attribution are already approved.
3. Preserve approved source and archive versions. Exclude generated configurations/install pages, private records, backups and personal media. GitHub's account-provided no-reply identity is approved for commit metadata only; never add an email to project files.
4. Only after public visibility is separately authorized and applied, enable GitHub private vulnerability reporting and verify the setting and private reporting form. It is unavailable while this repository is private. Follow [GitHub's current instructions](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository). Do not submit a dummy report or claim enablement before verification. Ask the owner before adding any alternative public contact.
5. Update SECURITY.md status only after verification. Confirm repository, [issue](https://github.com/alharrell007-svg/FrameSampleRelay/issues) and [release](https://github.com/alharrell007-svg/FrameSampleRelay/releases) links. Any file/version change requires a fresh archive, privacy scan, checksum and review; never overwrite an approved archive as though unchanged.
6. Keep the existing draft aligned with the reviewed source and version, with only its approved ZIP and checksum attached. Verify uploaded file hashes and asset digests before separately authorized publication. Node, FFmpeg/ffprobe, LM Studio and model weights remain external prerequisites.
7. Review [the announcement draft](ANNOUNCEMENT-DRAFT.md) against the actual published release URL and obtain separate approval before posting.
8. npm publication is optional and separately authorized. Keep the package's private publication guard. Registry publication requires a fresh name check, tested CLI/bin entry, pinned launcher behavior and packed-file review; do not simply disable the guard.

## References

LM Studio supports [MCP configuration](https://lmstudio.ai/docs/app/mcp) and [installation links](https://lmstudio.ai/docs/app/mcp/deeplink). Setup generates the machine-specific installation button locally; it is not a repository download link. Never publish the generated page or configuration.

The project is [MIT licensed](../LICENSE). External runtimes, integrations and models retain their own terms. No third-party JavaScript libraries or binaries are bundled. Reassess notices before adding dependencies or distributing runtimes. This project is independent of LM Studio and does not claim endorsement.
