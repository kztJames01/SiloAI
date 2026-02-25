# Contributing to ACM Projects

Welcome! We are excited to have you contribute to this project. To maintain high code quality and keep our project history clean, we follow a strict **Forking Workflow** based on our Spring 2026 Engineering Standards.

## The Workflow

Because we emulate an industry-standard company structure to enforce PR reviews, **you cannot push code directly to this repository**. You must fork it first.

### 1. Fork the Repository
Click the **Fork** button in the top right corner of this repository page to create a personal copy on your own GitHub account.

### 2. Clone Your Fork Locally
Clone *your personal fork* (not the `acmuta` repo) to your machine:
```bash
git clone https://github.com/YOUR-USERNAME/{{REPO}}.git
cd {{REPO}}
```

### 3. Add the Upstream Remote (Optional but Recommended)
To keep your fork up to date with the main project:
```bash
git remote add upstream https://github.com/acmuta/{{REPO}}.git
```

### 4. Create a Feature Branch
Always work on a focused feature branch. Do not work on `main`.
```bash
git checkout -b feat/my-new-feature
# or fix/my-bug-fix
```

### 5. Commit Using Conventional Commits
We use standard prefixes for all commits:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting/whitespace changes
- `refactor:` for code restructuring without changing behavior

Example: `git commit -m "feat: add user login endpoint"`

### 6. Push and Open a Pull Request
Push your branch to *your fork*:
```bash
git push origin feat/my-new-feature
```
Then, go to the original `acmuta/{{REPO}}` repository and click **New pull request**. Select your fork and branch as the source, and the `acmuta` `main` branch as the destination.

## Code Reviews
- **No Self-Merges:** You cannot merge your own PR.
- **Peer Review Required:** You need at least one approval from your Project Manager (PM) before your code will be merged.
- **The Merge Process:** Only the PM (who has "Maintain" access) is physically able to click the "Merge Pull Request" button on the main repository.

## Testing and Linting
Please ensure you run all necessary linters and specific tests for your component before submitting a PR. Your PM may provide specific commands in the `README.md`.

Thank you for contributing!
