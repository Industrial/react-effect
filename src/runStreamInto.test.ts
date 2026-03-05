import { describe, expect, it } from 'bun:test'
import { Effect, Stream } from 'effect'
import { runStreamInto } from './runStreamInto'

describe('runStreamInto', () => {
  it('calls setState for each stream emission', async () => {
    const received: number[] = []
    const setState = (a: number) =>
      Effect.sync(() => {
        received.push(a)
      })
    const stream = Stream.make(1, 2, 3)
    await Effect.runPromise(runStreamInto(stream, setState))
    expect(received).toEqual([1, 2, 3])
  })

  it('returns a failing Effect when stream fails', async () => {
    const setState = (_: number) => Effect.sync(() => {})
    const stream = Stream.fail('stream error' as const)
    const result = await Effect.runPromise(
      Effect.exit(runStreamInto(stream, setState)),
    )
    expect(result._tag).toBe('Failure')
    if (result._tag === 'Failure') {
      expect(result.cause._tag).toBe('Fail')
      if (result.cause._tag === 'Fail') {
        expect(result.cause.error).toBe('stream error')
      }
    }
  })
})
