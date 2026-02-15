import { CARD_SCALES, type CardScale } from "@planning-poker/shared";
import { PokerCard } from "./PokerCard";

interface CardDeckProps {
  cardScale: CardScale;
  selectedValue: string | null;
  disabled: boolean;
  onSelect: (value: string) => void;
}

export function CardDeck({
  cardScale,
  selectedValue,
  disabled,
  onSelect,
}: CardDeckProps) {
  const cards = CARD_SCALES[cardScale];

  return (
    <div className="flex flex-wrap justify-center gap-3 p-4">
      {cards.map((value) => (
        <PokerCard
          key={value}
          value={value}
          selected={selectedValue === value}
          revealed={true}
          disabled={disabled}
          onClick={() => onSelect(value)}
        />
      ))}
    </div>
  );
}
