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

  console.log(chalk.gray('You\'ll need your Firebase service account credentials.'));
  console.log(chalk.gray('Get them from: Firebase Console > Project Settings > Service Accounts > Generate New Private Key\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectId',
      message: 'Firebase Project ID:',
      validate: (input: string) => input.length > 0 || 'Project ID is required',
    },
    {
      type: 'input',
      name: 'clientEmail',
      message: 'Service Account Email:',
      validate: (input: string) =>
        input.includes('@') || 'Please enter a valid service account email',
    },
    {
      type: 'password',
      name: 'privateKey',
      message: 'Private Key (paste the entire key including BEGIN/END):',
      validate: (input: string) =>
        input.includes('PRIVATE KEY') || 'Please paste the complete private key',
    },
    {
      type: 'confirm',
      name: 'configureGemini',
      message: 'Configure Gemini API for AI-powered insights? (optional)',
      default: false,
    },
  ]);

  let geminiKey: string | undefined;
  if (answers.configureGemini) {
    const geminiAnswer = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Gemini API Key:',
        validate: (input: string) => input.length > 0 || 'API key is required',
      },
    ]);
    geminiKey = geminiAnswer.apiKey;
  }

  const config: ClaudeInsightConfig = {
    firebase: {
      projectId: answers.projectId,
      clientEmail: answers.clientEmail,
      privateKey: answers.privateKey,
    },
    sync: {
      claudeDir: '~/.claude/projects',
      excludeProjects: [],
    },
  };

  if (geminiKey) {
    config.gemini = { apiKey: geminiKey };
  }

  saveConfig(config);

  console.log(chalk.green('\n✅ Configuration saved!'));
  console.log(chalk.gray(`Config location: ${getConfigDir()}/config.json`));
  console.log(chalk.cyan('\nNext steps:'));
  console.log(chalk.white('  1. Run `claudeinsight sync` to sync your sessions'));
  console.log(chalk.white('  2. Start the dashboard with `cd web && pnpm dev`'));
}
