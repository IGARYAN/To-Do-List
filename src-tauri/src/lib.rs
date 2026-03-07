// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use tauri_plugin_autostart::MacosLauncher;

#[tauri::command]
fn greet(name: &str) -> String {
    // Формируем строку приветствия
    // format! создаёт новую строку
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Лог в консоль для отладки запуска приложения
    println!("🚀 Starting Tauri application...");

    tauri::Builder::default()
        // MacosLauncher обязателен даже если приложение работает не на macOS
        // None означает отсутствие аргументов запуска
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        // Плагин работы с файловой системой
        .plugin(tauri_plugin_fs::init())
        // Плагин открытия файлов / ссылок
        .plugin(tauri_plugin_opener::init())
        // Регистрация команд Rust, которые можно вызывать из фронтенда
        .invoke_handler(tauri::generate_handler![greet])
        // Запуск приложения
        .run(tauri::generate_context!())
        // Если приложение не запустилось — выводим ошибку
        .expect("❌ error while running tauri application");
}
