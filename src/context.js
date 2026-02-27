import fs from 'fs';
import path from 'path';

const MAX_FILES = 10;
const MAX_LINES_PER_FILE = 100;

function scoreFile(file, keywords) {
  let score = 0;
  const nameLower = file.name.toLowerCase();
  const relLower = file.rel.toLowerCase();

  for (const kw of keywords) {
    if (nameLower.includes(kw)) score += 3;
    if (relLower.includes(kw)) score += 2;
  }

  return score;
}

function extractKeywords(question) {
  const stopWords = new Set([
    'how', 'does', 'where', 'are', 'what', 'would', 'if', 'the',
    'a', 'an', 'in', 'is', 'it', 'this', 'that', 'to', 'and',
    'or', 'for', 'of', 'with', 'can', 'i', 'me', 'my', 'do',
    'explain', 'tell', 'show', 'find', 'get', 'which', 'why',
    'when', 'who', 'all', 'any', 'from', 'about', 'work', 'works',
    'delete', 'remove', 'break', 'file',
  ]);

  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
}

function readFileSafe(filepath, maxLines = MAX_LINES_PER_FILE) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const lines = content.split('\n');
    const truncated = lines.length > maxLines;
    return lines.slice(0, maxLines).join('\n') + (truncated ? `\n... (${lines.length - maxLines} more lines)` : '');
  } catch {
    return null;
  }
}

export function buildContext(question, scan) {
  const keywords = extractKeywords(question);
  const { files, rootDir, summary, readmeSummary, entry, tree } = scan;

  const sourceFiles = files.filter(f =>
    ['source', 'config'].includes(f.category) && f.name !== 'package-lock.json'
  );

  const scored = sourceFiles
    .map(f => ({ ...f, score: scoreFile(f, keywords) }))
    .filter(f => f.score > 0)
    .sort((a, b) => b.score - a.score);

  const topFiles = scored.slice(0, MAX_FILES);

  const entryPath = path.join(rootDir, entry);
  if (fs.existsSync(entryPath) && !topFiles.find(f => f.path === entryPath)) {
    const entryFile = files.find(f => f.path === entryPath);
    if (entryFile) {
      topFiles.splice(Math.min(topFiles.length, 3), 0, entryFile);
    }
  }

  const fileContents = topFiles
    .slice(0, MAX_FILES)
    .map(f => {
      const content = readFileSafe(f.path);
      if (!content) return null;
      return `--- ${f.rel} ---\n${content}`;
    })
    .filter(Boolean)
    .join('\n\n');

  const contextParts = [
    '## Codebase Overview',
    summary,
    '',
    readmeSummary ? `## README\n${readmeSummary.slice(0, 500)}` : '',
    '',
    fileContents ? `## Relevant Files\n${fileContents}` : '',
  ].filter(s => s !== undefined);

  return {
    contextString: contextParts.join('\n'),
    includedFiles: topFiles.map(f => f.rel),
  };
}
