# @cadamsdev/lazy-changesets
## 0.2.0

### 🚀 feat
- Added support for customizing changeset types.

Here's an example.

`.changeset/config.json`
```json
{
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [],
  "access": "restricted",
  "lazyChangesets": {
    "types": {
      "feat": {
        "displayName": "New Features",
        "emoji": "🚀",
        "sort": 0,
        "releaseType": "minor",
        "promptBreakingChange": true
      },
      "fix": {
        "displayName": "Bug Fixes",
        "emoji": "🐛",
        "sort": 1,
        "promptBreakingChange": true
      },
      "perf": {
        "displayName": "Performance Improvements",
        "emoji": "⚡️",
        "sort": 2,
        "promptBreakingChange": true
      },
      "chore": {
        "displayName": "Chores",
        "emoji": "🏠",
        "sort": 3
      }
    }
  }
}
```


## 0.1.0

### 🚀 feat
- Added `--empty` flag to allow creating empty changesets.
