# react-effect-hooks

Effect.ts integration for React. This library provides React hooks that run your logic as Effect programs instead of raw Promises or ad hoc async code. You get typed errors, composition, and Scope-based cleanup while keeping the same mental model as React’s built-in hooks.

**npm package:** `react-effect-hooks` (the name `react-effect-hooks` is taken on npm). Install with `bun add react-effect-hooks` or `npm i react-effect-hooks`.

---

## What this library does

- **Shared runtime:** A React context supplies a single Effect runtime. Your app (or a subtree) wraps with `<EffectRuntimeProvider>`. All hooks use that runtime to run or fork Effects. You configure Layers/Services and resource lifecycle in one place.
- **Explicit async state:** Async hooks expose a small state machine: Idle, Pending, Success, Failure. Success and failure carry typed values and errors (`E`), so you avoid overloading a single `error` slot with `unknown`.
- **Scope-based cleanup:** When a hook runs an Effect that should be cancellable (e.g. `useRunEffect`), it allocates a Scope, runs the Effect in that Scope, and closes the Scope on unmount or when dependencies change. That gives you the same cleanup semantics as in pure Effect code (interruption, finalizers).
- **API aligned with React:** Hooks mirror React’s built-in hooks (including React 19–style patterns). The async/effectful part is expressed as an `Effect`; the hook shapes stay familiar.

---

## Limited scope

This library is **not** a full “Effect-first” React framework. It does **not**:

- Replace or reimplement React’s data flow, Suspense, or Server Components.
- Provide Effect-based routing, data fetching, or form libraries.
- Change how you structure your React tree or component hierarchy.

It **only**:

- Lets you run Effect programs from React hooks via a shared runtime.
- Provides hook variants that mirror `useTransition`, `useActionState`, `useOptimistic`, `useEffect`, `useState`, and `useReducer`, with the async/effectful part implemented as Effects and with typed errors and Scope cleanup where applicable.

Use it when you already use Effect and want consistent Effect semantics (errors, resources, cancellation) at the React boundary. If you don’t use Effect, this library is not for you.

---

## When it’s useful

- You use **Effect** elsewhere (services, layers, typed errors) and want the same runtime and semantics in React (e.g. in event handlers, transitions, or effects).
- You want **typed errors** and explicit Idle/Pending/Success/Failure state in async hooks instead of overloading `error: unknown`.
- You want **Scope-based cleanup** (interruption, finalizers) for Effects started from hooks, instead of ad hoc `AbortController` or manual cleanup.
- You prefer hook APIs that **mirror** React’s `useTransition`, `useActionState`, `useOptimistic`, etc., so the learning curve is small.

---

## Hooks

| React hook        | react-effect-hooks hook           | Notes |
|-------------------|-----------------------------|--------|
| `useTransition`   | `useTransitionEffect`       | `[isPending, startTransition]`; `startTransition` runs an `Effect`. |
| `useActionState`  | `useActionStateEffect`      | `[state, dispatchAction, isPending]`; the action is an `Effect`; state/error/isPending from last run. |
| `useOptimistic`   | `useOptimisticEffect`       | `[optimisticState, setOptimistic]`; commit runs an `Effect`; on success commit, on failure revert. |
| `useEffect`       | `useRunEffect`              | `(effect, deps)`; runs the Effect in a Scope; Scope is closed on cleanup. |
| `useState`        | `useEffectState`            | Setter accepts a value, an updater function, or an `Effect`; when an Effect is passed, it’s run and result/error drive state. |
| `useReducer`      | `useEffectReducer`          | Reducer returns `Effect<NextState, E, R>`; dispatch runs that Effect and updates state from the result. |

Async state is represented as: `{ _tag: 'idle' } | { _tag: 'pending' } | { _tag: 'success', value: A } | { _tag: 'failure', error: E }`. Helpers: `idle`, `pending`, `success`, `failure`, `isIdle`, `isPending`, `isSuccess`, `isFailure` (from `AsyncState`).

---

## Usage

1. Wrap your app (or the subtree that uses these hooks) with `<EffectRuntimeProvider>`. Optionally pass a custom `Runtime<R>` (e.g. built from Layers).
2. Use the hooks inside that tree. For hooks that require services `R`, build the provider’s runtime with the right Layers so `Effect<A, E, R>` can be run.

No React 19 requirement; the API is designed so that when you move to React 19, the same patterns align with the built-in hooks.

---

## Design (summary)

- **Runtime:** One shared runtime from context; hooks submit Effects to it. Single place for Layers/Services and resource lifecycle.
- **Cleanup:** Scope is used for cancellable runs; closing the Scope on unmount/deps change interrupts fibers and runs finalizers.
- **API:** Hook names and signatures stay close to React’s; the only difference is that the async/effectful part is an `Effect`.

---

## File layout

- `AsyncState.ts` – `AsyncState<A, E>` and helpers.
- `EffectRuntime.tsx` – Context, `EffectRuntimeProvider`, `useEffectRuntime`.
- `useRunEffect.ts`, `useTransitionEffect.ts`, `useActionStateEffect.ts`, `useOptimisticEffect.ts`, `useEffectState.ts`, `useEffectReducer.ts` – hook implementations.
- `index.ts` – re-exports.

---

## Dependencies

- `effect` – Effect core (Runtime, Scope, Effect, Fiber, etc.).
- `react` – context, hooks, types.

Peer dependencies: `effect` >= 3.0.0, `react` >= 18.0.0.
