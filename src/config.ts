import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { ChangesetType } from './changeset.js';

export interface ChangesetConfig {
  access: 'restricted' | 'public';
  baseBranch: string;
  updateInternalDependencies: 'patch' | 'minor' | 'major' | 'none';
  ignore: string[];
  lazyChangesets: LazyChangeset;
}

export interface LazyChangeset {
  types: {
    [key: string]: ChangesetType;
  };
}

export function readConfig(): ChangesetConfig {
  const changesetsDir = '.changeset';

  if (!existsSync(changesetsDir)) {
    throw new Error(`Directory ${changesetsDir} does not exist.`);
  }

  const configPath = path.join(changesetsDir, 'config.json');

  if (!existsSync(configPath)) {
    throw new Error(`File ${configPath} does not exist.`);
  }

  const fileData = readFileSync(configPath, 'utf-8');
  const config = JSON.parse(fileData) as ChangesetConfig;
  return {
    ...config,
    access: config.access || 'restricted',
    baseBranch: config.baseBranch || 'main',
    updateInternalDependencies: config.updateInternalDependencies || 'patch',
    ignore: config.ignore || [],
    lazyChangesets: {
      ...config.lazyChangesets,
      types: config.lazyChangesets?.types
        ? config.lazyChangesets?.types
        : defaultChangesetTypes,
    },
  };
}

const defaultChangesetTypes: Record<string, ChangesetType> = {
  feat: {
    displayName: 'New Features',
    emoji: '🚀',
    sort: 0,
    releaseType: 'minor',
    promptBreakingChange: true,
  },
  fix: {
    displayName: 'Bug Fixes',
    emoji: '🐛',
    sort: 1,
    promptBreakingChange: true,
  },
  perf: {
    displayName: 'Performance Improvements',
    emoji: '⚡️',
    sort: 2,
    promptBreakingChange: true,
  },
  chore: {
    displayName: 'Chores',
    emoji: '🏠',
    sort: 3,
  },
  docs: {
    displayName: 'Documentation',
    emoji: '📚',
    sort: 4,
  },
  style: {
    displayName: 'Styles',
    emoji: '🎨',
    sort: 5,
  },
  refactor: {
    displayName: 'Refactoring',
    emoji: '♻️',
    sort: 6,
    promptBreakingChange: true,
  },
  test: {
    displayName: 'Tests',
    emoji: '✅',
    sort: 7,
  },
  build: {
    displayName: 'Build',
    emoji: '📦',
    sort: 8,
    promptBreakingChange: true,
  },
  ci: {
    displayName: 'Automation',
    emoji: '🤖',
    sort: 9,
  },
  revert: {
    displayName: 'Reverts',
    emoji: '⏪',
    sort: 10,
    promptBreakingChange: true,
  },
};
