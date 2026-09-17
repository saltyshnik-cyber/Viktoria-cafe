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
      className="text-sm text-ink/50 hover:text-primary"
    >
      Печать
    </button>
  );
}
