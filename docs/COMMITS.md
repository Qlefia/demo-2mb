# Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/) for clear, professional history.

## Format

```
<type>(<scope>): <description>

[optional body]
```

## Types

| Type | Use for |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change, no feature/fix |
| `perf` | Performance improvement |
| `test` | Adding/updating tests |
| `chore` | Build, deps, tooling |

## Examples

```
feat(auth): add dark mode support for login form
fix(switch): thumb invisible on dark theme
docs: add Supabase dev/prod setup guide
refactor(billing): use semantic tokens for borders
chore(deps): bump next to 16.0.0
```

## Scope (optional)

- `auth`, `billing`, `leads`, `builder`, `ui`, `deps`, etc.
