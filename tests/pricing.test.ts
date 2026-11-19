import assert from "node:assert/strict";
import test from "node:test";
import {
  computePrice,
  formatMoney,
  isPromotionActive,
  matchesSchedule,
  priceCartLines,
  sumLines,
} from "../src/lib/pricing";
import type { Promotion } from "../src/types/promotions";

function makePromotion(overrides: Partial<Promotion> = {}): Promotion {
  const base: Promotion = {
    id: 1,
    slug: "test",
    title: "Тестовая акция",
    description: null,
    imageUrl: null,
    kind: "percent_dish",
    value: 10,
    maxDiscount: null,
    minOrderTotal: 0,
    scope: "all",
    dishIds: [],
    categoryIds: [],
    startsAt: null,
    endsAt: null,
    weekdays: null,
    timeFrom: null,
    timeTo: null,
    priority: 0,
    stackable: false,
    isEnabled: true,
    createdBy: null,
    updatedBy: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };

  return { ...base, ...overrides };
}

const DISH = { id: "42", categoryId: "7", price: 1000 };
const MONDAY_1559 = new Date("2025-03-10T15:59:00Z");
const MONDAY_1600 = new Date("2025-03-10T16:00:00Z");
const UTC = "UTC";

test("процент на блюдо уменьшает цену и даёт процентный бейдж", () => {
  const result = computePrice(DISH, MONDAY_1559, [makePromotion({ value: 20 })], {
    timeZone: UTC,
  });

  assert.equal(result.price, 800);
  assert.equal(result.discount, 200);
  assert.equal(result.badge, "−20%");
  assert.deepEqual(result.appliedPromotionIds, [1]);
});

test("граница расписания: 15:59 активна, 16:00 уже нет", () => {
  const promotion = makePromotion({ weekdays: [1], timeFrom: "12:00", timeTo: "16:00" });

  assert.equal(isPromotionActive(promotion, MONDAY_1559, UTC), true);
  assert.equal(isPromotionActive(promotion, MONDAY_1600, UTC), false);
});

test("акция, завершившаяся минуту назад, не применяется", () => {
  const promotion = makePromotion({ endsAt: new Date("2025-03-10T15:58:00Z") });
  const result = computePrice(DISH, MONDAY_1559, [promotion], { timeZone: UTC });

  assert.equal(result.discount, 0);
  assert.equal(result.price, 1000);
  assert.equal(result.badge, null);
});

test("конфликт: одна одиночная выгоднее суммы складываемых", () => {
  const stackable = makePromotion({ id: 1, value: 10, stackable: true });
  const single = makePromotion({ id: 2, value: 15, stackable: false, priority: 5 });

  const result = computePrice(DISH, MONDAY_1559, [stackable, single], { timeZone: UTC });

  assert.equal(result.discount, 150);
  assert.equal(result.price, 850);
  assert.deepEqual(result.appliedPromotionIds, [2]);
});

test("конфликт: складываемые суммируются и побеждают одиночную", () => {
  const ten = makePromotion({ id: 1, value: 10, stackable: true });
  const five = makePromotion({ id: 2, value: 5, stackable: true });
  const single = makePromotion({ id: 3, value: 12, stackable: false });

  const result = computePrice(DISH, MONDAY_1559, [ten, five, single], { timeZone: UTC });

  assert.equal(result.discount, 150);
  assert.equal(result.price, 850);
  assert.deepEqual([...result.appliedPromotionIds].sort(), [1, 2]);
});

test("равная выгода решается приоритетом", () => {
  const first = makePromotion({ id: 1, value: 7.5, stackable: true, priority: 1 });
  const second = makePromotion({ id: 2, value: 7.5, stackable: true, priority: 1 });
  const single = makePromotion({ id: 3, value: 15, stackable: false, priority: 30 });

  const result = computePrice(DISH, MONDAY_1559, [first, second, single], { timeZone: UTC });

  assert.equal(result.discount, 150);
  assert.deepEqual(result.appliedPromotionIds, [3]);
});

test("скидка больше цены блюда не уводит цену в минус", () => {
  const promotion = makePromotion({ kind: "fixed_dish", value: 500 });
  const result = computePrice({ id: "43", categoryId: "7", price: 300 }, MONDAY_1559, [promotion], {
    timeZone: UTC,
  });

  assert.equal(result.price, 0);
  assert.equal(result.discount, 300);
  assert.equal(result.badge, `−${formatMoney(300)}`);
});

test("выключенная акция не применяется", () => {
  const result = computePrice(DISH, MONDAY_1559, [makePromotion({ isEnabled: false, value: 50 })], {
    timeZone: UTC,
  });

  assert.equal(result.discount, 0);
});

test("акция на будни не работает в воскресенье", () => {
  const sunday = new Date("2025-03-09T13:00:00Z");
  const promotion = makePromotion({ value: 20, weekdays: [1, 2, 3, 4, 5] });

  assert.equal(computePrice(DISH, sunday, [promotion], { timeZone: UTC }).discount, 0);
});

test("окно через полночь: утро вторника принадлежит понедельнику", () => {
  const promotion = makePromotion({ weekdays: [1], timeFrom: "22:00", timeTo: "02:00" });

  assert.equal(matchesSchedule(promotion, { weekday: 2, minutes: 60 }), true);
  assert.equal(matchesSchedule(promotion, { weekday: 2, minutes: 180 }), false);
});

test("max_discount ограничивает процентную скидку", () => {
  const promotion = makePromotion({ value: 20, maxDiscount: 120 });
  const result = computePrice(DISH, MONDAY_1559, [promotion], { timeZone: UTC });

  assert.equal(result.discount, 120);
  assert.equal(result.price, 880);
  assert.equal(result.badge, `−${formatMoney(120)}`);
});

test("порог от суммы заказа: без контекста меню акция показывается", () => {
  const promotion = makePromotion({ value: 10, minOrderTotal: 1500 });
  const result = computePrice(DISH, MONDAY_1559, [promotion], { timeZone: UTC });

  assert.equal(result.discount, 100);
  assert.match(result.label ?? "", /при заказе от 1\u00a0500\u00a0₽/);
});

test("порог от суммы заказа: в корзине ниже порога не применяется", () => {
  const promotion = makePromotion({ value: 10, minOrderTotal: 1500 });

  const below = computePrice(DISH, MONDAY_1559, [promotion], {
    timeZone: UTC,
    orderTotal: 1200,
  });
  const above = computePrice(DISH, MONDAY_1559, [promotion], {
    timeZone: UTC,
    orderTotal: 1500,
  });

  assert.equal(below.discount, 0);
  assert.equal(above.discount, 100);
});

test("акция на категорию не задевает блюда других категорий", () => {
  const promotion = makePromotion({
    kind: "percent_category",
    value: 25,
    scope: "categories",
    categoryIds: ["7"],
  });

  const hit = computePrice(DISH, MONDAY_1559, [promotion], { timeZone: UTC });
  const miss = computePrice({ ...DISH, categoryId: "8" }, MONDAY_1559, [promotion], {
    timeZone: UTC,
  });

  assert.equal(hit.discount, 250);
  assert.equal(miss.discount, 0);
});

test("акция на конкретное блюдо не задевает соседнее", () => {
  const promotion = makePromotion({ scope: "dishes", dishIds: ["42"], value: 15 });

  assert.equal(computePrice(DISH, MONDAY_1559, [promotion], { timeZone: UTC }).discount, 150);
  assert.equal(
    computePrice({ ...DISH, id: "43" }, MONDAY_1559, [promotion], { timeZone: UTC }).discount,
    0,
  );
});

test("часовой пояс кафе: 10:00 UTC — это 17:00 в Красноярске", () => {
  const promotion = makePromotion({ weekdays: [1], timeFrom: "12:00", timeTo: "16:00" });
  const moment = new Date("2025-03-10T10:00:00Z");

  assert.equal(isPromotionActive(promotion, moment, "Asia/Krasnoyarsk"), false);
  assert.equal(isPromotionActive(promotion, moment, UTC), true);
});

test("подпись расписания попадает в label", () => {
  const promotion = makePromotion({
    value: 20,
    weekdays: [1, 2, 3, 4, 5],
    timeFrom: "12:00",
    timeTo: "16:00",
  });
  const result = computePrice(DISH, MONDAY_1559, [promotion], { timeZone: UTC });

  assert.equal(result.label, "по будням, 12:00–16:00");
});

test("корзина: порог сверяется с базовой суммой всех позиций", () => {
  const promotion = makePromotion({ value: 10, minOrderTotal: 1500, id: 5 });
  const lines = [
    { id: "42", categoryId: "7", price: 1000, quantity: 1 },
    { id: "43", categoryId: "7", price: 600, quantity: 1 },
  ];

  const priced = priceCartLines(lines, MONDAY_1559, [promotion], { timeZone: UTC });

  assert.equal(priced[0].price, 900);
  assert.equal(priced[1].price, 540);
  assert.equal(priced[0].promotionId, 5);
});

test("корзина: сумма, скидка и итог сходятся без потери копеек", () => {
  const promotion = makePromotion({ value: 10 });
  const lines = [
    { id: "42", categoryId: "7", price: 333.33, quantity: 2 },
    { id: "43", categoryId: "7", price: 199.99, quantity: 1 },
  ];

  const priced = priceCartLines(lines, MONDAY_1559, [promotion], { timeZone: UTC });
  const { base, subtotal, itemsDiscount } = sumLines(priced);

  assert.equal(base, 866.65);
  assert.equal(subtotal, 779.99);
  assert.equal(itemsDiscount, 86.66);
  assert.equal(priced[0].discount, 66.66);
});