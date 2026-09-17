"use client";

export default function PrintReceiptButton({ orderId }: { orderId: string }) {
  function handlePrint() {
    document
      .querySelectorAll(".print-target")
      .forEach((el) => el.classList.remove("print-target"));

    const receipt = document.getElementById(`receipt-${orderId}`);
    receipt?.classList.add("print-target");

    window.print();
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-cream transition hover:bg-primary-dark"
    >
      <span aria-hidden="true">🖨️</span>
      Печать
    </button>
  );
}
