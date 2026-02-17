import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { AppError, errorHandler } from "./errorHandler";

function createMocks() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const res = { status } as any;
  const req = {} as any;
  const next = vi.fn();
  return { req, res, next, json, status };
}

describe("errorHandler", () => {
  it("handles AppError with correct status and message", () => {
    const { req, res, next, json, status } = createMocks();
    errorHandler(new AppError(409, "Email already registered"), req, res, next);
    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({ error: "Email already registered" });
  });

  it("handles AppError 404", () => {
    const { req, res, next, json, status } = createMocks();
    errorHandler(new AppError(404, "Not found"), req, res, next);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ error: "Not found" });
  });

  it("handles ZodError with 400 and validation details", () => {
    const { req, res, next, json, status } = createMocks();
    const schema = z.object({ email: z.string().email() });
    let zodError: z.ZodError | undefined;
    try {
      schema.parse({ email: "bad" });
    } catch (e) {
      zodError = e as z.ZodError;
    }

    errorHandler(zodError!, req, res, next);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Validation failed",
        details: expect.arrayContaining([
          expect.objectContaining({ field: "email" }),
        ]),
      })
    );
  });

  it("handles unknown errors with 500", () => {
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { req, res, next, json, status } = createMocks();

    errorHandler(new Error("something broke"), req, res, next);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ error: "Internal server error" });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
