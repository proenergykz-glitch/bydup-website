// Плавная прокрутка к секциям
function scrollToServices() {
    document.getElementById('services').scrollIntoView({
        behavior: 'smooth'
    });
}

// Плавная прокрутка для навигации
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Анимация появления элементов при скролле
function animateOnScroll() {
    const elements = document.querySelectorAll('.service-card, .model-card');
    
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < window.innerHeight - elementVisible) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
}

// Инициализация анимации
document.addEventListener('DOMContentLoaded', function() {
    const elements = document.querySelectorAll('.service-card, .model-card');
    
    elements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
    
    // Запускаем анимацию сразу для видимых элементов
    animateOnScroll();
});

// Обработка скролла
window.addEventListener('scroll', animateOnScroll);

// Изменение навигации при скролле
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    const scrollY = window.scrollY;
    
    if (scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.8)';
        navbar.style.boxShadow = 'none';
    }
});

// Инициализация EmailJS
(function() {
    emailjs.init("YOUR_PUBLIC_KEY"); // Замените на ваш публичный ключ EmailJS
})();

// Обработка формы
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.contact-form');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Получаем данные формы
            const formData = new FormData(form);
            const data = {
                name: form.querySelector('input[type="text"]').value,
                email: form.querySelector('input[type="email"]').value,
                phone: form.querySelector('input[type="tel"]').value,
                service: form.querySelector('select').value,
                message: form.querySelector('textarea').value
            };
            
            // Простая валидация
            const requiredFields = ['name', 'email', 'phone', 'service'];
            let isValid = true;
            
            requiredFields.forEach(field => {
                const input = form.querySelector(`input[type="${field === 'name' ? 'text' : field === 'phone' ? 'tel' : field}"]`) || form.querySelector('select');
                if (input && !input.value.trim()) {
                    isValid = false;
                    input.style.borderColor = '#ff3b30';
                } else if (input) {
                    input.style.borderColor = '#d1d1d6';
                }
            });
            
            if (isValid) {
                // Отправляем данные
                sendFormData(data);
            } else {
                showNotification('Пожалуйста, заполните все обязательные поля.', 'error');
            }
        });
    }
});

// Функция отправки данных
async function sendFormData(data) {
    try {
        // Показываем индикатор загрузки
        const submitButton = document.querySelector('.submit-button');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Отправляем...';
        submitButton.disabled = true;
        
        // Отправляем на EmailJS
        await sendEmail(data);
        
        // Отправляем в Telegram
        await sendTelegramMessage(data);
        
        // Показываем успех
        showNotification('Заявка отправлена успешно! Мы свяжемся с вами в течение 24 часов.', 'success');
        document.querySelector('.contact-form').reset();
        
    } catch (error) {
        console.error('Ошибка отправки:', error);
        showNotification('Произошла ошибка при отправке заявки. Попробуйте позже.', 'error');
    } finally {
        // Восстанавливаем кнопку
        const submitButton = document.querySelector('.submit-button');
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// Отправка email через EmailJS
async function sendEmail(data) {
    const templateParams = {
        from_name: data.name,
        from_email: data.email,
        phone: data.phone,
        service: data.service,
        message: data.message,
        to_email: 'rustam-13-04@mail.ru' // Ваша почта (можно изменить на Gmail)
    };
    
    try {
        await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams);
        console.log('Email отправлен успешно');
    } catch (error) {
        console.error('Ошибка отправки email:', error);
        throw error;
    }
}

// Отправка сообщения в Telegram
async function sendTelegramMessage(data) {
    const botToken = 'YOUR_BOT_TOKEN'; // Токен вашего Telegram бота
    const chatId = 'YOUR_CHAT_ID'; // Ваш Telegram ID
    
    const message = `
🆕 Новая заявка с сайта BYD Services

👤 Имя: ${data.name}
📧 Email: ${data.email}
📱 Телефон: ${data.phone}
🔧 Услуга: ${data.service}
💬 Сообщение: ${data.message || 'Не указано'}

⏰ Время: ${new Date().toLocaleString('ru-RU')}
    `;
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        if (!response.ok) {
            throw new Error('Ошибка отправки в Telegram');
        }
        
        console.log('Сообщение в Telegram отправлено успешно');
    } catch (error) {
        console.error('Ошибка отправки в Telegram:', error);
        // Не выбрасываем ошибку, чтобы email все равно отправился
    }
}

// Функция показа уведомлений
function showNotification(message, type) {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'success' ? '✓' : '⚠'}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    // Стили для уведомления
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#34c759' : '#ff3b30'};
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Автоматическое скрытие
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 4000);
}

// Обработка кнопок заказа услуг
document.addEventListener('DOMContentLoaded', function() {
    const serviceButtons = document.querySelectorAll('.service-button');
    
    serviceButtons.forEach(button => {
        button.addEventListener('click', function() {
            const serviceCard = this.closest('.service-card');
            const serviceName = serviceCard.querySelector('h3').textContent;
            const servicePrice = serviceCard.querySelector('.service-price').textContent;
            
            // Прокручиваем к форме
            document.getElementById('contact').scrollIntoView({
                behavior: 'smooth'
            });
            
            // Выбираем соответствующую услугу в форме
            setTimeout(() => {
                const select = document.querySelector('select');
                if (select) {
                    const options = select.querySelectorAll('option');
                    options.forEach(option => {
                        if (option.textContent.includes(serviceName)) {
                            select.value = option.value;
                            select.style.borderColor = '#007aff';
                        }
                    });
                }
                
                // Показываем уведомление
                showNotification(`Выбрана услуга: ${serviceName} ${servicePrice}`, 'success');
            }, 500);
        });
    });
});

// Эффект параллакса для главного экрана
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    const heroImage = document.querySelector('.hero-image');
    
    if (hero && heroImage) {
        const rate = scrolled * -0.5;
        heroImage.style.transform = `translateY(${rate}px)`;
    }
});

// Ленивая загрузка изображений (для будущих реальных фото)
function lazyLoadImages() {
    const imagePlaceholders = document.querySelectorAll('.car-placeholder');
    
    imagePlaceholders.forEach(placeholder => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Здесь можно добавить загрузку реальных изображений
                    placeholder.style.background = 'linear-gradient(135deg, #007aff 0%, #34c759 100%)';
                    placeholder.style.color = 'white';
                    observer.unobserve(placeholder);
                }
            });
        });
        
        observer.observe(placeholder);
    });
}

// Инициализация ленивой загрузки
document.addEventListener('DOMContentLoaded', lazyLoadImages);

// Добавляем стили для уведомлений
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .notification-icon {
        font-size: 20px;
        font-weight: bold;
    }
    
    .notification-message {
        font-size: 16px;
        font-weight: 500;
    }
`;
document.head.appendChild(notificationStyles);

