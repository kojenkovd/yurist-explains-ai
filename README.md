# Юрист объясняет | AI — финальная сборка

## Что загружать в GitHub
Загрузи ВСЕ файлы из этой папки в корень репозитория `kojenkovd/yurist-explains-ai`.

GitHub Pages будет использовать `index.html` и `background.jpg`. Файлы `worker.js` и `wrangler.jsonc` лежат рядом и не мешают GitHub Pages; они нужны на следующем этапе для Cloudflare Worker и настоящего AI.

## Важно
1. Сначала публикуем этот комплект на GitHub Pages и проверяем интерфейс.
2. Затем разворачиваем `worker.js` в Cloudflare Workers с AI binding `AI`.
3. После появления адреса Worker подключаем его к `index.html` как API endpoint.

Секретные ключи и токены в этот репозиторий не добавлять.

Made by kojenkov
