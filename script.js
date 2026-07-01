// Константы цен
const PRICE_ADULT = 1500;
const PRICE_CHILD = 1200;

// Данные текущего заказа
let order = { adults: 1, children: 0, hours: 1, total: 1500 };

// Переменные таймера
let timerInterval = null;
const SESSION_TIME = 5 * 60; // 5 минут в секундах

// Инпуты бронирования
const inAdults = document.getElementById('adults');
const inChildren = document.getElementById('children');
const inHours = document.getElementById('hours');

// Инпуты банковской карты
const cardNum = document.getElementById('card-number');
const cardMonth = document.getElementById('card-month');
const cardYear = document.getElementById('card-year');
const cardCvc = document.getElementById('card-cvc');

// Вывод плавных уведомлений в углу экрана
function showFieldError(message) {
    const container = document.getElementById('notification-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);

    // Плавное появление
    setTimeout(() => toast.classList.add('show'), 50);

    // Автоматическое удаление через 3.5 секунды
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3500);
}

// Навигация между экранами
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// Запуск и управление таймером оплаты
function startPaymentTimer() {
    clearInterval(timerInterval);
    let timeLeft = SESSION_TIME;
    const timerDisplay = document.getElementById('payment-timer');

    timerInterval = setInterval(() => {
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;

        minutes = minutes < 10 ? '0' + minutes : minutes;
        seconds = seconds < 10 ? '0' + seconds : seconds;

        timerDisplay.innerText = `${minutes}:${seconds}`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            showFieldError('Время сессии оплаты истекло! Оформление сброшено.');
            resetToStart();
        }
        timeLeft--;
    }, 1000);
}

// Динамический пересчет стоимости в чеке
function updateReceipt() {
    let adults = parseInt(inAdults.value) || 0;
    let children = parseInt(inChildren.value) || 0;
    let hours = parseInt(inHours.value) || 1;

    if (adults < 0) { adults = 0; inAdults.value = 0; }
    if (children < 0) { children = 0; inChildren.value = 0; }

    let total = ((adults * PRICE_ADULT) + (children * PRICE_CHILD)) * hours;

    order = { adults, children, hours, total };

    document.getElementById('receipt-adults').innerText = `${adults} × ${PRICE_ADULT} руб.`;
    document.getElementById('receipt-children').innerText = `${children} × ${PRICE_CHILD} руб.`;
    document.getElementById('receipt-hours').innerText = `${hours} ч.`;
    document.getElementById('receipt-total-price').innerText = `${total} руб.`;
    document.getElementById('pay-total-price').innerText = total;
}

// Отслеживание изменений на первом экране
[inAdults, inChildren, inHours].forEach(el => el.addEventListener('input', updateReceipt));

// Переход к форме оплаты с запуском таймера
document.getElementById('btn-go-to-pay').addEventListener('click', () => {
    if (order.adults === 0 && order.children === 0) {
        showFieldError('Выберите хотя бы один билет!');
        return;
    }
    switchScreen('screen-payment');
    startPaymentTimer();
});

/* --- ФОРМАТИРОВАНИЕ И МАСКИ КАРТЫ --- */

// Пробелы в номере карты каждые 4 цифры и автопереход
cardNum.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let parts = [];

    for (let i = 0, len = value.length; i < len; i += 4) {
        parts.push(value.substring(i, i + 4));
    }

    e.target.value = parts.length > 0 ? parts.join(' ') : value;
    
    if (value.length === 16) cardMonth.focus();
});

// Только цифры для остальных полей и цепочка фокуса
const filterNumbers = (e) => e.target.value = e.target.value.replace(/[^0-9]/g, '');

cardMonth.addEventListener('input', (e) => {
    filterNumbers(e);
    if (e.target.value.length === 2) cardYear.focus();
});

cardYear.addEventListener('input', (e) => {
    filterNumbers(e);
    if (e.target.value.length === 2) cardCvc.focus();
});

cardCvc.addEventListener('input', filterNumbers);

/* --- КНОПКА "ОПЛАТИТЬ" И РЕНДЕР КВИТАНЦИЙ --- */
document.getElementById('btn-pay').addEventListener('click', () => {
    const rawNumber = cardNum.value.replace(/\s/g, '');
    const month = parseInt(cardMonth.value);
    const year = parseInt(cardYear.value);

    // Валидация полей карты
    if (rawNumber.length < 16) {
        showFieldError('Номер карты должен содержать 16 цифр!');
        return;
    }
    if (!month || month < 1 || month > 12) {
        showFieldError('Некорректный месяц (01-12)!');
        return;
    }
    if (!year || cardYear.value.length < 2) {
        showFieldError('Укажите корректный год действия!');
        return;
    }
    if (cardCvc.value.length < 3) {
        showFieldError('Код CVC должен состоять из 3 цифр!');
        return;
    }

    // Останавливаем таймер, так как оплата прошла успешно
    clearInterval(timerInterval);

    // Создание квитанций на экране успеха
    const ticketsContainer = document.getElementById('final-tickets');
    ticketsContainer.innerHTML = ''; 

    // Заготовки SVG для QR-кода и Штрихкода (векторные, без внешних картинок)
    const qrSvg = `<svg width="50" height="50" viewBox="0 0 4 4" shape-rendering="crispEdges"><rect width="1" height="1" x="0" y="0"/><rect width="1" height="1" x="3" y="0"/><rect width="1" height="1" x="0" y="3"/><rect width="1" height="1" x="3" y="3"/><rect width="1" height="1" x="1" y="1"/><rect width="1" height="1" x="2" y="2"/></svg>`;
    const barcodeSvg = `<svg width="100%" height="30" viewBox="0 0 100 30" preserveAspectRatio="none"><rect x="0" width="3" height="30"/><rect x="5" width="1" height="30"/><rect x="8" width="4" height="30"/><rect x="14" width="2" height="30"/><rect x="18" width="1" height="30"/><rect x="21" width="3" height="30"/><rect x="26" width="5" height="30"/><rect x="33" width="2" height="30"/><rect x="37" width="1" height="30"/><rect x="40" width="4" height="30"/><rect x="46" width="2" height="30"/><rect x="50" width="3" height="30"/><rect x="55" width="1" height="30"/><rect x="58" width="4" height="30"/><rect x="64" width="2" height="30"/><rect x="68" width="1" height="30"/><rect x="71" width="3" height="30"/><rect x="76" width="5" height="30"/><rect x="83" width="2" height="30"/><rect x="87" width="4" height="30"/><rect x="93" width="2" height="30"/><rect x="97" width="3" height="30"/></svg>`;

    // Рендер взрослых билетов
    for (let i = 1; i <= order.adults; i++) {
        const randId = Math.floor(100000 + Math.random() * 900000);
        ticketsContainer.innerHTML += `
            <div class="real-ticket">
                <div class="ticket-header">
                    <span>ЭЛЕКТРОННЫЙ БИЛЕТ</span>
                    <span>№${randId}</span>
                </div>
                <div class="ticket-body">
                    <div class="ticket-info">
                        <p>Категория посетитея</p>
                        <h4>Взрослый (Билет ${i} из ${order.adults})</h4>
                        <p>Длительность сеанса</p>
                        <h4>${order.hours} ч.</h4>
                        <div class="ticket-price">${PRICE_ADULT * order.hours} ₽</div>
                    </div>
                    <div class="ticket-crypto">
                        ${qrSvg}
                        <span style="font-size:9px; color:#94a3b8; margin-top:4px;">SCAN ME</span>
                    </div>
                </div>
                <div class="ticket-footer">
                    ${barcodeSvg}
                </div>
            </div>
        `;
    }

    // Рендер детских билетов
    for (let i = 1; i <= order.children; i++) {
        const randId = Math.floor(100000 + Math.random() * 900000);
        ticketsContainer.innerHTML += `
            <div class="real-ticket" style="border-top: 3px solid var(--warning);">
                <div class="ticket-header" style="background: var(--warning);">
                    <span>ЭЛЕКТРОННЫЙ БИЛЕТ</span>
                    <span>№${randId}</span>
                </div>
                <div class="ticket-body">
                    <div class="ticket-info">
                        <p>Категория посетитея</p>
                        <h4>Детский до 10 лет (${i} из ${order.children})</h4>
                        <p>Длительность сеанса</p>
                        <h4>${order.hours} ч.</h4>
                        <div class="ticket-price">${PRICE_CHILD * order.hours} ₽</div>
                    </div>
                    <div class="ticket-crypto">
                        ${qrSvg}
                        <span style="font-size:9px; color:#94a3b8; margin-top:4px;">SCAN ME</span>
                    </div>
                </div>
                <div class="ticket-footer">
                    ${barcodeSvg}
                </div>
            </div>
        `;
    }

    switchScreen('screen-success');
});

// Общая функция сброса данных к начальному состоянию
function resetToStart() {
    clearInterval(timerInterval);
    inAdults.value = 1;
    inChildren.value = 0;
    inHours.value = 1;
    cardNum.value = '';
    cardMonth.value = '';
    cardYear.value = '';
    cardCvc.value = '';
    updateReceipt();
    switchScreen('screen-booking');
}

// Кнопка возврата на первый экран
document.getElementById('btn-restart').addEventListener('click', resetToStart);

// Логика кнопки "Вернуться назад" на экране оплаты
document.getElementById('btn-back-to-booking').addEventListener('click', () => {
    clearInterval(timerInterval); // Сбрасываем таймер сессии
    switchScreen('screen-booking'); // Возвращаемся на экран бронирования
});
