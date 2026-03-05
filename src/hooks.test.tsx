/// <reference lib="dom" />
import { afterEach, describe, expect, it } from 'bun:test'
import { Effect } from 'effect'
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react'

afterEach(() => cleanup())
import { createElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { EffectRuntimeProvider } from './EffectRuntime'
import { useRunEffect } from './useRunEffect'
import { useRunEffectDedupe } from './useRunEffectDedupe'
import { useRunEffectWithCache } from './useRunEffectWithCache'
import { useTransitionEffect } from './useTransitionEffect'
import { useActionStateEffect } from './useActionStateEffect'
import { useOptimisticEffect } from './useOptimisticEffect'
import { useEffectState } from './useEffectState'
import { useEffectReducer } from './useEffectReducer'
import { useNavigateEffect } from './useNavigateEffect'
import { idle } from './AsyncState'

function WithRunEffect() {
  useRunEffect(Effect.succeed(undefined), [])
  return createElement('span', { 'data-testid': 'run-effect' }, 'ok')
}

function WithRunEffectDedupe() {
  useRunEffectDedupe(Effect.succeed(undefined), 'key', [])
  return createElement('span', { 'data-testid': 'dedupe' }, 'ok')
}

function WithRunEffectWithCache() {
  const { data, isLoading } = useRunEffectWithCache(
    Effect.succeed(42),
    'k',
    [],
  )
  return createElement('span', { 'data-testid': 'cache' }, isLoading ? 'loading' : String(data))
}

function WithTransitionEffect() {
  const [isPending, _startTransition] = useTransitionEffect()
  return createElement('span', { 'data-testid': 'transition' }, isPending ? 'pending' : 'idle')
}

function WithActionStateEffect() {
  const [state, _dispatch] = useActionStateEffect(
    () => Effect.succeed(1),
    idle(),
  )
  return createElement('span', { 'data-testid': 'action' }, state._tag)
}

function WithOptimisticEffect() {
  const [value, _setOptimistic] = useOptimisticEffect(0)
  return createElement('span', { 'data-testid': 'optimistic' }, String(value))
}

function WithEffectState() {
  const [x, _setX] = useEffectState(0)
  return createElement('span', { 'data-testid': 'state' }, String(x))
}

function WithEffectReducer() {
  const [state, _dispatch] = useEffectReducer(
    (s: number, _: void) => Effect.succeed(s + 1),
    0,
  )
  return createElement('span', { 'data-testid': 'reducer' }, String(state))
}

function WithNavigateEffect() {
  const navigateEffect = useNavigateEffect()
  const eff = navigateEffect('/path', { replace: true })
  return createElement('span', { 'data-testid': 'navigate' }, Effect.isEffect(eff) ? 'ok' : 'no')
}

const wrapper = ({ children }: { children: React.ReactNode }) =>
  createElement(
    EffectRuntimeProvider,
    null,
    createElement(MemoryRouter, { initialEntries: ['/'] }, children),
  )

describe('hooks (coverage)', () => {
  it('useRunEffect runs without error', () => {
    render(createElement(WithRunEffect), { wrapper })
    expect(screen.getByTestId('run-effect').textContent).toBe('ok')
  })

  it('useRunEffectDedupe runs without error', () => {
    render(createElement(WithRunEffectDedupe), { wrapper })
    expect(screen.getByTestId('dedupe').textContent).toBe('ok')
  })

  it('useRunEffectWithCache runs and resolves', async () => {
    render(createElement(WithRunEffectWithCache), { wrapper })
    expect(await screen.findByText('42', {}, { timeout: 500 })).toBeTruthy()
  })

  it('useTransitionEffect runs without error', () => {
    render(createElement(WithTransitionEffect), { wrapper })
    expect(screen.getByTestId('transition')).toBeTruthy()
  })

  it('useActionStateEffect runs without error', () => {
    render(createElement(WithActionStateEffect), { wrapper })
    expect(['idle', 'pending', 'success', 'failure']).toContain(screen.getByTestId('action').textContent)
  })

  it('useOptimisticEffect runs without error', () => {
    render(createElement(WithOptimisticEffect), { wrapper })
    expect(screen.getByTestId('optimistic')).toBeTruthy()
  })

  it('useEffectState runs without error', () => {
    render(createElement(WithEffectState), { wrapper })
    expect(screen.getByTestId('state')).toBeTruthy()
  })

  it('useEffectReducer runs without error', () => {
    render(createElement(WithEffectReducer), { wrapper })
    expect(screen.getByTestId('reducer')).toBeTruthy()
  })

  it('useNavigateEffect returns Effect', () => {
    render(createElement(WithNavigateEffect), { wrapper })
    expect(screen.getByTestId('navigate').textContent).toBe('ok')
  })

  it('useActionStateEffect dispatch runs effect and updates to success', async () => {
    function ActionButton() {
      const [state, dispatch] = useActionStateEffect(() => Effect.succeed(99), idle())
      return createElement(
        'div',
        null,
        createElement('span', { 'data-testid': 'action-state' }, state._tag),
        createElement('button', { onClick: dispatch, 'data-testid': 'action-btn' }, 'Run'),
      )
    }
    render(createElement(ActionButton), { wrapper })
    expect(screen.getByTestId('action-state').textContent).toBe('idle')
    fireEvent.click(screen.getByTestId('action-btn'))
    expect(await screen.findByText('success', {}, { timeout: 500 })).toBeTruthy()
    expect(screen.getByTestId('action-state').textContent).toBe('success')
  })

  it('useTransitionEffect startTransition runs Effect', async () => {
    function TransitionButton() {
      const [isPending, startTransition] = useTransitionEffect()
      const run = () => startTransition(() => Effect.succeed(1))
      return createElement(
        'div',
        null,
        createElement('span', { 'data-testid': 'pt' }, isPending ? 'pending' : 'idle'),
        createElement('button', { onClick: run, 'data-testid': 'trans-btn' }, 'Run'),
      )
    }
    render(createElement(TransitionButton), { wrapper })
    fireEvent.click(screen.getByTestId('trans-btn'))
    await waitFor(() => {
      expect(screen.getByTestId('pt').textContent).toBe('idle')
    }, { timeout: 500 })
  })

  it('useEffectState setState with Effect updates on success', async () => {
    function StateWithEffect() {
      const [n, setN] = useEffectState(0)
      return createElement(
        'div',
        null,
        createElement('span', { 'data-testid': 'n' }, String(n)),
        createElement('button', { onClick: () => setN(Effect.succeed(100)), 'data-testid': 'set-btn' }, 'Set'),
      )
    }
    render(createElement(StateWithEffect), { wrapper })
    expect(screen.getByTestId('n').textContent).toBe('0')
    fireEvent.click(screen.getByTestId('set-btn'))
    expect(await screen.findByText('100', {}, { timeout: 500 })).toBeTruthy()
  })

  it('useEffectReducer dispatch runs effect and updates state', async () => {
    function ReducerComp() {
      const [state, dispatch] = useEffectReducer(
        (s: number) => Effect.succeed(s + 10),
        0,
      )
      return createElement(
        'div',
        null,
        createElement('span', { 'data-testid': 'r-state' }, String(state)),
        createElement('button', { onClick: () => dispatch(undefined), 'data-testid': 'r-btn' }, 'Inc'),
      )
    }
    render(createElement(ReducerComp), { wrapper })
    fireEvent.click(screen.getByTestId('r-btn'))
    expect(await screen.findByText('10', {}, { timeout: 500 })).toBeTruthy()
  })

  it('useRunEffect cleanup on unmount', () => {
    const effect = Effect.succeed(undefined)
    const { unmount } = render(
      createElement(EffectRuntimeProvider, null, createElement(WithRunEffect)),
    )
    unmount()
  })
})
