// ✅ Постоянный (жёстко зашитый) пароль для шифрования
// Можно сгенерировать с помощью любого генератора паролей
const STATIC_PASSWORD = "8AkzBre@PN%OodiaG|j6H6}6X}yiyUoK";

// ✅ Постоянный IV (инициализационный вектор), длиной 12 байт (96 бит — стандарт для AES-GCM)
// IV должен быть неизменным для этого типа реализации, так как мы используем PBKDF2 + соль для уникальности
const STATIC_IV = Uint8Array.from([21, 42, 63, 84, 105, 126, 147, 168, 189, 210, 231, 252]);

// ================== ШИФРОВАНИЕ ==================

/**
 * Шифрует данные, используя постоянный пароль и пользовательский PIN в качестве соли.
 * @param data - Любые данные, которые нужно зашифровать
 * @param userPin - PIN-код, вводимый пользователем (используется как соль)
 * @returns Зашифрованный текст в base64
 */
export async function encryptData(data: any, userPin: string): Promise<{ cipher: string }> {
    // Генерируем криптографический ключ с учётом PIN как соли
    const key = await getKey(STATIC_PASSWORD, userPin);

    // Преобразуем данные в байтовый массив
    const encodedData = new TextEncoder().encode(JSON.stringify(data));

    // Шифруем данные с использованием AES-GCM и постоянного IV
    const cipherBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: STATIC_IV },
        key,
        encodedData
    );

    // Возвращаем зашифрованную строку в base64
    return { cipher: bufferToBase64(cipherBuffer) };
}

// ================== ДЕШИФРОВАНИЕ ==================

/**
 * Дешифрует данные, используя постоянный пароль и пользовательский PIN в качестве соли.
 * @param cipher - Зашифрованные данные в base64
 * @param userPin - PIN-код, вводимый пользователем (используется как соль)
 * @returns Объект { success: true/false, data: расшифрованные данные или null }
 */
export async function decryptData(cipher: string, userPin: string): Promise<{ success: boolean; data: any | null }> {
    try {
        // Генерируем ключ на основе введённого PIN
        const key = await getKey(STATIC_PASSWORD, userPin);

        // Пытаемся расшифровать данные
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: STATIC_IV },
            key,
            base64ToBuffer(cipher)
        );

        // Декодируем расшифрованный результат в строку
        const decoded = new TextDecoder().decode(decryptedBuffer);

        // Возвращаем успешно расшифрованные данные
        return { success: true, data: JSON.parse(decoded) };
    } catch (err) {
        // Если PIN неправильный или данные повреждены, дешифровка вызовет ошибку
        console.error("❌ Ошибка при расшифровке:", err);
        return { success: false, data: null };
    }
}

// ================== ГЕНЕРАЦИЯ КЛЮЧА ==================

/**
 * Генерирует ключ на основе постоянного пароля и пользовательского PIN-кода (соль)
 * @param password - Постоянный пароль
 * @param pin - Пользовательский PIN (используется как соль)
 * @returns Готовый криптографический ключ
 */
async function getKey(password: string, pin: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();

    // Импортируем "сырой" ключ из постоянного пароля
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    // Создаём конечный ключ, используя PBKDF2 с PIN в качестве соли
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: encoder.encode(pin), // Соль: пользовательский PIN
            iterations: 50000, // Количество итераций для замедления перебора
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 }, // Используем AES-GCM 256 бит
        false,
        ["encrypt", "decrypt"]
    );
}

// ================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==================

/**
 * Преобразует ArrayBuffer в строку base64
 * @param buffer - Массив байт
 * @returns Строка base64
 */
function bufferToBase64(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

/**
 * Преобразует строку base64 в ArrayBuffer
 * @param base64 - Строка base64
 * @returns ArrayBuffer
 */
function base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    return Uint8Array.from(binary, c => c.charCodeAt(0)).buffer;
}
