import { describe, expect, it } from 'bun:test'
import { Chunk, Effect, Stream } from 'effect'
import { isFailure, isPending, isSuccess } from './AsyncState'
import { streamWithPendingState } from './streamWithPendingState'

describe('streamWithPendingState', () => {
  it('emits pending then success when effect succeeds', async () => {
    const effect = Effect.succeed(42)
    const stream = streamWithPendingState(effect)
    const chunk = await Effect.runPromise(Stream.runCollect(stream))
    const collected = Chunk.toReadonlyArray(chunk)
    expect(collected).toHaveLength(2)
    expect(isPending(collected[0]!)).toBe(true)
    expect(isSuccess(collected[1]!)).toBe(true)
    if (isSuccess(collected[1]!)) {
      expect(collected[1].value).toBe(42)
    }
  })

  it('emits pending then failure when effect fails', async () => {
    const effect = Effect.fail('oops' as const)
    const stream = streamWithPendingState(effect)
    const chunk = await Effect.runPromise(Stream.runCollect(stream))
    const collected = Chunk.toReadonlyArray(chunk)
    expect(collected).toHaveLength(2)
    expect(isPending(collected[0]!)).toBe(true)
    expect(isFailure(collected[1]!)).toBe(true)
    if (isFailure(collected[1]!)) {
      expect(collected[1].error).toBe('oops')
    }
  })
})
