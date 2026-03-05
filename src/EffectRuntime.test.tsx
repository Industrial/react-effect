/// <reference lib="dom" />
import { describe, expect, it } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import {
  EffectRuntimeProvider,
  useEffectRuntime,
} from './EffectRuntime'

describe('EffectRuntime', () => {
  it('provides runtime to children and useEffectRuntime returns it', () => {
    function Consumer() {
      const { runtime } = useEffectRuntime()
      return createElement('span', { 'data-testid': 'has-runtime' }, runtime ? 'yes' : 'no')
    }
    render(
      createElement(EffectRuntimeProvider, null, createElement(Consumer)),
    )
    expect(screen.getByTestId('has-runtime').textContent).toBe('yes')
  })

  it('useEffectRuntime throws when used outside provider', () => {
    function Consumer() {
      useEffectRuntime()
      return null
    }
    expect(() => render(createElement(Consumer))).toThrow(
      'useEffectRuntime must be used within an EffectRuntimeProvider',
    )
  })
})
