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
const API_BASE_URL = 'https://meetslot-api-backend-production.up.railway.app';

// -----------------------------------------------------
// 2. ИНИЦИАЛИЗАЦИЯ И ЭЛЕМЕНТЫ
// -----------------------------------------------------

const wheel = document.getElementById('wheel');
const spinButton = document.getElementById('spinButton');
const resultModal = document.getElementById('resultModal');
const prizeText = document.getElementById('prizeText');
let isSpinning = false;

// -----------------------------------------------------
// 3. ФУНКЦИИ ВЗАИМОДЕЙСТВИЯ С TELEGRAM
// -----------------------------------------------------

/**
 * Инициализация и проверка статуса спина.
 * Вызывается при загрузке Mini App.
 */
function initTelegramApp() {
    try {
        // Устанавливаем цвет кнопки и фон, если доступно
        window.Telegram.WebApp.ready();
        const Button = window.Telegram.WebApp.MainButton;
        Button.setText("Закрыть рулетку");
        Button.onClick(() => window.Telegram.WebApp.close());
        Button.show();

        console.log("Telegram WebApp инициализировано.");

        // В реальном приложении здесь должен быть запрос к API_BASE_URL
        // для проверки: доступен ли спин сегодня (см. handleSpinClick)

    } catch (e) {
        console.error("Ошибка инициализации Telegram WebApp. Запущено не в Telegram.", e);
        // Можно показать сообщение, что приложение нужно запускать в Telegram
    }
}

/**
 * Отправляет запрос на бэкенд для проверки и получения результата.
 * @returns {Promise<number|null>} Индекс сектора для выигрыша или null.
 */
async function getSpinResultFromBackend() {
    // ВНИМАНИЕ: Это заглушка! В реальном коде вам нужно:
    // 1. Отправить запрос на ваш бэкенд (API_BASE_URL + '/check_and_spin')
    // 2. Передать в заголовках или теле запроса window.Telegram.WebApp.initData
    // 3. Бэкенд должен проверить:
    //    a) Валидность пользователя (используя initData)
    //    b) Крутил ли он сегодня (пользовательский ID из БД)
    //    c) Если нет, выбрать приз, сохранить в БД и вернуть его индекс.

    // --- Заглушка для ДЕМОНСТРАЦИИ ---
    console.log("Запрос результата на бэкенд...");
    // Выбираем случайный приз
    const randomIndex = Math.floor(Math.random() * NUM_SECTORS);
    await new Promise(resolve => setTimeout(resolve, 500)); // Имитация задержки сети

    // Имитация проверки, если пользователь уже крутил
    // if (localStorage.getItem('lastSpinDate') === new Date().toDateString()) {
    //    alert("Вы уже крутили сегодня! Попробуйте завтра.");
    //    return null;
    // }

    // localStorage.setItem('lastSpinDate', new Date().toDateString());
    return randomIndex; // Индекс от 0 до 9
    // --- Конец Заглушки ---
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

    // 1. Получаем результат (индекс выигрышного сектора) от бэкенда
    const winningIndex = await getSpinResultFromBackend();

    if (winningIndex === null) {
        // Спин недоступен (пользователь уже крутил)
        isSpinning = false;
        spinButton.disabled = false;
        return;
    }

    // 2. Вычисляем угол, на который нужно повернуть рулетку
    const baseRotations = 5; // Минимум 5 полных оборотов
    // Угол сектора: 360 / 10 = 36 градусов.
    // Угол выигрыша: (NUM_SECTORS - 1 - winningIndex) * SECTOR_ANGLE
    // Мы используем NUM_SECTORS - 1, потому что 0-й сектор находится сверху.
    const degreesToWin = (NUM_SECTORS - winningIndex - 0.5) * SECTOR_ANGLE;

    // Угол для вращения
    const finalRotation = (baseRotations * 360) + degreesToWin;

    // 3. Применяем анимацию вращения
    wheel.style.transition = 'transform 5s cubic-bezier(0.2, 0.8, 0.2, 1)';
    wheel.style.transform = `rotate(${finalRotation}deg)`;

    // 4. Ждем завершения анимации
    setTimeout(() => {
        // 5. Показываем результат
        const prize = PRIZES[winningIndex];
        showModal(prize);

        // 6. Сбрасываем состояние
        isSpinning = false;
        // В реальном приложении кнопка остается disabled до следующего дня
        // spinButton.disabled = false; // <-- Если только для тестирования

        // ВАЖНО: Здесь также нужно отправить финальный POST-запрос на бэкенд
        // (например, '/log_win'), чтобы подтвердить получение приза.

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
    // После закрытия модального окна можно закрыть Mini App
    // window.Telegram.WebApp.close();
}

// Запускаем инициализацию при загрузке
window.onload = initTelegramApp;