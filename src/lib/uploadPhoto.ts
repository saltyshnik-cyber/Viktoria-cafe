/**
 * Загружает файл на сервер, который сохраняет его в Vercel Blob.
 *
 * Раньше здесь использовался клиентский `upload()` из `@vercel/blob/client`
 * (прямая загрузка из браузера в Blob), но он натыкается на известный баг
 * SDK: браузер обращается к vercel.com/api/blob/... и получает отказ
 * из-за отсутствия CORS-заголовков (не чинится на стороне приложения).
 * Поэтому файл идёт через наш собственный роут — для фото ресторана
 * (обычно не больше нескольких МБ) это не проблема.
 */
export async function uploadPhoto(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Нет соединения с сервером (${detail})`);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error ?? `Не удалось загрузить фото (код ${response.status})`);
  }

  if (!data?.url) {
    throw new Error("Сервер вернул некорректный ответ при загрузке фото");
  }

  return data.url as string;
}
