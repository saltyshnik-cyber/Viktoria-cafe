function randomEmber(index: number) {
  const isEmber = Math.random() > 0.6;
  const size = 2 + Math.random() * 2.5;
  const duration = 6 + Math.random() * 7;
  const delay = Math.random() * duration;
  const drift = `${(Math.random() * 80 - 40).toFixed(0)}px`;

  return {
    key: index,
    className: isEmber ? "bg-ember-light" : "bg-gold",
    style: {
      left: `${Math.random() * 100}%`,
      width: `${size}px`,
      height: `${size}px`,
      animationDuration: `${duration}s`,
      animationDelay: `-${delay}s`,
      ["--drift" as string]: drift,
      boxShadow: isEmber
        ? "0 0 6px 1.5px rgba(208,90,42,0.85)"
        : "0 0 6px 1.5px rgba(227,168,59,0.85), 0 0 2px rgba(255,255,255,0.6)",
    },
  };
}

export default function Embers({ count = 16 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => randomEmber(i));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map(({ key, className, style }) => (
        <span
          key={key}
          className={`ember-particle ${className}`}
          style={style}
        />
      ))}
    </div>
  );
}
