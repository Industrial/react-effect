/**
 * Runs an Effect {@link Stream} and feeds each emitted value into a setter that
 * returns an Effect. Use with {@link streamWithPendingState} and
 * {@link useEffectState}'s `setStateAsEffect` to drive React state from a
 * stream (e.g. list refresh, mutation-then-list).
 */

import { type Effect, Stream } from 'effect'

/**
 * Runs a stream and pushes each emission into a state setter that returns an
 * Effect. Equivalent to `Stream.runForEach(stream, setState)`; provided as a
 * named helper for use with React state setters that return Effect (such as
 * the third element of the tuple from {@link useEffectState}).
 *
 * Typical usage: build a stream with {@link streamWithPendingState} (e.g.
 * pending then success/failure), then run it with this function and
 * `setStateAsEffect` so that each emission updates React state. Run the
 * resulting Effect via the context runtime (e.g. inside {@link useRunEffect}
 * or from an event handler).
 *
 * @typeParam A - Type of values emitted by the stream (and accepted by the setter).
 * @typeParam E - Error type of the stream (propagated by the returned Effect).
 * @typeParam R - Requirements (context) required to run the stream.
 * @param stream - The stream to run. Each emitted value is passed to `setState`.
 * @param setState - A function that accepts a value and returns an
 *   `Effect<void, never, never>`. Use the `setStateAsEffect` from
 *   {@link useEffectState} so each emission updates React state.
 * @returns An Effect that runs the stream and calls `setState` for each
 *   emission. Fails with `E` if the stream fails; succeeds with `void` when
 *   the stream completes.
 *
 * @example
 * ```tsx
 * const [listState, setList, setListAsEffect] = useEffectState<AsyncState<List[], Error>>(idle())
 * const refreshStream = streamWithPendingState(fetchList())
 *
 * useRunEffect(runStreamInto(refreshStream, setListAsEffect), [trigger])
 * ```
 *
 * @see {@link Stream.runForEach} – low-level Effect API used by this function.
 * @see {@link streamWithPendingState} – builds a stream that emits pending then success/failure.
 * @see {@link useEffectState} – provides `setStateAsEffect` for React state.
 */
export function runStreamInto<A, E, R>(
  stream: Stream.Stream<A, E, R>,
  setState: (a: A) => Effect.Effect<void, never, never>,
): Effect.Effect<void, E, R> {
  return Stream.runForEach(stream, setState)
}
