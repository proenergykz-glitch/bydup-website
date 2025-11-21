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

// Регистрация Service Worker для PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
                // Принудительное обновление
                registration.update();
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}

// Обработка формы
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.contact-form');
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Получаем данные формы
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
                await sendFormData(data, form);
            } else {
                showNotification('Пожалуйста, заполните все обязательные поля.', 'error');
            }
        });
    }
});

// Функция отправки данных
async function sendFormData(data, form) {
    const submitButton = form.querySelector('.submit-button');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Отправляем...';
    submitButton.disabled = true;

    try {
        await sendTelegramContact(data);
        showNotification('Заявка отправлена! Мы свяжемся с вами в течение 24 часов.', 'success');
        form.reset();
    } catch (error) {
        console.error('Ошибка отправки:', error);
        showNotification(error.message || 'Не удалось отправить заявку. Попробуйте позже.', 'error');
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// Telegram helpers настроены ниже
const botToken = '8220101886:AAGcC1Co91qLfVC-20rLmKLoQq44OFmsHzM';
let telegramChatIdCache = null;

async function getTelegramChatId() {
    if (telegramChatIdCache) {
        return telegramChatIdCache;
    }

    const stored = localStorage.getItem('telegramChatId');
    if (stored) {
        telegramChatIdCache = stored;
        return telegramChatIdCache;
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
        const data = await response.json();

        if (data.ok && data.result.length > 0) {
            const lastUpdate = data.result[data.result.length - 1];
            const chatId = lastUpdate.message?.chat?.id || lastUpdate.callback_query?.message?.chat?.id;

            if (chatId) {
                telegramChatIdCache = chatId;
                localStorage.setItem('telegramChatId', chatId);
                return chatId;
            }
        }
    } catch (error) {
        console.error('Не удалось получить chat_id Telegram:', error);
    }

    return null;
}

async function sendTelegram(chatId, text) {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML'
        })
    });

    if (!response.ok) {
        throw new Error('Ошибка отправки сообщения в Telegram');
    }
}

async function sendTelegramContact(data) {
    const chatId = await getTelegramChatId();

    if (!chatId) {
        throw new Error('Напишите любое сообщение вашему Telegram-боту, чтобы завершить настройку, и попробуйте снова.');
    }

    const message = `🆕 Новая заявка на сайте BYD UP\n\n👤 Имя: ${data.name}\n📧 Email: ${data.email}\n📱 Телефон: ${data.phone}\n🔧 Услуга: ${data.service}\n💬 Сообщение: ${data.message || 'Не указано'}\n\n⏰ Время: ${new Date().toLocaleString('ru-RU')}`;

    await sendTelegram(chatId, message);
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

// Функции для модального окна записи
function openBookingModal() {
    const modal = document.getElementById('bookingModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Устанавливаем минимальную дату на завтра
    const dateInput = document.querySelector('input[name="date"]');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
    
    // Отправляем событие в GA4
    if (typeof gtag !== 'undefined') {
        gtag('event', 'booking_modal_opened', {
            event_category: 'engagement',
            event_label: 'booking_form'
        });
    }
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Функции для модального окна отзывов
function openReviewModal() {
    const modal = document.getElementById('reviewModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Закрытие модальных окон по клику вне их
window.onclick = function(event) {
    const bookingModal = document.getElementById('bookingModal');
    const reviewModal = document.getElementById('reviewModal');
    if (event.target === bookingModal) {
        closeBookingModal();
    }
    if (event.target === reviewModal) {
        closeReviewModal();
    }
}

// Обработка формы записи
document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('bookingForm');
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(bookingForm);
            const data = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                model: formData.get('model'),
                service: formData.get('service'),
                date: formData.get('date'),
                time: formData.get('time'),
                message: formData.get('message')
            };
            
            // Валидация
            if (!data.name || !data.phone || !data.model || !data.service) {
                showNotification('Пожалуйста, заполните все обязательные поля', 'error');
                return;
            }
            
            // Отправляем заявку
            sendBookingRequest(data);
        });
    }
});

// Отправка заявки на запись
async function sendBookingRequest(data) {
    try {
        const submitButton = document.querySelector('.booking-submit');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Отправляем...';
        submitButton.disabled = true;
        
        // Отправляем в Telegram
        await sendTelegramBooking(data);
        
        showNotification('Заявка на запись отправлена! Мы свяжемся с вами для подтверждения времени.', 'success');
        document.getElementById('bookingForm').reset();
        closeBookingModal();
        
        // Отправляем событие в GA4
        if (typeof gtag !== 'undefined') {
            gtag('event', 'booking_submitted', {
                event_category: 'conversion',
                event_label: data.service,
                value: 1
            });
        }
        
    } catch (error) {
        console.error('Ошибка отправки заявки:', error);
        showNotification('Произошла ошибка при отправке заявки. Попробуйте позже.', 'error');
    } finally {
        const submitButton = document.querySelector('.booking-submit');
        submitButton.textContent = 'Отправить заявку';
        submitButton.disabled = false;
    }
}

// Отправка заявки на запись в Telegram
async function sendTelegramBooking(data) {
    const chatId = await getTelegramChatId();

    if (!chatId) {
        throw new Error('Напишите сообщение боту в Telegram и повторите попытку.');
    }

    const message = `🆕 Новая заявка на запись\n\n👤 Имя: ${data.name}\n📱 Телефон: ${data.phone}\n🚗 Модель: ${data.model}\n🔧 Услуга: ${data.service}\n📅 Дата: ${data.date || 'Не указана'}\n⏰ Время: ${data.time || 'Не указано'}\n💬 Сообщение: ${data.message || 'Не указано'}\n\n⏰ Время заявки: ${new Date().toLocaleString('ru-RU')}`;

    await sendTelegram(chatId, message);
}

async function sendTelegramOrder(data) {
    const chatId = await getTelegramChatId();

    if (!chatId) {
        throw new Error('Напишите сообщение боту в Telegram и повторите попытку.');
    }

    const photoStatus = data.photoFile ? `загружено (${data.photoFile.name})` : 'не приложено';
    const message = `🆕 Новая заявка через страницу заказа\n\n👤 Имя: ${data.name}\n📱 Телефон: ${data.phone}\n🚗 Модель: ${data.model}\n📦 Статус фото версии ПО: ${photoStatus}\n💬 Комментарий: ${data.comment || 'Не указан'}\n\n⏰ Время заявки: ${new Date().toLocaleString('ru-RU')}`;

    if (data.photoFile) {
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('caption', message);
        formData.append('document', data.photoFile, data.photoFile.name);

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Не удалось отправить фото в Telegram');
        }
    } else {
        await sendTelegram(chatId, message);
    }
}

// Функция для FAQ
function toggleFAQ(element) {
    const faqItem = element.closest('.faq-item');
    const isActive = faqItem.classList.contains('active');
    
    // Закрываем все открытые FAQ
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Открываем текущий, если он был закрыт
    if (!isActive) {
        faqItem.classList.add('active');
    }
}

// Отслеживание кликов по кнопкам услуг
document.addEventListener('DOMContentLoaded', function() {
    const serviceButtons = document.querySelectorAll('.service-button');
    
    serviceButtons.forEach(button => {
        button.addEventListener('click', function() {
            const serviceCard = this.closest('.service-card');
            const serviceName = serviceCard.querySelector('h3').textContent;
            
            // Отправляем событие в GA4
            if (typeof gtag !== 'undefined') {
                gtag('event', 'service_clicked', {
                    event_category: 'engagement',
                    event_label: serviceName
                });
            }
        });
    });
});

// Отслеживание кликов по липким кнопкам
document.addEventListener('DOMContentLoaded', function() {
    const stickyButton = document.querySelector('.sticky-button');
    
    if (stickyButton) {
        stickyButton.addEventListener('click', function() {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'sticky_booking_clicked', {
                    event_category: 'engagement',
                    event_label: 'sticky_button'
                });
            }
        });
    }
});

// Обработка формы отзыва
document.addEventListener('DOMContentLoaded', function() {
    const reviewForm = document.getElementById('reviewForm');
    
    if (reviewForm) {
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(reviewForm);
            const data = {
                name: formData.get('name'),
                model: formData.get('model'),
                review: formData.get('review'),
                rating: formData.get('rating')
            };
            
            // Валидация
            if (!data.name || !data.review) {
                showNotification('Пожалуйста, заполните все обязательные поля', 'error');
                return;
            }
            
            // Отправляем отзыв
            sendReviewRequest(data);
        });
    }
});

function createReviewCard(data) {
    const reviewCard = document.createElement('div');
    reviewCard.className = 'review-card';
    reviewCard.setAttribute('data-review-id', data.id);
    
    const firstLetter = data.name.charAt(0).toUpperCase();
    const stars = '⭐'.repeat(parseInt(data.rating) || 5);
    const reviewDate = data.date ? new Date(data.date).toLocaleDateString('ru-RU') : new Date().toLocaleDateString('ru-RU');
    
    reviewCard.innerHTML = `
        <div class="review-header">
            <div class="review-author">
                <div class="author-avatar">${firstLetter}</div>
                <div class="author-info">
                    <h4>${data.name}</h4>
                    <span>${data.model || 'BYD'}</span>
                </div>
            </div>
            <div class="review-rating">${stars}</div>
        </div>
        <p class="review-text">"${data.review}"</p>
        <div class="review-service">Отзыв добавлен: ${reviewDate}</div>
    `;
    
    return reviewCard;
}

function saveReviewToStorage(data) {
    const reviews = JSON.parse(localStorage.getItem('bydReviews') || '[]');
    const reviewData = {
        ...data,
        id: Date.now(),
        date: new Date().toISOString()
    };
    reviews.unshift(reviewData);
    localStorage.setItem('bydReviews', JSON.stringify(reviews));
    return reviewData;
}

function loadReviewsFromStorage() {
    const reviewsContainer = document.getElementById('reviewsContainer');
    if (!reviewsContainer) return;
    
    const reviews = JSON.parse(localStorage.getItem('bydReviews') || '[]');
    reviewsContainer.innerHTML = '';
    
    reviews.forEach(reviewData => {
        const reviewCard = createReviewCard(reviewData);
        reviewsContainer.appendChild(reviewCard);
    });
}

// Функция удаления отзыва доступна через консоль браузера
// Использование: deleteReview(1234567890) - где число это ID отзыва
// Чтобы узнать ID отзыва, откройте консоль и выполните:
// document.querySelectorAll('[data-review-id]').forEach(el => console.log(el.getAttribute('data-review-id')))

function deleteReview(reviewId) {
    if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) {
        return;
    }
    
    const reviews = JSON.parse(localStorage.getItem('bydReviews') || '[]');
    const filteredReviews = reviews.filter(review => review.id !== reviewId);
    localStorage.setItem('bydReviews', JSON.stringify(filteredReviews));
    
    const reviewCard = document.querySelector(`[data-review-id="${reviewId}"]`);
    if (reviewCard) {
        reviewCard.style.transition = 'opacity 0.3s, transform 0.3s';
        reviewCard.style.opacity = '0';
        reviewCard.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            reviewCard.remove();
        }, 300);
    }
    
    showNotification('Отзыв удалён', 'success');
}

async function sendReviewRequest(data) {
    try {
        const reviewData = saveReviewToStorage(data);
        const reviewCard = createReviewCard(reviewData);
        
        const reviewsContainer = document.getElementById('reviewsContainer');
        if (reviewsContainer) {
            reviewsContainer.insertBefore(reviewCard, reviewsContainer.firstChild);
        }
        
        showNotification('Спасибо за ваш отзыв! Он опубликован.', 'success');
        document.getElementById('reviewForm').reset();
        closeReviewModal();
    } catch (error) {
        console.error('Ошибка отправки отзыва:', error);
        showNotification('Произошла ошибка. Попробуйте позже.', 'error');
    }
}

// Загрузка отзывов при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadReviewsFromStorage();
    
    // Отслеживание просмотра отзывов
    const reviewCards = document.querySelectorAll('.review-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'reviews_viewed', {
                        event_category: 'engagement',
                        event_label: 'reviews_section'
                    });
                }
                observer.unobserve(entry.target);
            }
        });
    });
    
    reviewCards.forEach(card => {
        observer.observe(card);
    });
});

