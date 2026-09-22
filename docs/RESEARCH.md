# Source review — repo-whisperer

## Revision and method

Inspected public commit: [`ddf1984157598a31ec34d1a2c95c32c6f04beff5`](https://github.com/NickCirv/repo-whisperer/commit/ddf1984157598a31ec34d1a2c95c32c6f04beff5). Source tree: `5a103044687502dccf9d876b606841f0fcb98747`. Capture scope: all eligible text files; 10 of 10 eligible files.

This review read captured implementation and documentation. It did not install dependencies, execute project commands, call project APIs, check package publication or establish live CI status. Examples are source-derived, not captured execution transcripts.

## Claim ledger

| Claim | Evidence | Status |
| --- | --- | --- |
| Clone, API flow and fixed request model | [src/index.js](https://github.com/NickCirv/repo-whisperer/blob/ddf1984157598a31ec34d1a2c95c32c6f04beff5/src/index.js) | Verified in inspected source; execution unverified |
| Ten-file/hundred-line context bounds | [src/context.js](https://github.com/NickCirv/repo-whisperer/blob/ddf1984157598a31ec34d1a2c95c32c6f04beff5/src/context.js) | Verified in inspected source; execution unverified |
| Depth-bounded file scan | [src/scanner.js](https://github.com/NickCirv/repo-whisperer/blob/ddf1984157598a31ec34d1a2c95c32c6f04beff5/src/scanner.js) | Verified in inspected source; execution unverified |

## Findings and verification gaps

Context selection uses up to ten files and the first hundred lines of each selected file, so important behavior may be absent. The scanner has a depth bound. `--model` is advertised but the request builder uses the constant model identifier, so model selection is not wired through at this revision. Model availability and answer quality were not tested. Local code is sent externally when questions are asked.

The captured smoke test only asks Node to syntax-check the entrypoint. It does not exercise behavior, integrations or failure paths. Neither that test nor installation was run in this review.

| Dimension | Result |
| --- | --- |
| Purpose and documented commands | Partially verified: static source inspection |
| Clean installation and examples | Unverified |
| Test suite and live CI | Unverified |
| Performance and security guarantees | Unverified |
| Publication | Local documentation only |

## Documentation inventory

- [README.md](https://github.com/NickCirv/repo-whisperer/blob/ddf1984157598a31ec34d1a2c95c32c6f04beff5/README.md) — Rewritten; historic section anchors retained where practical.
- [LICENSE](https://github.com/NickCirv/repo-whisperer/blob/ddf1984157598a31ec34d1a2c95c32c6f04beff5/LICENSE) — protected document preserved unchanged.

## Captured source inventory

- [LICENSE](https://github.com/NickCirv/repo-whisperer/blob/ddf1984157598a31ec34d1a2c95c32c6f04beff5/LICENSE) — Git blob `481c289c06c96c07330f8c7dedd847c5c07ca384`.
- [README.md](https://github.com/NickCirv/repo-whisperer/blob/ddf1984157598a31ec34d1a2c95c32c6f04beff5/README.md) — Git blob `00695da48960dc496caf840dc04cfb4c91ebeb78`.
- [package.json](https://github.com/NickCirv/repo-whisperer/blob/ddf1984157598a31ec34d1a2c95c32c6f04beff5/package.json) — Git blob `2d9d771712f870bed0efee6cef6c33c48a5b01e2`.
- [.github/workflows/ci.yml](https://github.com/NickCirv/repo-whisperer/blob/ddf1984157598a31ec34d1a2c95c32c6f04beff5/.github/workflows/ci.yml) — Git blob `44515034a394670de44454a7a1bd2c7ef0c9836e`.
- [bin/whisper.js](https://github.com/NickCirv/repo-whisperer/blob/ddf1984157598a31ec34d1a2c95c32c6f04beff5/bin/whisper.js) — Git blob `3385e06abcb73fc903097b8ced854d7e27903fde`.
- [src/context.js](https://github.com/NickCirv/repo-whisperer/blob/ddf1984157598a31ec34d1a2c95c32c6f04beff5/src/context.js) — Git blob `3c38b25e9fe4505a5bab7a975d4014f5e609366a`.
- [src/index.js](https://github.com/NickCirv/repo-whisperer/blob/ddf1984157598a31ec34d1a2c95c32c6f04beff5/src/index.js) — Git blob `7f33cd9a03606d60037fa65ac16aaeb7a23b2872`.
- [src/repl.js](https://github.com/NickCirv/repo-whisperer/blob/ddf1984157598a31ec34d1a2c95c32c6f04beff5/src/repl.js) — Git blob `78de8181d832521bf398e02319d83cab13f4110d`.
- [src/scanner.js](https://github.com/NickCirv/repo-whisperer/blob/ddf1984157598a31ec34d1a2c95c32c6f04beff5/src/scanner.js) — Git blob `7c9818a7ab2d8c5f0338aa1f7a41b6c82f21dcb5`.
- [test/smoke.test.js](https://github.com/NickCirv/repo-whisperer/blob/ddf1984157598a31ec34d1a2c95c32c6f04beff5/test/smoke.test.js) — Git blob `9c7fbb23b87fb4a96d36d0531d8e6f56c8d24a44`.

## Scope boundary

Capture excludes lockfiles, binary artwork, generated output, vendored dependencies and files above the acquisition size limit. The tree records their existence; no verification claim is made for omitted content. Protected documents and historical records are not replaced.

## Reference coverage

Added [command reference](REFERENCE.md) from the argument parser, command handlers and source-defined help at the pinned revision. README examples remain unexecuted.
