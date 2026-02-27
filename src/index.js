import { program } from 'commander';
import chalk from 'chalk';
import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';
import { scanCodebase } from './scanner.js';
import { buildContext } from './context.js';
import { startRepl } from './repl.js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-3-5-haiku-20241022';

function isGitHubUrl(input) {
  return /^https?:\/\/github\.com\//i.test(input) || /^git@github\.com:/i.test(input);
}

function cloneRepo(url) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whisper-'));
  process.stdout.write(chalk.dim(`Cloning ${url}...\n`));

  const result = spawnSync('git', ['clone', '--depth', '1', url, tmpDir], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.status !== 0) {
    const err = result.stderr?.toString() ?? 'unknown error';
    throw new Error(`git clone failed: ${err}`);
  }

  return tmpDir;
}

function callAnthropic(apiKey, systemPrompt, userMessage) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const req = https.request(
      ANTHROPIC_API_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              reject(new Error(parsed.error.message));
              return;
            }
            resolve(parsed.content?.[0]?.text ?? '(no response)');
          } catch {
            reject(new Error('Failed to parse API response'));
          }
        });
      }
    );

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy(new Error('Request timed out after 30s'));
    });

    req.write(body);
    req.end();
  });
}

export async function run() {
  program
    .name('repo-whisperer')
    .description('Talk to any codebase in plain English')
    .argument('[target]', 'Local path or GitHub URL to explore')
    .option('--model <model>', 'Anthropic model to use', MODEL)
    .version('1.0.0')
    .parse();

  const [target] = program.args;
  const opts = program.opts();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error(chalk.red('Error: ANTHROPIC_API_KEY environment variable is not set.'));
    process.exit(1);
  }

  let targetPath = target ?? process.cwd();
  let tmpDir = null;

  if (isGitHubUrl(targetPath)) {
    try {
      tmpDir = cloneRepo(targetPath);
      targetPath = tmpDir;
    } catch (err) {
      console.error(chalk.red(`Clone failed: ${err.message}`));
      process.exit(1);
    }
  } else {
    targetPath = path.resolve(targetPath);
    if (!fs.existsSync(targetPath)) {
      console.error(chalk.red(`Path not found: ${targetPath}`));
      process.exit(1);
    }
    if (!fs.statSync(targetPath).isDirectory()) {
      console.error(chalk.red(`Not a directory: ${targetPath}`));
      process.exit(1);
    }
  }

  console.log(chalk.dim(`\nScanning ${path.basename(targetPath)}...`));

  let scan;
  try {
    scan = scanCodebase(targetPath);
  } catch (err) {
    console.error(chalk.red(`Scan failed: ${err.message}`));
    process.exit(1);
  }

  const { summary, counts } = scan;

  console.log(chalk.hex('#FB923C').bold(`\n   ${scan.projectName}`));
  console.log(chalk.dim(`   Stack: ${scan.stack}`));
  console.log(chalk.dim(`   Files: ${counts.source} source, ${counts.test} tests`));
  console.log(chalk.dim(`   Entry: ${scan.entry}`));
  console.log(chalk.dim('\n   Type a question, "tree", "read <file>", or "exit"\n'));

  const systemPrompt = `You are an expert code guide helping a developer explore an unfamiliar codebase.

You have been given context about the codebase including its structure, key files, and dependencies.

When answering:
- Be specific and reference actual file paths (e.g. src/middleware/auth.ts:23-45)
- Use numbered steps for processes that have a sequence
- Keep answers focused and practical — no fluff
- Format file references like: 📄 src/path/to/file.ts:line-line
- If you don't have enough context to answer fully, say so and suggest which files to read
- Never make up file paths that weren't in the context provided`;

  async function onQuestion(question) {
    const { contextString, includedFiles } = buildContext(question, scan);

    const userMessage = `## Codebase Context\n\n${contextString}\n\n---\n\n## Question\n\n${question}`;

    const answer = await callAnthropic(apiKey, systemPrompt, userMessage);
    return answer;
  }

  process.on('exit', () => {
    if (tmpDir) {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {}
    }
  });

  startRepl(scan, onQuestion);
}
