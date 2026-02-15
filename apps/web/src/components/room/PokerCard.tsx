import { cn } from "@/lib/utils";

interface PokerCardProps {
  value: string;
  selected?: boolean;
  revealed?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function PokerCard({
  value,
  selected = false,
  revealed = false,
  disabled = false,
  onClick,
}: PokerCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex h-24 w-16 items-center justify-center rounded-lg border-2 text-lg font-bold transition-all duration-200",
        "hover:scale-105 hover:shadow-md",
        "md:h-28 md:w-20 md:text-xl",
        selected
          ? "border-primary bg-primary text-primary-foreground shadow-lg scale-105"
          : "border-border bg-card text-card-foreground hover:border-primary/50",
        disabled && "cursor-not-allowed opacity-50 hover:scale-100",
        !revealed &&
          !selected &&
          "bg-gradient-to-br from-primary/5 to-primary/10"
      )}
    >
      {revealed || selected ? (
        <span>{value}</span>
      ) : (
        <span className="text-primary/30">?</span>
      )}
    </button>
  );
}
