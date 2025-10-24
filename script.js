// -----------------------------------------------------
// 1. КОНФИГУРАЦИЯ
// -----------------------------------------------------

const PRIZES = [
    "🎁 6000 meet-бонусов",
    "🎁 5000 meet-бонусов",
    "🎁 4000 meet-бонусов",
    "🎁 3000 meet-бонусов",
    "🎁 2000 meet-бонусов",
    "🎁 1000 meet-бонусов",
    "🚚 Промокод на бесплатную доставку",
    "👑 Скидка 10% (от 20 000 ₽)",
    "👑 Скидка 15% (от 25 000 ₽)",
    "🔥 SoleFresh к заказу"
];
const NUM_SECTORS = PRIZES.length;
const SECTOR_ANGLE = 360 / NUM_SECTORS; // 36 градусов на сектор

// URL вашего бэкенд API на Railway (замените на реальный URL!)
// Вы только что подтвердили, что этот URL используется:
const API_BASE_URL = 'https://meetslot-api-backend-production.up.railway.app/api';

// -----------------------------------------------------
// 2. ИНИЦИАЛИЗАЦИЯ И ЭЛЕМЕНТЫ
// -----------------------------------------------------

const wheel = document.getElementById('wheel');
const spinButton = document.getElementById('spinButton');
const resultModal = document.getElementById('resultModal');
const prizeText = document.getElementById('prizeText');
const errorText = document.getElementById('errorText');
let isSpinning = false;
let currentPrizeIndex = null; // Индекс, который мы сохраняем после проверки

// -----------------------------------------------------
// 3. ФУНКЦИИ ВЗАИМОДЕЙСТВИЯ С TELEGRAM
// -----------------------------------------------------

/**
 * Инициализация и проверка статуса спина.
 * Вызывается при загрузке Mini App.
 */
function initTelegramApp() {
    try {
        window.Telegram.WebApp.ready();
        const Button = window.Telegram.WebApp.MainButton;
        Button.setText("Закрыть рулетку");
        Button.onClick(() => window.Telegram.WebApp.close());
        Button.show();

        console.log("Telegram WebApp инициализировано.");

        // Попытка проверки статуса рулетки при загрузке (по желанию)
        // checkSpinStatus();

    } catch (e) {
        console.error("Ошибка инициализации Telegram WebApp. Запущено не в Telegram.", e);
    }
}

/**
 * Показывает сообщение об ошибке (например, таймер или отказ сети)
 * @param {string} message - Сообщение для пользователя
 */
function showAppMessage(message) {
    // Временно используем errorText для отображения сообщений
    errorText.textContent = message;
    errorText.style.display = 'block';
    setTimeout(() => {
        errorText.style.display = 'none';
        errorText.textContent = '';
    }, 5000);
}


/**
 * Отправляет запрос на бэкенд для проверки и получения результата.
 * Возвращает индекс сектора или сообщение о таймере/ошибке.
 * @returns {Promise<number|null>} Индекс сектора для выигрыша или null.
 */
async function getSpinResultFromBackend() {
    console.log("Запрос результата на бэкенд...");

    // Получаем данные аутентификации Telegram
    const initData = window.Telegram.WebApp.initData;

    try {
        const response = await fetch(`${API_BASE_URL}/check_and_spin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Отправляем initData в заголовке для аутентификации на бэкенде
                'X-Telegram-Init-Data': initData
            },
            // Тело запроса пустое, все данные в заголовке
            body: JSON.stringify({})
        });

        // Если ответ не 200, значит, произошла ошибка или отказ
        if (!response.ok) {
            const errorData = await response.json();

            // Если бэкенд вернул сообщение о таймере (403 Forbidden, например)
            if (response.status === 403 && errorData.error_message) {
                showAppMessage(errorData.error_message); // Покажет "Попробуйте через X часов..."
                return null;
            }

            // Общая ошибка бэкенда
            showAppMessage(`Ошибка: ${errorData.error_message || 'Неизвестная ошибка сервера'}`);
            console.error('API Error:', errorData);
            return null;
        }

        const data = await response.json();

        // Ожидаем, что бэкенд вернет индекс приза
        if (typeof data.prize_index === 'number') {
            return data.prize_index; // Индекс от 0 до 9
        } else {
            showAppMessage('Ошибка: Бэкенд не вернул индекс приза.');
            return null;
        }

    } catch (e) {
        // Ошибка сети или CORS
        console.error("Ошибка при выполнении запроса к API:", e);
        showAppMessage("Ошибка подключения к серверу. Попробуйте позже.");
        return null;
    }
}

// -----------------------------------------------------
// 4. ЛОГИКА РУЛЕТКИ
// -----------------------------------------------------

/**
 * Вызывается по нажатию кнопки "Испытать Удачу!".
 */
async function handleSpinClick() {
    if (isSpinning) return;
    isSpinning = true;
    spinButton.disabled = true;
    errorText.style.display = 'none'; // Скрываем предыдущие ошибки

    // 1. Получаем результат (индекс выигрышного сектора) от бэкенда
    const winningIndex = await getSpinResultFromBackend();

    if (winningIndex === null) {
        // Спин недоступен (пользователь уже крутил или произошла ошибка)
        isSpinning = false;
        spinButton.disabled = false;
        return;
    }

    currentPrizeIndex = winningIndex; // Сохраняем индекс для последующей обработки

    // 2. Вычисляем угол, на который нужно повернуть рулетку
    const baseRotations = 5; // Минимум 5 полных оборотов
    // Угол сектора: 360 / 10 = 36 градусов.
    // Мы используем 0.5 для центрирования стрелки на секторе.
    const degreesToWin = (NUM_SECTORS - winningIndex - 0.5) * SECTOR_ANGLE;

    // Угол для вращения
    const finalRotation = (baseRotations * 360) + degreesToWin;

    // 3. Применяем анимацию вращения
    wheel.style.transition = 'transform 5s cubic-bezier(0.2, 0.8, 0.2, 1)';
    wheel.style.transform = `rotate(${finalRotation}deg)`;

    // 4. Ждем завершения анимации
    setTimeout(() => {
        // 5. Показываем результат
        const prize = PRIZES[currentPrizeIndex];
        showModal(prize);

        // 6. Сбрасываем состояние
        isSpinning = false;
        // Кнопка остается disabled, так как спин использован

    }, 5500); // 5000 мс вращение + 500 мс запас
}

// -----------------------------------------------------
// 5. ФУНКЦИИ МОДАЛЬНОГО ОКНА
// -----------------------------------------------------

function showModal(prize) {
    prizeText.textContent = `Вы выиграли: ${prize}`;
    resultModal.style.display = 'block';
}

function closeModal() {
    resultModal.style.display = 'none';
    // window.Telegram.WebApp.close(); // Можно закрывать приложение
}

// Запускаем инициализацию при загрузке
window.onload = initTelegramApp;
