import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "./authStore";

vi.mock("@/lib/api", () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import { api } from "@/lib/api";

const mockUser = {
  id: "1",
  email: "alice@test.com",
  displayName: "Alice",
  avatarUrl: null,
  createdAt: "2024-01-01",
};

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isLoading: true,
      isAuthenticated: false,
    });
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("login stores tokens and sets user", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { user: mockUser, accessToken: "at", refreshToken: "rt" },
    });

    await useAuthStore.getState().login("alice@test.com", "pass");

    expect(localStorage.getItem("accessToken")).toBe("at");
    expect(localStorage.getItem("refreshToken")).toBe("rt");
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("register stores tokens and sets user", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { user: mockUser, accessToken: "at", refreshToken: "rt" },
    });

    await useAuthStore.getState().register("alice@test.com", "pass", "Alice");

    expect(localStorage.getItem("accessToken")).toBe("at");
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("logout clears tokens and resets state", async () => {
    localStorage.setItem("accessToken", "at");
    localStorage.setItem("refreshToken", "rt");
    vi.mocked(api.post).mockResolvedValue({});

    await useAuthStore.getState().logout();

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("loadUser with no token sets isLoading false without API call", async () => {
    await useAuthStore.getState().loadUser();

    expect(api.get).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it("loadUser with token fetches user profile", async () => {
    localStorage.setItem("accessToken", "valid-token");
    vi.mocked(api.get).mockResolvedValue({ data: { user: mockUser } });

    await useAuthStore.getState().loadUser();

    expect(api.get).toHaveBeenCalledWith("/auth/me");
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it("loadUser clears tokens on API error", async () => {
    localStorage.setItem("accessToken", "expired-token");
    vi.mocked(api.get).mockRejectedValue(new Error("401"));

    await useAuthStore.getState().loadUser();

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
