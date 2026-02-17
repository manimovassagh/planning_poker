import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { validate } from "./validate";

const schema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
});

describe("validate middleware", () => {
  it("passes valid body through and calls next", () => {
    const req = { body: { name: "Alice", age: 30 } } as any;
    const res = {} as any;
    const next = vi.fn();

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.body).toEqual({ name: "Alice", age: 30 });
  });

  it("strips extra fields from body", () => {
    const req = { body: { name: "Bob", age: 25, extra: "ignored" } } as any;
    const res = {} as any;
    const next = vi.fn();

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.body).toEqual({ name: "Bob", age: 25 });
  });

  it("throws for invalid body", () => {
    const req = { body: { name: "", age: -1 } } as any;
    const res = {} as any;
    const next = vi.fn();

    expect(() => validate(schema)(req, res, next)).toThrow(z.ZodError);
    expect(next).not.toHaveBeenCalled();
  });

  it("throws when required fields are missing", () => {
    const req = { body: {} } as any;
    const res = {} as any;
    const next = vi.fn();

    expect(() => validate(schema)(req, res, next)).toThrow(z.ZodError);
  });
});
