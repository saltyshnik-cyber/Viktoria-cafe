const MAX_DIMENSION = 1800;
const COMPRESS_QUALITY = 0.78;
const SKIP_COMPRESSION_UNDER_BYTES = 300 * 1024; // уже компактный файл — не трогаем

/**
 * Сжимает фото в браузере перед загрузкой: уменьшает до разумного разрешения
 * и перекодирует в JPEG. Оставлено и при переходе на Cloudinary: меньше байт
 * летит по сети на телефонных тарифах, и меньше расходуется бесплатный лимит
 * Cloudinary — трансформации Cloudinary (f_auto,q_auto) сжимают дополнительно
 * уже при отдаче, а не заменяют сжатие при загрузке.
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

type CloudinarySignature = {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
};

async function getUploadSignature(): Promise<CloudinarySignature> {
  let res: Response;
  try {
    res = await fetch("/api/admin/upload", { method: "POST" });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Нет соединения с сервером (${detail}). Проверьте интернет и повторите попытку.`);
  }

  if (!res.ok) {
    let detail = "";
    try {
      const json = await res.json();
      detail = typeof json?.error === "string" ? json.error : "";
    } catch {
      try {
        detail = await res.text();
      } catch {
        detail = "";
      }
    }
    throw new Error(`Сервер отклонил запрос на загрузку, код ${res.status}${detail ? `: ${detail}` : ""}`);
  }

  try {
    const json = await res.json();
    if (!json?.signature || !json?.timestamp || !json?.apiKey || !json?.cloudName) throw new Error("empty");
    return json;
  } catch {
    throw new Error("Сервер вернул некорректный ответ при подготовке загрузки.");
  }
}

/**
 * Загружает фото напрямую из браузера в Cloudinary.
 *
 * Через наш серверный роут (`/api/admin/upload`) проходит только небольшой
 * запрос "дай подпись" — сами байты файла уходят прямиком в Cloudinary,
 * минуя ограничение Vercel на размер тела serverless-функции.
 *
 * (Раньше здесь использовался Vercel Blob — аккаунт заблокирован по лимиту
 * трафика, перешли на Cloudinary по тому же паттерну, что и в knife-shop.)
 */
export async function uploadPhoto(file: File): Promise<string> {
  const compressed = await compressImage(file);
  const { timestamp, signature, apiKey, cloudName } = await getUploadSignature();

  const formData = new FormData();
  formData.append("file", compressed);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);

  let uploadRes: Response;
  try {
    uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Не удалось соединиться с Cloudinary (${detail}). Проверьте интернет и повторите попытку.`);
  }

  const json = await uploadRes.json().catch(() => null);

  if (!uploadRes.ok) {
    const detail = json?.error?.message ?? `код ${uploadRes.status}`;
    throw new Error(`Cloudinary отклонил загрузку: ${detail}`);
  }

  if (!json?.secure_url) {
    throw new Error("Cloudinary вернул некорректный ответ при загрузке файла.");
  }

  return json.secure_url as string;
}
