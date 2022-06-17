# Modules-projen

This repository contains an NPM package that can be used to create a new Projen project.

```bash
npx projen new --from @gemeentenijmegen/modules-projen
```

The project type `GemeenteNijmegenCdkApp` provides a number of default configurations and provides features used within our organization. There are:
- Comments with CloudFormation template diffs on PRs
- Cfn-lint Github wrokflow
- Defautl configuration values