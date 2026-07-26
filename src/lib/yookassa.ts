const YOOKASSA_API_URL = "https://api.yookassa.ru/v3";

type Credentials = { shopId: string; secretKey: string };

function getCredentials(): Credentials | null {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey) return null;
  return { shopId, secretKey };
}

export function isYooKassaConfigured() {
  return getCredentials() !== null;
}

function authHeader({ shopId, secretKey }: Credentials) {
  return `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`;
}

export type YooKassaPayment = {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  paid: boolean;
  confirmation?: { confirmation_url?: string };
};

export async function createPayment({
  orderId,
  amount,
  description,
  returnUrl,
}: {
  orderId: string;
  amount: number;
  description: string;
  returnUrl: string;
}): Promise<YooKassaPayment> {
  const credentials = getCredentials();
  if (!credentials) {
    throw new Error(
      "ЮKassa не настроена: заполните YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в .env",
    );
  }

  const response = await fetch(`${YOOKASSA_API_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotence-Key": crypto.randomUUID(),
      Authorization: authHeader(credentials),
    },
    body: JSON.stringify({
      amount: { value: amount.toFixed(2), currency: "RUB" },
      confirmation: { type: "redirect", return_url: returnUrl },
      capture: true,
      description,
      metadata: { orderId },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ошибка ЮKassa (${response.status}): ${await response.text()}`);
  }

  return response.json();
}

export async function getPayment(paymentId: string): Promise<YooKassaPayment> {
  const credentials = getCredentials();
  if (!credentials) {
    throw new Error("ЮKassa не настроена");
  }

  const response = await fetch(`${YOOKASSA_API_URL}/payments/${paymentId}`, {
    headers: { Authorization: authHeader(credentials) },
  });

  if (!response.ok) {
    throw new Error(`Ошибка ЮKassa (${response.status}): ${await response.text()}`);
  }

  return response.json();
}
