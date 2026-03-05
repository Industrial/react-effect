import { useCallback } from 'react'
import { Effect } from 'effect'
import { useNavigate } from 'react-router-dom'

/**
 * Options for the Effect-returning navigator returned by {@link useNavigateEffect}.
 * Mirrors React Router's `NavigateOptions` (e.g. for `navigate(to, options)`).
 */
export interface NavigateEffectOptions {
  /** When true, replace the current history entry instead of pushing. */
  replace?: boolean
  /** Optional state to pass to the new location. */
  state?: unknown
}

/**
 * Returns a function that navigates to a path (or history delta) and returns an Effect.
 * Use in Effect.gen for composition: `yield* navigateEffect('/dashboard', { replace: true })`.
 *
 * Requires `react-router-dom` to be installed and the component to be rendered within a
 * React Router provider (e.g. `<BrowserRouter>`).
 *
 * @returns A function `(to, options?) => Effect<void>` that performs navigation when run.
 *
 * @example
 * ```tsx
 * const navigateEffect = useNavigateEffect();
 * yield* navigateEffect('/dashboard', { replace: true });
 * ```
 */
export function useNavigateEffect(): (
  to: string | number,
  options?: NavigateEffectOptions,
) => Effect.Effect<void, never, never> {
  const navigate = useNavigate()
  return useCallback(
    (to: string | number, options?: NavigateEffectOptions) =>
      Effect.sync(() => {
        if (typeof to === 'number') {
          navigate(to)
        } else {
          navigate(to, options)
        }
      }),
    [navigate],
  )
}
