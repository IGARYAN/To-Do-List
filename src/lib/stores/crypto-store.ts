// ================== ШИФРОВАНИЕ ==================

/**
 * Шифрует данные, используя пользовательский пароль.
 * param data - Любые данные, которые нужно зашифровать
 * param userPin - Пароль, вводимый пользователем (используется для генерации ключа)
 * returns Зашифрованный текст в base64
 */
export async function encryptData(data: any, userPin: string): Promise<{ cipher: string, iv: string, salt: string }> {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    
    const key = await getKey(userPin, salt.buffer as ArrayBuffer);
    const encodedData = new TextEncoder().encode(JSON.stringify(data));
    
    const cipherBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encodedData
    );

    return {
        cipher: bufferToBase64(cipherBuffer),
        iv: bufferToBase64(iv.buffer as ArrayBuffer),
        salt: bufferToBase64(salt.buffer as ArrayBuffer),
    };
}

// ================== ДЕШИФРОВАНИЕ ==================

/**
 * Дешифрует данные, используя пользовательский пароль.
 * param cipher - Зашифрованные данные в base64
 * param userPin - Пароль, вводимый пользователем (используется для генерации ключа)
 * returns Объект { success: true/false, data: расшифрованные данные или null }
 */
export async function decryptData(cipher: string, userPin: string, iv: string, salt: string): Promise<{ success: boolean; data: any | null }> {
    try {
        const saltBuffer = base64ToBuffer(salt);
        const ivBuffer = base64ToBuffer(iv);
        
        const key = await getKey(userPin, saltBuffer);
        
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: new Uint8Array(ivBuffer) },
            key,
            base64ToBuffer(cipher)
        );

        return { success: true, data: JSON.parse(new TextDecoder().decode(decryptedBuffer)) };
    } catch (err) {
        console.error("❌ Ошибка при расшифровке:", err);
        return { success: false, data: null };
    }
}

// ================== ГЕНЕРАЦИЯ КЛЮЧА ==================

/**
 * Генерирует ключ на основе пользовательского пароля
 * param password - Пароль, введённый пользователем
 * returns Готовый криптографический ключ
 */
async function getKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

// ================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==================

/**
 * Преобразует ArrayBuffer в строку base64
 * param buffer - Массив байт
 * returns Строка base64
 */
function bufferToBase64(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

/**
 * Преобразует строку base64 в ArrayBuffer
 * param base64 - Строка base64
 * returns ArrayBuffer
 */
function base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    return Uint8Array.from(binary, c => c.charCodeAt(0)).buffer;
}
