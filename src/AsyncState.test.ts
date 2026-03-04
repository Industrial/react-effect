import { describe, expect, it } from "bun:test";
import {
	failure,
	idle,
	isFailure,
	isIdle,
	isPending,
	isSuccess,
	pending,
	success,
} from "./AsyncState";

describe("AsyncState", () => {
	describe("constructors", () => {
		it("idle() returns idle state", () => {
			const s = idle<number, string>();
			expect(s._tag).toBe("idle");
		});

		it("pending() returns pending state", () => {
			const s = pending<number, string>();
			expect(s._tag).toBe("pending");
		});

		it("success(value) returns success state with value", () => {
			const s = success(42);
			expect(s._tag).toBe("success");
			expect(s.value).toBe(42);
		});

		it("failure(error) returns failure state with error", () => {
			const s = failure("oops");
			expect(s._tag).toBe("failure");
			expect(s.error).toBe("oops");
		});
	});

	describe("type guards", () => {
		it("isIdle returns true only for idle", () => {
			expect(isIdle(idle())).toBe(true);
			expect(isIdle(pending())).toBe(false);
			expect(isIdle(success(1))).toBe(false);
			expect(isIdle(failure("e"))).toBe(false);
		});

		it("isPending returns true only for pending", () => {
			expect(isPending(idle())).toBe(false);
			expect(isPending(pending())).toBe(true);
			expect(isPending(success(1))).toBe(false);
			expect(isPending(failure("e"))).toBe(false);
		});

		it("isSuccess returns true only for success", () => {
			expect(isSuccess(idle())).toBe(false);
			expect(isSuccess(pending())).toBe(false);
			expect(isSuccess(success(1))).toBe(true);
			expect(isSuccess(failure("e"))).toBe(false);
		});

		it("isFailure returns true only for failure", () => {
			expect(isFailure(idle())).toBe(false);
			expect(isFailure(pending())).toBe(false);
			expect(isFailure(success(1))).toBe(false);
			expect(isFailure(failure("e"))).toBe(true);
		});
	});
});
