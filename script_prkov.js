// Переменные экранов и элементов управления
const screens = document.querySelectorAll('.screen');
const steps = document.querySelectorAll('.step');
const progressLine = document.getElementById('progress-line');
const notificationContainer = document.getElementById('notification-container');

let currentStep = 1;

// Функция для показа кастомного уведомления
function showNotification(message) {
    const alertBox = document.createElement('div');
    alertBox.className = 'custom-alert';
    alertBox.textContent = message;

    notificationContainer.appendChild(alertBox);

    // Через 3.5 секунды запускаем анимацию скрытия
    setTimeout(() => {
        alertBox.classList.add('hide');
    }, 3500);

    // Через 4 секунды (после завершения анимации скрытия) полностью удаляем из HTML
    setTimeout(() => {
        alertBox.remove();
    }, 3900);
}

// Переключение экранов
function showScreen(stepNumber) {
    currentStep = stepNumber;
    
    screens.forEach((screen, index) => {
        screen.classList.toggle('active', index === stepNumber - 1);
    });

    steps.forEach((step, index) => {
        step.classList.toggle('active', index < stepNumber);
    });

    const progressWidth = ((stepNumber - 1) / (steps.length - 1)) * 100;
    progressLine.style.width = `${progressWidth}%`;
}

// Кнопки Назад
document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (currentStep > 1) showScreen(currentStep - 1);
    });
});

// Находим элементы времени для валидации на лету
const parkHoursInput = document.getElementById('park-hours');
const parkMinutesInput = document.getElementById('park-minutes');
const parkingNumberInput = document.getElementById('parking-number');

// Защита от отрицательных чисел для номера парковки
parkingNumberInput.addEventListener('input', (e) => {
    if (e.target.value < 0) e.target.value = '';
});

// Валидация часов на лету (разрешаем пустоту, убираем минус, макс 10)
parkHoursInput.addEventListener('input', (e) => {
    if (e.target.value === '') return; // Позволяем полностью стереть цифру
    let val = parseInt(e.target.value);
    if (val < 0 || isNaN(val)) e.target.value = '';
    if (val > 10) e.target.value = 10;
});

// Валидация минут на лету (разрешаем пустоту, убираем минус, макс 59)
parkMinutesInput.addEventListener('input', (e) => {
    if (e.target.value === '') return; // Позволяем полностью стереть цифру
    let val = parseInt(e.target.value);
    if (val < 0 || isNaN(val)) e.target.value = '';
    if (val > 59) e.target.value = 59;
});

// Переход с 1 на 2 экран (Логика расчёта стоимости)
document.getElementById('to-screen-2').addEventListener('click', () => {
    const parkingNum = parkingNumberInput.value.trim();
    // Если поле пустое, считаем его за 0
    const hours = parseInt(parkHoursInput.value) || 0;
    const minutes = parseInt(parkMinutesInput.value) || 0;

    if (!parkingNum || parkingNum <= 0) {
        showNotification('Пожалуйста, введите корректный номер парковки.');
        return;
    }

    if (hours === 0 && minutes === 0) {
        showNotification('Время стоянки не может быть нулевым.');
        return;
    }

    // Проверка на максимальное время (10 часов)
    if (hours > 10 || (hours === 10 && minutes > 0)) {
        showNotification('Максимальное время парковки составляет 10 часов.');
        return;
    }

    let totalHours = hours;
    if (minutes > 0) {
        totalHours += 1;
    }
    
    const pricePerHour = 300;
    const totalPrice = totalHours * pricePerHour;

    document.getElementById('receipt-parking').textContent = `№ ${parkingNum}`;
    document.getElementById('receipt-time').textContent = `${hours} ч. ${minutes} мин.`;
    document.getElementById('receipt-total').textContent = `${totalPrice} руб.`;

    showScreen(2);
});

// Переход со 2 на 3 экран
document.getElementById('to-screen-3').addEventListener('click', () => {
    showScreen(3);
});

// Маски для ввода банковской карты
const cardNumber = document.getElementById('card-number');
const cardExpiry = document.getElementById('card-expiry');
const cardCvv = document.getElementById('card-cvv');

// Разделение номера карты по 4 цифры (Удобное форматирование на лету)
cardNumber.addEventListener('input', (e) => {
    let cursorPosition = e.target.selectionStart;
    let originalLength = e.target.value.length;
    let digitsOnly = e.target.value.replace(/\D/g, '');
    
    let formattedValue = '';
    for (let i = 0; i < digitsOnly.length; i++) {
        if (i > 0 && i % 4 === 0) {
            formattedValue += ' ';
        }
        formattedValue += digitsOnly[i];
    }
    
    e.target.value = formattedValue;
    
    let newLength = formattedValue.length;
    let diff = newLength - originalLength;
    e.target.setSelectionRange(cursorPosition + diff, cursorPosition + diff);
});

// Добавление косой черты в срок действия (ММ/ГГ)
cardExpiry.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\//g, '').replace(/[^0-9]/gi, '');
    if (value.length >= 2) {
        e.target.value = value.substring(0, 2) + '/' + value.substring(2, 4);
    } else {
        e.target.value = value;
    }
});

// Только цифры для CVV
cardCvv.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/gi, '');
});

// Переход с 3 на 4 экран (Валидация формата)
document.getElementById('to-screen-4').addEventListener('click', () => {
    const numClean = cardNumber.value.replace(/\s/g, '');
    const expiryClean = cardExpiry.value;
    const cvvClean = cardCvv.value;

    if (numClean.length < 16) {
        showNotification('Введите корректный 16-значный номер карты.');
        return;
    }
    if (expiryClean.length < 5) {
        showNotification('Введите срок действия карты в формате ММ/ГГ.');
        return;
    }

    const month = parseInt(expiryClean.substring(0, 2), 10);
    if (month < 1 || month > 12) {
        showNotification('Несуществующий месяц в сроке действия (01-12).');
        return;
    }

    if (cvvClean.length < 3) {
        showNotification('Введите 3-значный код безопасности CVC/CVV.');
        return;
    }

    showScreen(4);
});

// Сброс и возврат на 1 экран
document.getElementById('reset-btn').addEventListener('click', () => {
    document.getElementById('parking-number').value = '';
    parkHoursInput.value = '';
    parkMinutesInput.value = '';
    cardNumber.value = '';
    cardExpiry.value = '';
    cardCvv.value = '';
    
    showScreen(1);
});
