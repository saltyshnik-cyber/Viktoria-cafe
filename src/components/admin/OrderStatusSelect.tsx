"use client";

import { useState } from "react";
import { ORDER_STATUSES, STATUS_LABELS } from "@/lib/orderLabels";
import type { OrderStatus } from "@/types/order";

export default function OrderStatusSelect({
  orderId,
  status,
  onStatusChange,
}: {
  orderId: string;
  status: OrderStatus;
  onStatusChange?: (orderId: string, status: OrderStatus) => void;
}) {
  const [isSaving, setIsSaving] = useState(false);

  async function handleChange(next: OrderStatus) {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (response.ok) {
        onStatusChange?.(orderId, next);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <select
      value={status}
      disabled={isSaving}
      onChange={(e) => handleChange(e.target.value as OrderStatus)}
      className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-ink outline-none focus:border-primary disabled:opacity-50"
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
