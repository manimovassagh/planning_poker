import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";
import { authenticate, type AuthRequest } from "./auth";

function createReq(authHeader?: string): AuthRequest {
  return { headers: { authorization: authHeader } } as AuthRequest;
}

const mockRes = {} as any;

describe("authenticate middleware", () => {
  it("throws 401 when no Authorization header", () => {
    const next = vi.fn();
    expect(() => authenticate(createReq(), mockRes, next)).toThrow(
      "Authentication required"
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("throws 401 when header does not start with Bearer", () => {
    const next = vi.fn();
    expect(() => authenticate(createReq("Basic abc"), mockRes, next)).toThrow(
      "Authentication required"
    );
  });

  it("throws 401 for invalid token", () => {
    const next = vi.fn();
    expect(() =>
      authenticate(createReq("Bearer invalid.token"), mockRes, next)
    ).toThrow("Invalid or expired token");
  });

  it("sets userId and calls next for valid token", () => {
    const next = vi.fn();
    const token = jwt.sign({ userId: "user-123" }, process.env.JWT_SECRET!);
    const req = createReq(`Bearer ${token}`);

    authenticate(req, mockRes, next);

    expect(req.userId).toBe("user-123");
    expect(next).toHaveBeenCalledOnce();
  });

  it("throws 401 for expired token", () => {
    const next = vi.fn();
    const token = jwt.sign({ userId: "user-123" }, process.env.JWT_SECRET!, {
      expiresIn: "-1s",
    });

    expect(() =>
      authenticate(createReq(`Bearer ${token}`), mockRes, next)
    ).toThrow("Invalid or expired token");
  });
});
