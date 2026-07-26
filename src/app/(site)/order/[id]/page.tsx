import Link from "next/link";
import { getOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

function getStatusMessage(status: string | undefined) {
  switch (status) {
    case "paid":
      return "Оплата прошла успешно — уже готовим ваш заказ!";
    case "awaiting_payment":
      return "Заказ создан. Если оплата не прошла автоматически, вернитесь в кафе и попробуйте снова.";
    case "new":
      return "Заказ принят. Оплата — курьеру при получении.";
    case "preparing":
      return "Готовим ваш заказ!";
    case "delivering":
      return "Курьер уже в пути.";
    case "completed":
      return "Заказ выполнен. Спасибо, что заказали у нас!";
    case "cancelled":
      return "Заказ отменён. Если у вас есть вопросы, свяжитесь с кафе по телефону.";
    default:
      return "Мы позвоним вам в ближайшее время, чтобы подтвердить заказ и уточнить детали доставки.";
  }
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = getOrder(id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-3xl">
        ✓
      </div>
      <h1 className="text-2xl font-bold text-ink">Заказ №{id} принят!</h1>
      <p className="mt-2 text-ink/60">{getStatusMessage(order?.status)}</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-cream hover:bg-primary-dark"
      >
        Вернуться к меню
      </Link>
    </div>
  );
}
