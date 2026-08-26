import { ensureSchema, sql } from "@/lib/db";

export type Review = {
  id: string;
  name: string;
  dateLabel: string;
  rating: number;
  text: string;
  checkAmount: string | null;
};

const SEED_REVIEWS: Omit<Review, "id">[] = [
  {
    name: "Виктория Штунц",
    dateLabel: "23 июля 2026 · 9 отзывов",
    rating: 5,
    text: "Прекрасное, просторное место с красивым видом! Очень вкусно и с приемлемыми ценами. Отдельное спасибо персоналу и поварам — они сделали наш вечер уютным и вкусным.",
    checkAmount: null,
  },
  {
    name: "Safina",
    dateLabel: "21 июля 2026 · 6 отзывов",
    rating: 5,
    text: "Хорошее уютное кафе, готовят вкусно. Являемся постоянными клиентами, ни разу не было нареканий.",
    checkAmount: "500–1000 ₽",
  },
  {
    name: "Люся П.",
    dateLabel: "20 июля 2026 · 31 отзыв",
    rating: 5,
    text: "Уже на протяжении нескольких лет заходим сюда за шашлыком, когда гуляем по набережной. Индейка выше всяких похвал, нежная и сочная!",
    checkAmount: null,
  },
  {
    name: "Юлия Николаева",
    dateLabel: "18 июля 2026 · 2 отзыва",
    rating: 5,
    text: "Всё очень вкусно, большой выбор блюд! Спасибо!",
    checkAmount: null,
  },
  {
    name: "fun time",
    dateLabel: "17 июля 2026 · 6 отзывов",
    rating: 5,
    text: "Отличное заведение, хорошее обслуживание, быстро. Дарья-официант просто шикарна — добрые и восхитительные впечатления.",
    checkAmount: null,
  },
  {
    name: "Ирина",
    dateLabel: "17 июля 2026 · 4 отзыва",
    rating: 5,
    text: "Отличное место! Обслуживание очень хорошее, шашлыки вообще огонь! Очень рекомендую 🥂",
    checkAmount: null,
  },
];

type ReviewRow = {
  id: string;
  name: string;
  date_label: string;
  rating: number;
  text: string;
  check_amount: string | null;
};

function rowToReview(row: ReviewRow): Review {
  return {
    id: row.id,
    name: row.name,
    dateLabel: row.date_label,
    rating: row.rating,
    text: row.text,
    checkAmount: row.check_amount,
  };
}

let seedReady: Promise<void> | null = null;

function ready(): Promise<void> {
  if (!seedReady) {
    seedReady = (async () => {
      await ensureSchema();
      const rows = (await sql`SELECT COUNT(*)::int AS count FROM reviews`) as {
        count: number;
      }[];
      if (rows[0].count > 0) return;

      for (const review of SEED_REVIEWS) {
        const id = crypto.randomUUID().slice(0, 8);
        await sql`
          INSERT INTO reviews (id, name, date_label, rating, text, check_amount)
          VALUES (${id}, ${review.name}, ${review.dateLabel}, ${review.rating}, ${review.text}, ${review.checkAmount})
          ON CONFLICT (id) DO NOTHING
        `;
      }
    })();
  }
  return seedReady;
}

export async function getReviews(): Promise<Review[]> {
  await ready();
  const rows = (await sql`
    SELECT * FROM reviews ORDER BY seq ASC
  `) as ReviewRow[];
  return rows.map(rowToReview);
}

export async function createReview(
  data: Omit<Review, "id">,
): Promise<Review> {
  await ready();
  const id = crypto.randomUUID().slice(0, 8);
  await sql`
    INSERT INTO reviews (id, name, date_label, rating, text, check_amount)
    VALUES (${id}, ${data.name}, ${data.dateLabel}, ${data.rating}, ${data.text}, ${data.checkAmount})
  `;
  return { ...data, id };
}

export async function updateReview(
  id: string,
  data: Omit<Review, "id">,
): Promise<Review | undefined> {
  await ready();
  const rows = (await sql`
    UPDATE reviews
    SET name = ${data.name}, date_label = ${data.dateLabel}, rating = ${data.rating},
        text = ${data.text}, check_amount = ${data.checkAmount}
    WHERE id = ${id}
    RETURNING id
  `) as { id: string }[];
  if (rows.length === 0) return undefined;
  return { ...data, id };
}

export async function deleteReview(id: string): Promise<boolean> {
  await ready();
  const rows = (await sql`DELETE FROM reviews WHERE id = ${id} RETURNING id`) as {
    id: string;
  }[];
  return rows.length > 0;
}
