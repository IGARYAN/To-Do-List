export async function encryptData(data: any, pin: string): Promise<{ cipher: string; iv: string }> {
    const ivArray = window.crypto.getRandomValues(new Uint8Array(12)); // Генерация IV
    const key = await getKey(pin); // Получаем ключ из PIN

    const encodedData = new TextEncoder().encode(JSON.stringify(data));
    const cipherBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: ivArray },
        key,
        encodedData
    );

    return {
        cipher: bufferToBase64(cipherBuffer),
        iv: bufferToBase64(ivArray.buffer), // Передаём чистый ArrayBuffer
    };
}

export async function decryptData(cipher: string, iv: string, pin: string): Promise<any | null> {
    try {
        const key = await getKey(pin);
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: base64ToBuffer(iv) }, // Ожидает ArrayBuffer
            key,
            base64ToBuffer(cipher)
        );

        const decoded = new TextDecoder().decode(decryptedBuffer);
        return JSON.parse(decoded);
    } catch (err) {
        console.error("❌ Ошибка при расшифровке:", err);
        return null;
    }
}

async function getKey(pin: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(pin),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: encoder.encode(pin), // Используем PIN как соль
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

function bufferToBase64(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    return Uint8Array.from(binary, c => c.charCodeAt(0)).buffer;
}
