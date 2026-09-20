# Human validation and remaining release checks

Completed on rc.2: installation through the generated button; fresh-chat filesystem discovery followed by video analysis; normal LM Studio close/reopen and a new successful call; candidate uninstall/reinstall and a new successful call. The original integration remained installed. These observations are inherited by rc.4 because its setup/server logic is unchanged, not claimed as new rc.4 desktop tests.

The installed candidate's outside-folder denial passed a separate stdio test before extraction or inference. See [validation](RELEASE-VALIDATION.md).

Remaining checks:

1. Follow [installation](INSTALLATION.md) on a genuinely fresh second Windows computer; record exact versions and manual steps.
2. If making a broader filesystem-integration security claim, test that integration's outside-folder listing restriction separately without weakening permissions.
3. If requiring full-process restart evidence, verify process termination during a normal close/reopen when no other chat depends on it. Do not force-kill or unload models without consent.
4. Retain output-quality limitations and known hallucinations. Do not claim audio or continuous-video understanding.
5. Only after public visibility is separately authorized for the existing repository, configure and verify GitHub private vulnerability reporting before advertising it as available. If unavailable, ask the owner for an approved alternative; no email substitute is authorized.
6. Review the exact final ZIP/checksum and authorize publication separately. MIT, copyright attribution and repository owner are already approved.
