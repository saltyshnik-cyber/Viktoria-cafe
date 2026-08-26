import { upload } from "@vercel/blob/client";

/**
 * Загружает файл напрямую из браузера в Vercel Blob.
 *
 * Через наш серверный роут (`/api/admin/upload`) проходит только небольшой
 * запрос "дай токен" — сами байты файла уходят прямиком в Blob-хранилище,
 * минуя ограничение Vercel на размер тела serverless-функции.
 */
export async function uploadPhoto(file: File): Promise<string> {
  try {
    const blob = await upload(file.name, file, {
      access: "public",
      handleUploadUrl: "/api/admin/upload",
      contentType: file.type || "application/octet-stream",
    });
    return blob.url;
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Не удалось загрузить фото: ${detail}`);
  }
}
