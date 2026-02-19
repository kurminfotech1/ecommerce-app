import crypto from "crypto";

/* -----------------------------------------------------
   CONFIGURATION
----------------------------------------------------- */

const IV_LENGTH = 12; // Recommended for AES-GCM
const AUTH_TAG_LENGTH = 16;

// Ensure we always get a 32-byte key (AES-256 requirement)
function getEncryptionKey(): Buffer {
  const secret = "your_super_secret_key_here";

  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  // Derive a 32-byte key using SHA-256
  return crypto.createHash("sha256").update(secret).digest();
}

/* -----------------------------------------------------
   ENCRYPT
----------------------------------------------------- */

export function encryptData<T>(data: T): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Final format: iv + authTag + encryptedData
  const payload = Buffer.concat([iv, authTag, encrypted]);

  return payload.toString("base64");
}

/* -----------------------------------------------------
   DECRYPT
----------------------------------------------------- */

export function decryptData<T = any>(token: string): T | null {
  try {
    const key = getEncryptionKey();
    const buffer = Buffer.from(token, "base64");

    if (buffer.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      return null;
    }

    const iv = buffer.subarray(0, IV_LENGTH);
    const authTag = buffer.subarray(
      IV_LENGTH,
      IV_LENGTH + AUTH_TAG_LENGTH
    );
    const encrypted = buffer.subarray(
      IV_LENGTH + AUTH_TAG_LENGTH
    );

    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key,
      iv
    );

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString("utf8"));
  } catch {
    return null;
  }
}
