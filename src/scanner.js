import fs from 'fs';
import path from 'path';

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '__pycache__',
  'vendor', '.next', '.nuxt', 'coverage', '.cache',
  'target', 'out', '.svelte-kit', 'venv', '.venv',
  'site-packages', '.mypy_cache', '.pytest_cache',
]);

const SOURCE_EXTS = new Set([
  '.js', '.ts', '.jsx', '.tsx', '.py', '.rb', '.go',
  '.rs', '.java', '.c', '.cpp', '.cs', '.php', '.swift',
  '.kt', '.scala', '.ex', '.exs', '.clj', '.elm',
]);

const CONFIG_NAMES = new Set([
  'package.json', 'requirements.txt', 'Cargo.toml', 'go.mod',
  'pyproject.toml', 'Gemfile', 'composer.json', 'pom.xml',
  'build.gradle', 'mix.exs', 'pubspec.yaml', '.eslintrc.json',
  'tsconfig.json', 'vite.config.js', 'vite.config.ts',
  'webpack.config.js', 'docker-compose.yml', 'Dockerfile',
  '.env.example', 'Makefile',
]);

const TEST_PATTERNS = [/test/i, /spec/i, /__tests__/i];
const DOC_EXTS = new Set(['.md', '.rst', '.txt', '.adoc']);
const STYLE_EXTS = new Set(['.css', '.scss', '.sass', '.less', '.styl']);

function categorize(filepath, filename) {
  if (TEST_PATTERNS.some(p => p.test(filepath))) return 'test';
  if (DOC_EXTS.has(path.extname(filename))) return 'docs';
  if (STYLE_EXTS.has(path.extname(filename))) return 'styles';
  if (CONFIG_NAMES.has(filename)) return 'config';
  if (SOURCE_EXTS.has(path.extname(filename))) return 'source';
  return 'other';
}

function walk(dir, rootDir, files = [], depth = 0) {
  if (depth > 8) return files;

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.env.example') continue;
    if (SKIP_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(rootDir, fullPath);

    if (entry.isDirectory()) {
      walk(fullPath, rootDir, files, depth + 1);
    } else {
      const category = categorize(relPath, entry.name);
      files.push({ path: fullPath, rel: relPath, name: entry.name, category });
    }
  }

  return files;
}

function detectStack(files, rootDir) {
  const configs = files.filter(f => f.category === 'config').map(f => f.name);
  const stack = [];

  if (configs.includes('package.json')) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps.react) stack.push('React');
      if (deps.next) stack.push('Next.js');
      if (deps.vue) stack.push('Vue');
      if (deps.nuxt) stack.push('Nuxt');
      if (deps.svelte) stack.push('Svelte');
      if (deps.express) stack.push('Express');
      if (deps.fastify) stack.push('Fastify');
      if (deps.hono) stack.push('Hono');
      if (deps.typescript || deps['@types/node']) stack.push('TypeScript');
      if (!stack.some(s => ['React','Vue','Svelte'].includes(s)) && !stack.some(s => ['Express','Fastify','Hono'].includes(s))) {
        stack.unshift('Node.js');
      } else {
        stack.unshift('Node.js');
      }
    } catch {}
  } else if (configs.includes('requirements.txt') || configs.includes('pyproject.toml')) {
    stack.push('Python');
  } else if (configs.includes('Cargo.toml')) {
    stack.push('Rust');
  } else if (configs.includes('go.mod')) {
    stack.push('Go');
  } else if (configs.includes('Gemfile')) {
    stack.push('Ruby');
  } else if (configs.includes('pom.xml') || configs.includes('build.gradle')) {
    stack.push('Java');
  } else if (configs.includes('pubspec.yaml')) {
    stack.push('Dart/Flutter');
  }

  return stack.join(' + ') || 'Unknown';
}

function findEntryPoint(files, rootDir) {
  const candidates = [
    'src/index.ts', 'src/index.js', 'src/main.ts', 'src/main.js',
    'src/app.ts', 'src/app.js', 'index.ts', 'index.js', 'main.py',
    'app.py', 'main.go', 'main.rs', 'src/main.rs',
  ];

  for (const c of candidates) {
    if (fs.existsSync(path.join(rootDir, c))) return c;
  }

  const srcFiles = files.filter(f => f.category === 'source');
  return srcFiles[0]?.rel ?? 'unknown';
}

function readSafe(filepath, maxLines = 50) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const lines = content.split('\n').slice(0, maxLines);
    return lines.join('\n');
  } catch {
    return '';
  }
}

export function scanCodebase(rootDir) {
  const files = walk(rootDir, rootDir);

  const counts = { source: 0, test: 0, config: 0, docs: 0, styles: 0, other: 0 };
  for (const f of files) counts[f.category] = (counts[f.category] || 0) + 1;

  const stack = detectStack(files, rootDir);
  const entry = findEntryPoint(files, rootDir);
  const projectName = path.basename(rootDir);

  const keyDirs = [...new Set(
    files
      .filter(f => f.category === 'source')
      .map(f => path.dirname(f.rel))
      .filter(d => d !== '.' && d !== 'src')
  )].slice(0, 6);

  let deps = '';
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
    const d = Object.keys({ ...pkg.dependencies }).slice(0, 8);
    deps = d.join(', ');
  } catch {}

  let readmeSummary = '';
  const readmePath = path.join(rootDir, 'README.md');
  if (fs.existsSync(readmePath)) {
    readmeSummary = readSafe(readmePath, 30);
  }

  const tree = files
    .filter(f => f.category !== 'other')
    .map(f => f.rel)
    .sort()
    .slice(0, 80)
    .join('\n');

  const summary = [
    `Project: ${projectName}`,
    `Stack: ${stack}`,
    `Files: ${counts.source} source, ${counts.test} test, ${counts.config} config`,
    `Entry: ${entry}`,
    keyDirs.length ? `Key dirs: ${keyDirs.map(d => d + '/').join(', ')}` : '',
    deps ? `Dependencies: ${deps}` : '',
  ].filter(Boolean).join('\n');

  return {
    rootDir,
    projectName,
    files,
    stack,
    entry,
    summary,
    tree,
    readmeSummary,
    counts,
  };
}
