#!/usr/bin/env node

import inquirer from 'inquirer';
import { readFileSync } from 'fs';
import { globSync } from 'tinyglobby';

async function findPackages(): Promise<Map<string, string>> {
  const packageJsonPaths = globSync({
    patterns: ['**/package.json', '!**/node_modules/**', '!**/dist/**'],
  });

  const packageMap: Map<string, string> = new Map();

  for (const packageJsonPath of packageJsonPaths) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    if (packageJson.name) {
      const dirPath = './' + packageJsonPath.replace(/\/?package\.json$/, '');
      packageMap.set(packageJson.name, dirPath);
    }
  }

  return packageMap;
}

async function main() {
  console.log('Welcome to the Conventional Changesets CLI!');

  const packages = await findPackages();

  if (packages.size === 0) {
    console.log('No packages found.');
    return;
  }

  // Prompt the user to select packages
  const { selectedPackages } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedPackages',
      message: 'Select the packages you want to add a changeset for:',
      choices: Array.from(packages.keys()).sort((a, b) => a.localeCompare(b)),
    },
  ]);

  if (selectedPackages.length === 0) {
    console.log('No packages selected.');
    return;
  }

  console.log(`You selected: ${selectedPackages.join(', ')}`);

  const changelog: string[] = [];

  for (const packageName of selectedPackages) {
    // Prompt the user for the conventional commit type
    const { commitType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'commitType',
        message: `Select the type of changeset for ${packageName}:`,
        choices: [
          '🏠 Chore',
          '🛠️ Fix',
          '🚀 Feature',
          '📚 Documentation',
          '🎨 Styles',
          '♻️ Refactor',
          '✅ Tests',
        ],
      },
    ]);

    const { changesetMessage } = await inquirer.prompt([
      {
        type: 'input',
        name: 'changesetMessage',
        message: `Enter a message for the changeset for ${packageName}:`,
        validate: (input) => input.length > 0 || 'Message cannot be empty.',
      },
    ]);

    changelog.push(`- ${packageName}: ${commitType} - ${changesetMessage}`);
  }

  console.log('\nGenerated Changelog:');
  console.log(changelog.join('\n'));
}

main().catch((err) => {
  console.error('An error occurred:', err);
  process.exit(1);
});
