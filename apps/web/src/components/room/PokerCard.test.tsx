import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PokerCard } from "./PokerCard";

describe("PokerCard", () => {
  it("renders value when revealed", () => {
    render(<PokerCard value="5" revealed />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders ? when not revealed and not selected", () => {
    render(<PokerCard value="5" />);
    expect(screen.getByText("?")).toBeInTheDocument();
    expect(screen.queryByText("5")).not.toBeInTheDocument();
  });

  it("renders value when selected even if not revealed", () => {
    render(<PokerCard value="5" selected />);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.queryByText("?")).not.toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<PokerCard value="5" revealed onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", () => {
    const onClick = vi.fn();
    render(<PokerCard value="5" revealed disabled onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("button is disabled when disabled prop is set", () => {
    render(<PokerCard value="5" revealed disabled />);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
