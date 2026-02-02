import inquirer from 'inquirer';
import chalk from 'chalk';
import { saveConfig, getConfigDir, isConfigured } from '../utils/config.js';
import type { ClaudeInsightConfig } from '../types.js';

/**
 * Initialize ClaudeInsight configuration
 */
export async function initCommand(): Promise<void> {
  console.log(chalk.cyan('\n🔧 ClaudeInsight Setup\n'));

  if (isConfigured()) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Configuration already exists. Overwrite?',
        default: false,
      },
    ]);

    if (!overwrite) {
      console.log(chalk.yellow('Setup cancelled.'));
      return;
    }
  }

  // Firebase Service Account (for CLI sync)
  console.log(chalk.bold('\n📋 Firebase Service Account Configuration\n'));
  console.log(chalk.gray('You\'ll need your Firebase service account credentials.'));
  console.log(chalk.gray('Get them from: Firebase Console > Project Settings > Service Accounts'));
  console.log(chalk.gray('Click "Generate New Private Key" and open the downloaded JSON file.\n'));

  const serviceAccountAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectId',
      message: 'Firebase Project ID:',
      validate: (input: string) => input.length > 0 || 'Project ID is required',
    },
    {
      type: 'input',
      name: 'clientEmail',
      message: 'Service Account Email (client_email from JSON):',
      validate: (input: string) =>
        input.includes('@') || 'Please enter a valid service account email',
    },
    {
      type: 'password',
      name: 'privateKey',
      message: 'Private Key (private_key from JSON, including BEGIN/END):',
      validate: (input: string) =>
        input.includes('PRIVATE KEY') || 'Please paste the complete private key',
    },
  ]);

  const config: ClaudeInsightConfig = {
    firebase: {
      projectId: serviceAccountAnswers.projectId,
      clientEmail: serviceAccountAnswers.clientEmail,
      privateKey: serviceAccountAnswers.privateKey,
    },
    sync: {
      claudeDir: '~/.claude/projects',
      excludeProjects: [],
    },
  };

  saveConfig(config);

  console.log(chalk.green('\n✅ Configuration saved!'));
  console.log(chalk.gray(`Config location: ${getConfigDir()}/config.json`));

  console.log(chalk.cyan('\n🎉 Setup complete! Next steps:\n'));
  console.log(chalk.white('  1. Sync your sessions:'));
  console.log(chalk.gray('     claudeinsight sync\n'));
  console.log(chalk.white('  2. Visit the web dashboard to configure and view your insights:'));
  console.log(chalk.gray('     https://claudeinsight.vercel.app\n'));
}
