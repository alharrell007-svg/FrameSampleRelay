# Publication plan — not executed

Approved identity: FrameSampleRelay — Local Video Analysis from Sampled Frames for LM Studio. Owner and contributor: Aaron Harrell. MIT, Copyright (c) 2026 Aaron Harrell. Approved GitHub destination: alharrell007-svg/framesamplerelay-lmstudio. Proposed npm identifier: framesamplerelay.

No repository, registration, package, public release, Hub upload or announcement was created. This remains a local stdio MCP source release. Package metadata's repository URL is the intended destination, not evidence of a live repository.

## After separate publication approval

1. Review the final ZIP, inventory, checksum and [validation scope](RELEASE-VALIDATION.md). Accept or complete the remaining [human checks](HUMAN-CHECKS.md). Recheck name availability.
2. Obtain explicit approval for the exact public artifact/version and repository creation. MIT and owner attribution already have approval; do not request them again unless they change.
3. Create the approved repository only after authorization. Use [community metadata](COMMUNITY.md). Exclude generated configurations/install pages, private tests, backups and screenshots. Before committing, verify that Git author metadata will not expose a personal email address. Use a GitHub-provided privacy identity only after confirming the account's appropriate setting/value; do not invent a substitute address.
4. Enable GitHub private vulnerability reporting if available: repository **Settings → Advanced Security → Private vulnerability reporting → Enable**. Verify the setting and private reporting form under **Security → Advisories**. Do not submit a dummy report or claim enablement without verification. Follow [GitHub's current instructions](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository) if navigation changes. If unavailable or another public contact field is required, ask the owner; never insert a personal email address.
5. Update SECURITY.md's pending status only after verification and confirm actual repository/issue/release links. Any documentation/source/version change requires a fresh archive, privacy scan, inventory/checksum and review. Do not overwrite this rc.3 archive as though unchanged.
6. Commit the approved source and tag its exact reviewed version. Run relevant tests, build from the allowlisted tree, and upload only the approved archive/checksum. Node, FFmpeg/ffprobe, LM Studio and model weights are separate prerequisites, not bundled.
7. Review [the announcement draft](ANNOUNCEMENT-DRAFT.md) against the published artifact and obtain separate approval before posting. Include no personal contact address.
8. npm publication is optional and separately authorized. The package retains its private publication guard and has an MIT license. A registry release needs a tested CLI/bin entry, pinned launcher behavior and packed-file review; do not simply disable the guard and publish.

## References

LM Studio supports [MCP configuration](https://lmstudio.ai/docs/app/mcp) and [installation links](https://lmstudio.ai/docs/app/mcp/deeplink). Setup generates its private machine-specific link locally. Never publish that page or configuration.

The project is [MIT licensed](../LICENSE). Node, FFmpeg, LM Studio, filesystem integrations and models retain their own terms. No third-party JavaScript libraries or binaries are bundled. Reassess notices before introducing dependencies or distributing runtimes. This project is independent of LM Studio and does not claim endorsement.
