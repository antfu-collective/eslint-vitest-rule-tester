---
name: eslint-vitest-rule-tester
description: Help users test ESLint rules with Vitest, supporting snapshot testing and custom assertions
meta:
  version: 3.0.1
  author: Anthony Fu
---

# Instructions

You are helping users work with `eslint-vitest-rule-tester`, a library that provides ESLint rule testing with Vitest integration.

## Core APIs

**Two testing approaches:**

1. **`run({ name, rule, valid, invalid, ...config })`** - All-in-one object style (config directly in object)
2. **`createRuleTester({ name, rule, configs })`** - Returns `{ valid, invalid }` for explicit Vitest `describe`/`it` blocks (note: `configs` key, not `languageOptions`)

**Key extensions:**
- `output` and `errors` fields can be functions for custom assertions and snapshots
- `onResult` hook for full result object validation
- No `globals: true` required in Vitest config

## When Helping Users

**Identify testing style first:**
- Check if they have existing tests to match their pattern
- Default to `run()` for simplicity (see Pattern 1 below)
- Use `createRuleTester()` for explicit Vitest test blocks with individual `it()` tests (Pattern 3)

**Configuration:**
- Use `languageOptions.parser: tsParser` for TypeScript (import from `@typescript-eslint/parser`)
- Use `languageOptions.parserOptions` for JS options (ecmaVersion, sourceType)
- Put shared config in tester initialization, not in every test case
- Note: In `createRuleTester`, config goes under `configs` key, not at top level

**Type safety:**
- Use `satisfies TestCasesOptions['valid']` for valid test arrays
- Use `satisfies TestCasesOptions['invalid']` for invalid test arrays
- Extract test cases as constants before passing to `run()` (see Pattern 1)

**Snapshots:**
- Use `onResult` hook with `toMatchSnapshot()` for all invalid cases (Pattern 1)
- Use function-based `output`/`errors` with `toMatchInlineSnapshot()` for inline snapshots (Pattern 2)
- Recommend `toMatchInlineSnapshot()` over `toMatchSnapshot()` when possible for better visibility

**Common patterns:**

```ts
// Pattern 1: run() with extracted test cases (from top-level-function.test.ts)
import type { TestCasesOptions } from 'eslint-vitest-rule-tester'
import { run } from 'eslint-vitest-rule-tester'
import { expect } from 'vitest'
import * as tsParser from '@typescript-eslint/parser'

const valids = [
  'function foo() {}',
  // allow arrow function inside function
  'function foo() { const bar = () => {} }',
] satisfies TestCasesOptions['valid']

const invalids = [
  {
    code: 'const foo = () => {}',
    output: 'function foo () {}',
    errors: [{ messageId: 'topLevelFunctionDeclaration' }],
  },
] satisfies TestCasesOptions['invalid']

run({
  name: 'top-level-function',
  rule,
  languageOptions: { parser: tsParser },
  valid: valids,
  invalid: invalids,
  onResult(_case, result) {
    if (_case.type === 'invalid')
      expect(result.output).toMatchSnapshot()
  },
})

// Pattern 2: Function-based output/errors (from README)
run({
  name: 'rule-name',
  rule,
  invalid: [
    {
      code: 'let foo = 1',
      output(output) {
        expect(output.slice(0, 3)).toBe('let')
        expect(output).toMatchInlineSnapshot(`"const foo = 1;"`)
      },
      errors(errors) {
        expect(errors).toHaveLength(1)
        expect(errors.map(e => e.messageId))
          .toMatchInlineSnapshot(`["preferConst"]`)
      },
    },
  ],
})

// Pattern 3: Explicit test suites (from README)
import { createRuleTester } from 'eslint-vitest-rule-tester'
import { describe, it } from 'vitest'

describe('rule-name', () => {
  const { valid, invalid } = createRuleTester({
    name: 'rule-name',
    rule,
    configs: {
      languageOptions: {
        parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
      },
    },
  })

  it('valid case 1', () => {
    valid('const foo = 1')
  })

  it('invalid case 1 with snapshot', async () => {
    const { result } = await invalid({
      code: 'const foo = 1',
      errors: ['error-message-id'],
    })
    expect(result.output).toMatchSnapshot()
  })
})
```

## Troubleshooting

- **Version errors**: Requires ESLint v9.10+, check `package.json`
- **Snapshot failures**: Run `vitest -u` to update snapshots
- **Parser issues**: Add `languageOptions.parser` for TypeScript/JSX
- **Type errors**: Import from `eslint-vitest-rule-tester`, not `eslint`

## Best Practices

- **Match existing patterns** - Check existing test files in the project first
- **Extract test cases** - Define `valids` and `invalids` as constants with `satisfies` for type safety
- **Add comments** - Use inline comments to explain what each test case validates (e.g., `// allow arrow function inside function`)
- **Use snapshots** - Prefer `onResult` hook for bulk snapshot testing of all invalid cases
- **Consolidate config** - Put shared parser/language options at tester level, not per test case
- **TypeScript support** - Import `@typescript-eslint/parser` as `tsParser` and use in `languageOptions.parser`
- **Error format** - Use `errors: [{ messageId: 'errorId' }]` for structured errors, or `errors: ['errorId']` for simple cases
