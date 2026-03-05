import { Effect, Runtime } from 'effect'
import { useCallback, useRef, useState } from 'react'
import { useEffectRuntime } from './EffectRuntime'

/**
 * Mirrors React's `useTransition`: returns a pending flag and a function to start
 * a non-blocking transition.
 *
 * The transition function accepts a sync callback, a Promise-returning function,
 * or an Effect. While that work runs, `isPending` is true, so you can show
 * loading UI without blocking the main thread. Ideal for tab switches, form
 * submissions, or any async update that should feel responsive.
 *
 * @typeParam R - Requirements (context) for Effects run by the transition (from {@link EffectRuntimeProvider}).
 * @returns A tuple `[isPending, startTransition]`.
 *
 * @example
 * ```tsx
 * const [isPending, startTransition] = useTransitionEffect();
 *
 * const handleTabChange = (tab: string) => {
 *   startTransition(async () => {
 *     await loadTabData(tab);
 *     setTab(tab);
 *   });
 * };
 *
 * return (
 *   <>
 *     <Tabs onChange={handleTabChange} />
 *     {isPending && <Spinner />}
 *   </>
 * );
 * ```
 *
 * @example
 * ```tsx
 * startTransition(() => fetchUserEffect); // pass an Effect
 * ```
 *
 * @param runtime - Optional. Runtime to run effects with. If omitted, uses context.
 */
export function useTransitionEffect<R = never>(
  runtime?: Runtime.Runtime<R> | null,
): [
  isPending: boolean,
  startTransition: <A, E>(
    fn: () => void | Promise<void> | Effect.Effect<A, E, R>,
  ) => void,
] {
  const resolvedRuntime =
    runtime !== undefined ? runtime : useEffectRuntime<R>().runtime
  const [isPending, setIsPending] = useState(false)
  const runCountRef = useRef(0)

  const startTransition = useCallback(
    <A, E>(fn: () => void | Promise<void> | Effect.Effect<A, E, R>) => {
      const runId = ++runCountRef.current
      setIsPending(true)

      const run = async () => {
        try {
          const result = fn()
          if (
            result !== undefined &&
            result !== null &&
            Effect.isEffect(result)
          ) {
            if (resolvedRuntime === null) return
            await Runtime.runPromise(resolvedRuntime)(result as Effect.Effect<A, E, R>)
          } else if (typeof (result as Promise<void>)?.then === 'function') {
            await (result as Promise<void>)
          }
        } catch (_) {
          // ignore
        } finally {
          if (runId === runCountRef.current) {
            setIsPending(false)
          }
        }
      }

      run()
    },
    [resolvedRuntime],
  )

  return [isPending, startTransition]
}
