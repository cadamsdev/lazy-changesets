#!/usr/bin/env node

import { multiselect, select, text } from '@clack/prompts';
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

async function getSelectedPackages(packages: Map<string, string>): Promise<string[]> {
  const selectedPackages: string[] = [];

  if (packages.size > 1) {
    const selected = await multiselect({
      message: 'Select the packages you want to add a changeset for:',
      options: Array.from(packages.keys()).map((pkg) => ({
        value: pkg,
        label: pkg,
      })),
    });

    selectedPackages.push(...selected as string[]);
  } else if (packages.size === 1) {
    const selectedPackage = Array.from(packages.keys())[0];
    selectedPackages.push(selectedPackage);
  }

  return selectedPackages;
}

async function main() {
  console.log('Welcome to the Conventional Changesets CLI!');

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
        { value: 'chore', label: '🏠 Chore' },
        { value: 'fix', label: '🛠️ Fix' },
        { value: 'feat', label: '🚀 Feature' },
        { value: 'doc', label: '📚 Documentation' },
        { value: 'styl', label: '🎨 Styles' },
        { value: 'ref', label: '♻️ Refactor' },
        { value: 'test', label: '✅ Tests' },
      ],
    });

    const msg = await text({
      message: `Enter a message for the changeset for ${packageName}:`,
      placeholder: 'e.g Added x feature',
      validate(value) {
        if (value.length === 0) return 'Message cannot be empty.';
      },
    });

    changelog.push(`- ${packageName}: ${msgType.toString()}: ${msg.toString()}`);
  }

  console.log('\nGenerated Changelog:');
  console.log(changelog.join('\n'));
}

main().catch((err) => {
  console.error('An error occurred:', err);
  process.exit(1);
});
