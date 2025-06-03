export interface ChangesetType {
  displayName: string;
  emoji: string;
  sort: number;
  releaseType?: 'major' | 'minor' | 'patch';
  promptBreakingChange?: boolean;
}
