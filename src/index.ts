#!/usr/bin/env node

import { multiselect, select, text } from '@clack/prompts';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { globSync } from 'tinyglobby';
import { defineCommand, runMain } from 'citty';
import path from 'path';

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

async function getSelectedPackages(
  packages: Map<string, string>
): Promise<string[]> {
  const selectedPackages: string[] = [];

  if (packages.size > 1) {
    const selected = await multiselect({
      message: 'Which packages would you like to include?',
      options: Array.from(packages.keys())
        .sort((a, b) => a.localeCompare(b))
        .map((pkg) => ({
          value: pkg,
          label: pkg,
        })),
    });

    selectedPackages.push(...(selected as string[]));
  } else if (packages.size === 1) {
    const selectedPackage = Array.from(packages.keys())[0];
    selectedPackages.push(selectedPackage);
  }

  return selectedPackages;
}

async function main() {
  const main = defineCommand({
    meta: {
      name: 'conventional-changesets',
      description: 'A CLI tool for generating conventional changesets',
    },
    args: {
      init: {
        type: 'positional',
        description: 'Initialize changesets',
        required: false,
      },
    },
    run: async ({ args }) => {
      if (args.init) {
        await init();
        return;
      }

      const packages = await findPackages();

      if (packages.size === 0) {
        console.log('No packages found.');
        return;
      }

      const selectedPackages = await getSelectedPackages(packages);
      if (selectedPackages.length === 0) {
        console.log('No packages selected.');
        return;
      }

      const changelog: string[] = [];

      for (const packageName of selectedPackages) {
        const msgType = await select({
          message: `Select the type of changeset for ${packageName}:`,
          options: [
            { value: 'chore', label: 'Chore 🏠' },
            { value: 'fix', label: 'Fix 🛠️' },
            { value: 'feat', label: 'Feature 🚀' },
            { value: 'doc', label: 'Documentation 📚' },
            { value: 'styl', label: 'Styles 🎨' },
            { value: 'ref', label: 'Refactor ♻️' },
            { value: 'test', label: 'Tests ✅' },
          ],
        });

        const msg = await text({
          message: `Enter a message for the changeset for ${packageName}:`,
          placeholder: 'e.g Added x feature',
          validate(value) {
            if (value.length === 0) return 'Message cannot be empty.';
          },
        });

        changelog.push(
          `- ${packageName}: ${msgType.toString()}: ${msg.toString()}`
        );
      }

      console.log('\nGenerated Changelog:');
      console.log(changelog.join('\n'));
    },
  });

  runMain(main);
}

async function init() {
  console.log('Initializing changesets...');
  const changesetDir = path.join(process.cwd(), '.changeset');
  if (!existsSync(changesetDir)) {
    mkdirSync(changesetDir);
    console.log('Created .changeset directory');
  }

  // create config file
  const configFilePath = path.join(changesetDir, 'config.json');
  if (!existsSync(configFilePath)) {
    const config = {
      baseBranch: 'main',
      updateInternalDependencies: 'patch',
      ignore: [],
    };
    writeFileSync(configFilePath, JSON.stringify(config, null, 2));
    console.log('Created config.json file');
  }

  // create README file
  const readmeFilePath = path.join(changesetDir, 'README.md');
  if (!existsSync(readmeFilePath)) {
    const readmeContent = getReadmeContent();
    writeFileSync(readmeFilePath, readmeContent);
    console.log('Created README.md file');
  }

  console.log('Changesets initialized');
}

function getReadmeContent() {
  return `
  # Conventional Changesets
  - TODO
  `;
}

main().catch((err) => {
  console.error('An error occurred:', err);
  process.exit(1);
});
