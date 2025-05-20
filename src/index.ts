#!/usr/bin/env node

import {
  multiselect,
  select,
  text,
  confirm,
  isCancel,
  cancel,
} from '@clack/prompts';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { globSync } from 'tinyglobby';
import { defineCommand, runMain } from 'citty';
import path from 'path';
import { humanId } from 'human-id';
import pc from 'picocolors';

interface ChangesetConfig {
  baseBranch: string;
  updateInternalDependencies: string;
  ignore: string[];
}

const DEFAULT_CONFIG: ChangesetConfig = {
  baseBranch: 'main',
  updateInternalDependencies: 'patch',
  ignore: [],
}

async function findPackages(config: ChangesetConfig): Promise<Map<string, string>> {
  const packageJsonPaths = globSync({
    patterns: ['**/package.json', '!**/node_modules/**', '!**/dist/**'],
  });

  const packageMap: Map<string, string> = new Map();

  for (const packageJsonPath of packageJsonPaths) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const packageName = packageJson.name;
    if (!packageName) {
      console.warn(`No name found in ${packageJsonPath}`);
      continue;
    }

    if (config.ignore.includes(packageName)) {
      console.warn(`Ignoring package ${packageName}`);
      continue;
    }

    const dirPath = './' + packageJsonPath.replace(/\/?package\.json$/, '');
    packageMap.set(packageJson.name, dirPath);
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

    if (isCancel(selected)) {
      cancel('Operation cancelled.');
      process.exit(0);
    }

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
      empty: {
        type: 'boolean',
        description: 'Create an empty changeset',
        required: false,
        default: false,
      },
    },
    run: async ({ args }) => {
      if (args.init) {
        await init();
        return;
      }

      const config = readConfigFile();

      if (args.empty) {
        const changesetDir = path.join(process.cwd(), '.changeset');

        if (!existsSync(changesetDir)) {
          mkdirSync(changesetDir);
        }

        const changesetID = humanId({
          separator: '-',
          capitalize: false,
        });

        const changesetFileName = `${changesetID}.md`;
        const changesetFilePath = path.join(changesetDir, changesetFileName);
        const markdownContent = '---\n---\n\n';
        writeFileSync(changesetFilePath, markdownContent, {
          encoding: 'utf-8',
        });

        console.log(
          pc.green('Empty Changeset added! - you can now commit it\n')
        );
        console.log(
          pc.green(
            'If you want to modify or expand on the changeset summary, you can find it here'
          )
        );
        console.log(pc.cyan('info'), pc.blue(changesetFilePath));
        return;
      }

      const packages = await findPackages(config);

      if (packages.size === 0) {
        console.log('No packages found.');
        return;
      }

      const selectedPackages = await getSelectedPackages(packages);
      if (selectedPackages.length === 0) {
        console.log('No packages selected.');
        return;
      }

      const msgType = await select({
        message: 'Select message type',
        options: [
          { value: 'chore', label: 'Chore 🏠' },
          { value: 'fix', label: 'Fix 🛠️' },
          { value: 'feat', label: 'Feature 🚀' },
          { value: 'docs', label: 'Documentation 📚' },
          { value: 'style', label: 'Styles 🎨' },
          { value: 'refactor', label: 'Refactor ♻️' },
          { value: 'test', label: 'Tests ✅' },
          { value: 'perf', label: 'Performance ⚡️' },
          { value: 'build', label: 'Build 📦' },
          { value: 'ci', label: 'CI 🤖' },
          { value: 'revert', label: 'Revert ⏪' },
        ],
      });

      if (isCancel(msgType)) {
        cancel('Operation cancelled.');
        process.exit(0);
      }

      let isBreakingChange = false;

      if (
        msgType === 'feat' ||
        msgType === 'fix' ||
        msgType === 'refactor' ||
        msgType === 'perf' ||
        msgType === 'build' ||
        msgType === 'revert'
      ) {
        const tempIsBreakingChange = await confirm({
          message: 'Is this a breaking change?',
          initialValue: false,
        });

        if (isCancel(tempIsBreakingChange)) {
          cancel('Operation cancelled.');
          process.exit(0);
        }

        isBreakingChange = tempIsBreakingChange;
      }

      const msg = await text({
        message: 'Enter a message for the changeset',
        placeholder: 'e.g Added x feature',
        validate(value) {
          if (value.length === 0) return 'Message cannot be empty.';
        },
      });

      if (isCancel(msg)) {
        cancel('Operation cancelled.');
        process.exit(0);
      }

      const changesetDir = path.join(process.cwd(), '.changeset');

      // create the changeset directory if it doesn't exist
      if (!existsSync(changesetDir)) {
        mkdirSync(changesetDir);
      }

      const changesetID = humanId({
        separator: '-',
        capitalize: false,
      });

      const changesetFileName = `${changesetID}.md`;
      const changesetFilePath = path.join(changesetDir, changesetFileName);
      let changesetContent = '---\n';
      selectedPackages.forEach((pkg) => {
        changesetContent += `"${pkg}": ${msgType.toString()}${
          isBreakingChange ? '!' : ''
        }\n`;
      });

      changesetContent += '---\n\n';
      changesetContent += `${msg.toString()}\n`;

      // write the changelog to the changeset file
      writeFileSync(changesetFilePath, changesetContent, {
        encoding: 'utf-8',
      });
    },
  });

  runMain(main);
}

function readConfigFile(): ChangesetConfig {
  let config: ChangesetConfig = {...DEFAULT_CONFIG };

  const configFilePath = path.join(process.cwd(), '.changeset', 'config.json');
  if (existsSync(configFilePath)) {
    const configFile = readFileSync(configFilePath, 'utf-8');
    config = JSON.parse(configFile);
  }

  return config;
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
    writeFileSync(configFilePath, JSON.stringify(DEFAULT_CONFIG, null, 2));
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
