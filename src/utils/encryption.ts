import { createId } from "@paralleldrive/cuid2";

/**
 * 生成用户API密钥
 * 格式：ak-{cuid}
 */
export function generateUserApiKey(): string {
  return `ak-${createId()}`;
}

/**
 * AES-GCM加密函数（生产级加密）
 */
export async function encryptApiKey(apiKey: string, encryptionKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);

  // 导入密钥
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(encryptionKey.padEnd(32, "0").slice(0, 32)),
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );

  // 生成随机IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // AES-GCM加密
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, keyMaterial, data);

  // 将IV和加密数据组合
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...result));
}

/**
 * AES-GCM解密函数（生产级解密）
 */
export async function decryptApiKey(encryptedApiKey: string, encryptionKey: string): Promise<string> {
  try {
    const encoder = new TextEncoder();

    // 导入密钥
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(encryptionKey.padEnd(32, "0").slice(0, 32)),
      { name: "AES-GCM" },
      false,
      ["decrypt"],
    );

    // 解码base64数据
    const encryptedData = new Uint8Array(
      atob(encryptedApiKey)
        .split("")
        .map((c) => c.charCodeAt(0)),
    );

    // 分离IV和加密数据
    const iv = encryptedData.slice(0, 12);
    const encrypted = encryptedData.slice(12);

    // AES-GCM解密
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, keyMaterial, encrypted);

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    throw new Error("Failed to decrypt API key");
  }
}
