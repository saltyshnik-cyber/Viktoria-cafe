"use client";

export default function QuantityStepper({
  quantity,
  onChange,
}: {
  quantity: number;
  onChange: (quantity: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-full bg-ember text-parchment-light">
      <button
        type="button"
        aria-label="Уменьшить количество"
        onClick={() => onChange(quantity - 1)}
        className="flex h-9 w-9 shrink-0 items-center justify-center text-lg font-bold"
      >
        −
      </button>
      <span className="min-w-[1.5rem] text-center text-sm font-semibold">
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Увеличить количество"
        onClick={() => onChange(quantity + 1)}
        className="flex h-9 w-9 shrink-0 items-center justify-center text-lg font-bold"
      >
        +
      </button>
    </div>
  );
}
