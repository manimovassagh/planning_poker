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
        "relative flex h-24 w-16 items-center justify-center rounded-lg border-2 text-lg font-bold",
        "transition-all duration-300 ease-out",
        "md:h-28 md:w-20 md:text-xl",
        selected
          ? "border-primary bg-primary text-primary-foreground shadow-xl shadow-primary/20 -translate-y-2 scale-105"
          : "border-border bg-card text-card-foreground hover:border-primary/50 hover:-translate-y-1 hover:scale-105 hover:shadow-lg hover:shadow-primary/10",
        disabled && "cursor-not-allowed opacity-50 hover:translate-y-0 hover:scale-100 hover:shadow-none",
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
