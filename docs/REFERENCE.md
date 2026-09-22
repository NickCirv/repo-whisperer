# Command reference

Use `node bin/whisper.js` from the pinned source checkout described in the [README](../README.md). The entries below describe the inspected implementation.

| Command or argument | Behavior |
| --- | --- |
| `[TARGET]` | Explore a local path or shallow-clone a GitHub URL into a temporary directory. |
| `--model MODEL` | Accepted by the parser, but the request uses the hard-coded model constant; this flag does not switch the request model. |
| `Interactive question` | Submit questions with sampled repository context to Anthropic; requires ANTHROPIC_API_KEY. |

For prerequisites, file writes, external services and known limitations, see [Behavior and limits](../README.md#behavior-and-limits).

Implementation: [src/index.js](https://github.com/NickCirv/repo-whisperer/blob/ddf1984157598a31ec34d1a2c95c32c6f04beff5/src/index.js), [src/context.js](https://github.com/NickCirv/repo-whisperer/blob/ddf1984157598a31ec34d1a2c95c32c6f04beff5/src/context.js), [src/scanner.js](https://github.com/NickCirv/repo-whisperer/blob/ddf1984157598a31ec34d1a2c95c32c6f04beff5/src/scanner.js); [review evidence](RESEARCH.md).
