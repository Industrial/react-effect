import { Effect, Runtime } from 'effect'
import { useEffect, useRef, useState } from 'react'
import { useEffectRuntime } from './EffectRuntime'

/**
 * Result object returned by {@link useRunEffectWithCache}.
 *
 * @typeParam A - Success value type (cached and exposed as `data`).
 * @typeParam E - Error type (exposed as `error`).
 */
export interface UseRunEffectWithCacheResult<A, E> {
  /** Cached or latest success value; undefined until loaded or on error. */
  data: A | undefined
  /** Latest error; undefined when data is set or while loading. */
  error: E | undefined
  /** True while the effect for the current key is running. */
  isLoading: boolean
}

/**
 * Runs an Effect keyed by `key`, caches the result by key, and returns
 * `{ data, error, isLoading }`. When the same key is requested again (e.g. after
 * remount or deps change), the cached value is returned without re-running.
 * Useful for keyed data fetching (e.g. user by id) where you want to avoid
 * refetching when the component remounts with the same key.
 *
 * @typeParam A - Success value type (cached and returned as `data`).
 * @typeParam E - Error type (returned as `error`).
 * @typeParam R - Requirements (context) for the Effect; must be provided by the runtime.
 * @param effect - The effect that produces the value to cache (Effect<A, E, R>). Run when the key is not yet in cache.
 * @param key - Cache key. Only one run per key; same key returns cached result. Use `null` to clear/disable (state resets).
 * @param deps - React dependency list; re-run when deps change (key is typically derived from deps).
 * @param runtime - Optional. Runtime to run the effect with. If omitted, uses context ({@link useEffectRuntime}). If `null`, nothing runs.
 * @returns {@link UseRunEffectWithCacheResult} with `data`, `error`, and `isLoading`.
 *
 * @example
 * ```tsx
 * const { data, error, isLoading } = useRunEffectWithCache(
 *   api.getUser(userId),
 *   userId ?? null,
 *   [userId]
 * );
 * ```
 */
export function useRunEffectWithCache<A, E, R>(
  effect: Effect.Effect<A, E, R>,
  key: string | null,
  deps: React.DependencyList,
  runtime?: Runtime.Runtime<R> | null,
): UseRunEffectWithCacheResult<A, E> {
  const resolvedRuntime =
    runtime !== undefined ? runtime : useEffectRuntime<R>().runtime
  const [state, setState] = useState<{
    data: A | undefined
    error: E | undefined
    isLoading: boolean
  }>({ data: undefined, error: undefined, isLoading: false })

  const cacheRef = useRef<Map<string, { data?: A; error?: E }>>(new Map())

  useEffect(() => {
    if (resolvedRuntime === null || key === null) {
      setState({ data: undefined, error: undefined, isLoading: false })
      return
    }

    const cached = cacheRef.current.get(key)
    if (cached !== undefined) {
      setState({
        data: cached.data,
        error: cached.error,
        isLoading: false,
      })
      return
    }

    let cancelled = false
    setState((prev) => ({ ...prev, isLoading: true }))

    Runtime.runPromise(resolvedRuntime)(effect as Effect.Effect<A, E, R>)
      .then((data) => {
        if (cancelled) return
        cacheRef.current.set(key, { data })
        setState({ data, error: undefined, isLoading: false })
      })
      .catch((error: E) => {
        if (cancelled) return
        cacheRef.current.set(key, { error })
        setState({ data: undefined, error, isLoading: false })
      })

    return () => {
      cancelled = true
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: resolvedRuntime, key, and deps are the hook contract
  }, [resolvedRuntime, key, ...deps])

  return state
}
