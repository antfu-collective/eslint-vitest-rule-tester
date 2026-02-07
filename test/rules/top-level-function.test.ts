import type { TestCasesOptions } from '../../src'
import * as tsParser from '@typescript-eslint/parser'
import { expect } from 'vitest'
import { run } from '../../src'
import rule, { RULE_NAME } from './top-level-function'

const valids = [
  'function foo() {}',
  // allow arrow function inside function
  'function foo() { const bar = () => {} }',
  // allow arrow function when type is specified
  'const Foo: Bar = () => {}',
  // allow let/var
  'let foo = () => {}',
  // allow arrow function in as
  'const foo = (() => {}) as any',
  // allow iife
  ';(() => {})()',
  // allow export default
  'export default () => {}',
  'export default defineConfig(() => {})',
  // allow one-line arrow function
  'const foo = (x, y) => x + y',
  'const foo = async (x, y) => x + y',
  'const foo = () => String(123)',
  'const foo = () => ({})',
] satisfies TestCasesOptions['valid']

const invalids = [
  {
    code: 'const foo = (x, y) => \nx + y',
    output: 'function foo (x, y) {\n  return x + y\n}',
    errors: [{ messageId: 'topLevelFunctionDeclaration' }],
  },
  {
    code: 'const foo = (as: string, bar: number) => { return as + bar }',
    output: 'function foo (as: string, bar: number) { return as + bar }',
    errors: [{ messageId: 'topLevelFunctionDeclaration' }],
  },
  {
    code: 'const foo = <K, T extends Boolean>(as: string, bar: number): Omit<T, K> => \nas + bar',
    output: 'function foo <K, T extends Boolean>(as: string, bar: number): Omit<T, K> {\n  return as + bar\n}',
    errors: [{ messageId: 'topLevelFunctionDeclaration' }],
  },
  {
    code: 'export const foo = () => {}',
    output: 'export function foo () {}',
    errors: [{ messageId: 'topLevelFunctionDeclaration' }],
  },
  {
    code: 'export const foo = () => \n({})',
    output: 'export function foo () {\n  return {}\n}',
    errors: [{ messageId: 'topLevelFunctionDeclaration' }],
  },
  {
    code: 'export const foo = async () => \n({})',
    output: 'export async function foo () {\n  return {}\n}',
    errors: [{ messageId: 'topLevelFunctionDeclaration' }],
  },
] satisfies TestCasesOptions['invalid']

run({
  name: RULE_NAME,
  rule: rule as any,
  languageOptions: {
    parser: tsParser,
  },

  valid: valids,
  invalid: invalids,

  onResult(_case, result) {
    if (_case.type === 'invalid')
      expect(result.output).toMatchSnapshot()
  },
})
