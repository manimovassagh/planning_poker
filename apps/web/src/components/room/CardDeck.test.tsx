import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CardDeck } from "./CardDeck";

describe("CardDeck", () => {
  it("renders all fibonacci cards", () => {
    render(
      <CardDeck
        cardScale="fibonacci"
        selectedValue={null}
        disabled={false}
        onSelect={vi.fn()}
      />
    );

    for (const val of ["0", "1", "2", "3", "5", "8", "13", "21", "?"]) {
      expect(screen.getByText(val)).toBeInTheDocument();
    }
  });

  it("renders all tshirt cards", () => {
    render(
      <CardDeck
        cardScale="tshirt"
        selectedValue={null}
        disabled={false}
        onSelect={vi.fn()}
      />
    );

    for (const val of ["XS", "S", "M", "L", "XL", "XXL", "?"]) {
      expect(screen.getByText(val)).toBeInTheDocument();
    }
  });

  it("calls onSelect with correct value on click", () => {
    const onSelect = vi.fn();
    render(
      <CardDeck
        cardScale="fibonacci"
        selectedValue={null}
        disabled={false}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByText("8"));
    expect(onSelect).toHaveBeenCalledWith("8");
  });

  it("renders all powers-of-2 cards", () => {
    render(
      <CardDeck
        cardScale="powers"
        selectedValue={null}
        disabled={false}
        onSelect={vi.fn()}
      />
    );

    for (const val of ["0", "1", "2", "4", "8", "16", "32", "64", "?"]) {
      expect(screen.getByText(val)).toBeInTheDocument();
    }
  });
});
