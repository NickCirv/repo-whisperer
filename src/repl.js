import readline from 'readline';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export function startRepl(scan, onQuestion) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  const prompt = () => {
    rl.question(chalk.hex('#FB923C').bold('whisper> '), async (input) => {
      const line = input.trim();

      if (!line) {
        prompt();
        return;
      }

      if (line === 'exit' || line === 'quit') {
        console.log(chalk.dim('\nGoodbye.'));
        rl.close();
        process.exit(0);
      }

      if (line === 'tree') {
        console.log(chalk.cyan('\nFile tree:\n'));
        console.log(chalk.dim(scan.tree));
        console.log();
        prompt();
        return;
      }

      if (line.startsWith('read ')) {
        const target = line.slice(5).trim();
        const fullPath = path.isAbsolute(target)
          ? target
          : path.join(scan.rootDir, target);

        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          console.log(chalk.cyan(`\n--- ${target} ---\n`));
          console.log(chalk.dim(content));
          console.log();
        } catch {
          console.log(chalk.red(`\nCould not read: ${target}\n`));
        }

        prompt();
        return;
      }

      if (line === 'help') {
        console.log(chalk.dim('\nCommands:'));
        console.log(chalk.cyan('  tree') + chalk.dim('         — show project file tree'));
        console.log(chalk.cyan('  read <file>') + chalk.dim('  — display a file'));
        console.log(chalk.cyan('  exit') + chalk.dim('         — quit'));
        console.log(chalk.dim('\nAnything else is sent to the AI.\n'));
        prompt();
        return;
      }

      try {
        rl.pause();
        process.stdout.write(chalk.dim('\nThinking...\n\n'));
        const answer = await onQuestion(line);
        printAnswer(answer);
      } catch (err) {
        console.log(chalk.red(`\nError: ${err.message}\n`));
      } finally {
        rl.resume();
        prompt();
      }
    });
  };

  rl.on('close', () => process.exit(0));
  rl.on('SIGINT', () => {
    console.log(chalk.dim('\nGoodbye.'));
    process.exit(0);
  });

  prompt();
}

function printAnswer(answer) {
  const lines = answer.split('\n');

  for (const line of lines) {
    if (/^\s*\d+\.\s/.test(line)) {
      console.log(chalk.white(line));
    } else if (/^\s*[-*]\s/.test(line)) {
      console.log(chalk.white(line));
    } else if (line.includes('src/') || line.includes('.ts') || line.includes('.js') || line.includes('.py')) {
      const highlighted = line.replace(
        /([^\s]+\.(ts|js|tsx|jsx|py|go|rs|rb|java|php)[^\s:]*(?::\d+(?:-\d+)?)?)/g,
        (m) => chalk.cyan(m)
      );
      console.log(chalk.white(highlighted));
    } else if (/^(```|    )/.test(line)) {
      console.log(chalk.dim(line));
    } else {
      console.log(chalk.white(line));
    }
  }

  console.log();
}
