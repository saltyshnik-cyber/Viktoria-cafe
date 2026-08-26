const MAX_DIMENSION = 1920;
const COMPRESS_QUALITY = 0.82;
const SKIP_COMPRESSION_UNDER_BYTES = 500 * 1024; // уже компактный файл — не трогаем

/**
 * Сжимает фото в браузере перед загрузкой: уменьшает до разумного разрешения
 * и перекодирует в JPEG. Телефонные фото (5-15 МБ) после этого обычно
 * укладываются в десятки-сотни КБ — и не упираются в жёсткий лимит тела
 * запроса на serverless-функциях Vercel (~4.5 МБ, не настраивается кодом).
 *
 * Анимированные GIF не трогаем — canvas умеет рисовать только первый кадр,
 * пережатие убило бы анимацию.
 */
async function compressImage(file: File): Promise<File> {
  if (file.type === "image/gif" || file.size <= SKIP_COMPRESSION_UNDER_BYTES) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    // Белая подложка — на случай прозрачных PNG, при конвертации в JPEG
    // прозрачность всё равно теряется.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", COMPRESS_QUALITY),
    );

    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.\w+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    // Не удалось прочитать/сжать (повреждённый файл, неподдерживаемый формат
    // в этом браузере и т.п.) — отправляем как есть, сервер сам отбракует.
    return file;
  }
}

/**
 * Загружает файл на сервер, который сохраняет его в Vercel Blob.
 *
 * Раньше здесь использовался клиентский `upload()` из `@vercel/blob/client`
 * (прямая загрузка из браузера в Blob), но он натыкается на известный баг
 * SDK: браузер обращается к vercel.com/api/blob/... и получает отказ
 * из-за отсутствия CORS-заголовков (не чинится на стороне приложения).
 * Поэтому файл идёт через наш собственный роут — с предварительным сжатием
 * на клиенте, чтобы уложиться в лимит тела запроса serverless-функции.
 */
export async function uploadPhoto(file: File): Promise<string> {
  const upload = await compressImage(file);

  const formData = new FormData();
  formData.append("file", upload);

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

  if (response.status === 413) {
    throw new Error("Файл слишком большой. Попробуйте выбрать фото поменьше.");
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
