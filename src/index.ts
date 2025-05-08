#!/usr/bin/env node

import inquirer from 'inquirer';

async function main() {
  console.log('Welcome to the Conventional Changesets CLI!');

  // Prompt the user for the conventional commit type
  const { commitType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'commitType',
      message: 'What type of change are you making?',
      choices: [
        '🏠 Chore',
        '🛠️ Fix',
        '🚀 Feature',
        '📚 Documentation',
        '🎨 Styles',
        '♻️ Refactor',
        '✅ Tests',
        '⚡ Performance Improvements',
      ],
    },
  ]);

  console.log(`You selected: ${commitType}`);

  // Here you can add logic to handle the selected commit type
  // For example, generating a changeset file or performing other actions
}

main().catch((err) => {
  console.error('An error occurred:', err);
  process.exit(1);
});
