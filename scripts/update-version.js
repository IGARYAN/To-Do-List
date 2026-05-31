/**
 * update-version.js — ESM-версия
 * Скрипт автоматически увеличивает версию формата major.minor.patch.
 * При достижении значения 100 происходит перенос:
 *   patch → minor
 *   minor → major
 * Обновляет:
 *   - version в tauri.conf.json
 *   - title окна
 *   - version в Cargo.toml
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

// Эмуляция __dirname в ESM
// import.meta.url — это URL текущего файла, его нужно преобразовать в путь
const __filename = fileURLToPath(import.meta.url);
// __dirname — каталог, где лежит этот скрипт
const __dirname = join(__filename, '..');

// Формируем путь к tauri.conf.json
const configPath = join(__dirname, '..', 'src-tauri', 'tauri.conf.json');

// Чтение конфига как текста
let raw = readFileSync(configPath, 'utf-8');

// Преобразование JSON-строки в объект
let config = JSON.parse(raw);

// Проверка обязательных полей, чтобы избежать ошибок
if (!config.productName) throw new Error('Отсутствует productName в tauri.conf.json');
if (!config.version) throw new Error('Отсутствует version в tauri.conf.json');
if (!config.app?.windows?.[0]) throw new Error('Отсутствует tauri.app.windows[0]');

// Разбиваем версию на три части и преобразуем каждая к числу
const versionParts = config.version.split('.').map(Number);

// Проверяем формат версии: должно быть ровно 3 числа
if (versionParts.length !== 3 || versionParts.some(n => isNaN(n))) {
    throw new Error('Неверный формат version. Ожидается major.minor.patch');
}

// ------------------------------------------------------
// ЛОГИКА ИНКРЕМЕНТА С ПЕРЕХОДОМ ЧЕРЕЗ 10
// ------------------------------------------------------

// Увеличиваем patch на 1
versionParts[2] += 1;

// Если patch стал 100 → переносим в minor
if (versionParts[2] >= 10) {
    versionParts[2] = 0;      // Сбрасываем patch
    versionParts[1] += 1;     // Увеличиваем minor
}

// Если minor стал 10 → переносим в major
if (versionParts[1] >= 10) {
    versionParts[1] = 0;      // Сбрасываем minor
    versionParts[0] += 1;     // Увеличиваем major
}

// Собираем обновлённую версию обратно в строку
const newVersion = versionParts.join('.');

// Обновляем версию в конфиге
config.version = newVersion;

// Обновляем title окна Tauri — добавляем v<версия>
config.app.windows[0].title = `${config.productName} v${newVersion}`;

// Перезаписываем tauri.conf.json с красивыми отступами
writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');

console.log(`Версия обновлена: ${newVersion}`);
console.log(`Заголовок окна: ${config.app.windows[0].title}`);

// ------------------------------------------------------
// ОБНОВЛЕНИЕ Cargo.toml
// ------------------------------------------------------

// Путь к Cargo.toml
const cargoPath = join(__dirname, '..', 'src-tauri', 'Cargo.toml');

// Читаем Cargo.toml как текст
let cargo = readFileSync(cargoPath, 'utf-8');

// Заменяем строку версии формата:
// version = "X.X.X"
cargo = cargo.replace(/^version\s*=\s*".*"/m, `version = "${newVersion}"`);

// Сохраняем обновлённый файл
writeFileSync(cargoPath, cargo, 'utf-8');

console.log('Cargo.toml обновлён');
