import { Effect, Exit, Runtime, Scope } from 'effect'
import { useEffect, useRef } from 'react'
import { useEffectRuntime } from './EffectRuntime'

/**
 * Runs an Effect when deps change, but only one run per key at a time.
 * If the effect is re-invoked (e.g. React Strict Mode) with the same key while
 * a run is already in flight, the second invocation does not start another run.
 * Useful to avoid duplicate requests or subscriptions when React double-invokes
 * effects or when multiple components share the same logical key.
 *
 * @typeParam R - Requirements (context) for the Effect; must be provided by the runtime.
 * @param effect - The effect to run (typically void; runs in a forked scope). It will be interrupted when the key or deps change.
 * @param key - Logical key for this run. Only one run per key is in flight; same key skips. Use `null` to disable running.
 * @param deps - React dependency list; effect re-runs when deps change (and a new scope is created; previous run is cleaned up).
 * @param runtime - Optional. Runtime to run the effect with. If omitted, uses context ({@link useEffectRuntime}). If `null`, the effect is not run.
 * @returns Nothing. The effect runs asynchronously.
 *
 * @example
 * ```tsx
 * useRunEffectDedupe(
 *   subscribeToRoom(roomId),
 *   roomId ?? null,
 *   [roomId]
 * );
 * ```
 *
 * @see {@link useRunEffect} – same API without deduplication by key.
 */
export function useRunEffectDedupe<R>(
  effect: Effect.Effect<void, unknown, R>,
  key: string | null,
  deps: React.DependencyList,
  runtime?: Runtime.Runtime<R> | null,
): void {
  const resolvedRuntime =
    runtime !== undefined ? runtime : useEffectRuntime<R>().runtime
  type ScopeRef = Parameters<typeof Scope.close>[0]
  const scopeRef = useRef<ScopeRef | null>(null)
  const inFlightKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (resolvedRuntime === null || key === null) return
    if (inFlightKeyRef.current === key) return

    inFlightKeyRef.current = key

    const run = async () => {
      try {
        const scoped = Effect.gen(function* () {
          const scope = yield* Scope.make()
          yield* Effect.fork(Scope.extend(effect, scope))
          return scope
        })
        const scope = await Runtime.runPromise(resolvedRuntime)(
          scoped as Effect.Effect<Scope.CloseableScope, never, R>,
        )
        if (inFlightKeyRef.current === key) {
          scopeRef.current = scope
        } else {
          Runtime.runPromise(resolvedRuntime)(Scope.close(scope, Exit.void)).catch(
            () => {},
          )
        }
      } catch (_) {
        // Effect failed or was interrupted; ignore
      } finally {
        if (inFlightKeyRef.current === key) {
          inFlightKeyRef.current = null
        }
      }
    }

    run()

    return () => {
      const scope = scopeRef.current
      scopeRef.current = null
      if (scope !== null) {
        Runtime.runPromise(resolvedRuntime)(Scope.close(scope, Exit.void)).catch(
          () => {},
        )
      }
      if (inFlightKeyRef.current === key) {
        inFlightKeyRef.current = null
      }
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: resolvedRuntime, key, and deps are the hook contract
  }, [resolvedRuntime, key, ...deps])
}
