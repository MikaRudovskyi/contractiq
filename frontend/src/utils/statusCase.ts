// Backend (C#) повертає enum-и як PascalCase рядки: "Active", "InProgress", "TimeMaterial".
// Існуючі UI-компоненти (StatusBadge тощо) написані під snake_case/lowercase: "active", "in_progress".
// Ця функція переводить будь-яке PascalCase значення з API у формат, який очікує UI.
export function toUiStatus(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase();
}

// Зворотна функція — якщо колись знадобиться відправити статус назад на backend.
export function toApiStatus(value: string): string {
  return value
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
