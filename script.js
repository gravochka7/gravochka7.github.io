document.addEventListener('DOMContentLoaded', () => {
    // --- ОБЩИЕ ПЕРЕМЕННЫЕ ---
    const body = document.body;

    // --- Мобильное меню (ФИНАЛЬНАЯ ВЕРСИЯ) ---
    const menuToggle = document.getElementById('mobile-menu');
    const navMenu = document.getElementById('nav-menu');
    const overlay = document.querySelector('.overlay');

    const closeMenu = () => {
        navMenu.classList.remove('active');
        overlay.classList.remove('active');
        body.classList.remove('menu-open');
    };

    if (menuToggle && navMenu && overlay) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            overlay.classList.toggle('active');
            body.classList.toggle('menu-open');
        });
        overlay.addEventListener('click', closeMenu);
    }

    // --- Логика для таймера обратного отсчета ---
    let promotionEndDate;
    const startOrResetTimer = () => {
        const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
        promotionEndDate = new Date().getTime() + twoDaysInMs;
        localStorage.setItem('promotionEndDate', promotionEndDate);
    };
    const storedEndDate = localStorage.getItem('promotionEndDate');
    if (storedEndDate && new Date().getTime() < parseInt(storedEndDate)) {
        promotionEndDate = parseInt(storedEndDate);
    } else {
        startOrResetTimer();
    }
    const countdownFunction = setInterval(() => {
        const now = new Date().getTime();
        const distance = promotionEndDate - now;
        if (distance < 0) {
            startOrResetTimer();
        }
        const remainingDistance = Math.max(0, distance);
        const format = (num) => num < 10 ? '0' + num : num;
        const days = Math.floor(remainingDistance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remainingDistance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((remainingDistance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remainingDistance % (1000 * 60)) / 1000);
        
        const daysEl = document.getElementById("days");
        if (daysEl) daysEl.innerText = format(days);
        const hoursEl = document.getElementById("hours");
        if (hoursEl) hoursEl.innerText = format(hours);
        const minutesEl = document.getElementById("minutes");
        if (minutesEl) minutesEl.innerText = format(minutes);
        const secondsEl = document.getElementById("seconds");
        if (secondsEl) secondsEl.innerText = format(seconds);
    }, 1000);

    // --- Плавная прокрутка ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            const targetElement = document.querySelector(href);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ behavior: 'smooth' });
                if (navMenu && navMenu.classList.contains('active')) {
                    closeMenu();
                }
            }
        });
    });

    // --- Слайдеры в секции "Примеры работ" ---
    let sliderStates = [];
    const galleryContainers = document.querySelectorAll('.rectangular-gallery .gallery-container');
    galleryContainers.forEach((container, index) => {
        sliderStates.push({
            id: `slider${index + 1}`,
            currentSlide: 0,
            container: container,
            totalSlides: container.children.length,
            intervalId: null
        });
        const prevButton = document.getElementById(`prev${index + 1}`);
        const nextButton = document.getElementById(`next${index + 1}`);
        const startAutoPlay = () => {
            if (sliderStates[index] && sliderStates[index].intervalId) clearInterval(sliderStates[index].intervalId);
            sliderStates[index].intervalId = setInterval(() => moveGallery(index, 1), 10000);
        };
        const moveAndReset = (direction) => {
            moveGallery(index, direction);
            startAutoPlay();
        };
        if (prevButton) prevButton.onclick = () => moveAndReset(-1);
        if (nextButton) nextButton.onclick = () => moveAndReset(1);
        startAutoPlay();
    });

    function moveGallery(sliderIndex, direction) {
        let state = sliderStates[sliderIndex];
        if (!state || state.totalSlides === 0) return;
        state.currentSlide = (state.currentSlide + direction + state.totalSlides) % state.totalSlides;
        state.container.style.transform = `translateX(-${state.currentSlide * 100}%)`;
    }
    
    // --- КОД МОДАЛЬНОГО ОКНА ДЛЯ ИЗОБРАЖЕНИЙ (С АНИМИРОВАННОЙ ПОДСКАЗКОЙ) ---
    const imageModal = document.getElementById("imageModal");
    const modalImg = document.getElementById("expandedImg");
    const closeImageModalButton = document.getElementById("closeModalButton");
    const modalPrevBtn = document.getElementById("modalPrev");
    const modalNextBtn = document.getElementById("modalNext");
    const dotsContainer = document.getElementById('modalDotsContainer');
    const swipeHint = document.getElementById('swipe-hint');
    let currentModalImages = [];
    let currentImageIndex = 0;

    window.openImageModal = function(isGallery, imagesOrSrc, startIndex = 0) {
        if (!imageModal) return;
        body.classList.add('menu-open');
        imageModal.style.display = "block";
        currentModalImages = Array.isArray(imagesOrSrc) ? imagesOrSrc : [imagesOrSrc];
        currentImageIndex = startIndex;
        const hasMultipleImages = currentModalImages.length > 1;

        modalPrevBtn.classList.toggle('is-visible', hasMultipleImages);
        modalNextBtn.classList.toggle('is-visible', hasMultipleImages);
        dotsContainer.innerHTML = '';

        if (hasMultipleImages && swipeHint) {
            swipeHint.classList.remove('hidden');
            swipeHint.classList.add('visible');
            swipeHint.addEventListener('animationend', () => swipeHint.classList.add('hidden'), { once: true });
        } else if (swipeHint) {
            swipeHint.classList.add('hidden');
            swipeHint.classList.remove('visible');
        }

        if (hasMultipleImages) {
            currentModalImages.forEach((_, index) => {
                const dot = document.createElement('span');
                dot.classList.add('dot');
                dot.addEventListener('click', (e) => { 
                    e.stopPropagation(); 
                    showImage(index);
                });
                dotsContainer.appendChild(dot);
            });
            imageModal.addEventListener('touchstart', handleTouchStart, { passive: true });
            imageModal.addEventListener('touchmove', handleTouchMove, { passive: true });
            imageModal.addEventListener('touchend', handleTouchEnd);
        }
        showImage(currentImageIndex);
        document.addEventListener('keydown', handleKeyDown);
        history.pushState({ modal: 'image' }, "Image");
    }

    window.closeImageModalLogic = function() {
        if (imageModal && imageModal.style.display === "block") {
            body.classList.remove('menu-open');
            imageModal.style.display = "none";
            document.removeEventListener('keydown', handleKeyDown);
            imageModal.removeEventListener('touchstart', handleTouchStart);
            imageModal.removeEventListener('touchmove', handleTouchMove);
            imageModal.removeEventListener('touchend', handleTouchEnd);
            if (dotsContainer) dotsContainer.innerHTML = '';
            if (swipeHint) {
                swipeHint.classList.remove('visible');
                swipeHint.classList.add('hidden');
            }
        }
    }

    if (imageModal) {
        if (closeImageModalButton) closeImageModalButton.addEventListener('click', () => history.back());
        imageModal.addEventListener('click', (event) => {
            if (event.target === imageModal) history.back();
        });
        if (modalPrevBtn) modalPrevBtn.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            showImage(currentImageIndex - 1);
        });
        if (modalNextBtn) modalNextBtn.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            showImage(currentImageIndex + 1);
        });
    }

    function showImage(index) {
        if (!currentModalImages || currentModalImages.length === 0) return;
        currentImageIndex = (index + currentModalImages.length) % currentModalImages.length;
        modalImg.src = currentModalImages[currentImageIndex];
        const allDots = dotsContainer.querySelectorAll('.dot');
        if (allDots.length > 0) {
            allDots.forEach(dot => dot.classList.remove('active'));
            allDots[currentImageIndex].classList.add('active');
        }
    }

    document.querySelectorAll('.tile-gallery-item, .gallery-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const galleryContainer = item.closest('.gallery-container');
            if (galleryContainer) {
                const allItems = Array.from(galleryContainer.children);
                const images = allItems.map(galleryItem => galleryItem.dataset.src || galleryItem.querySelector('img').src);
                const startIndex = allItems.indexOf(item);
                openImageModal(true, images, startIndex);
            } else {
                const src = item.dataset.src || item.querySelector('img').src;
                openImageModal(false, src);
            }
        });
    });

    document.querySelectorAll('.product-card .product-image-wrapper').forEach(wrapper => {
        wrapper.addEventListener('click', (e) => {
            const card = e.currentTarget.closest('.product-card');
            const imagesAttr = card.dataset.images;
            if (!imagesAttr) return;
            const images = imagesAttr.split(',').map(s => s.trim());
            if (images.length > 0) openImageModal(true, images, 0);
        });
    });

    function handleKeyDown(e) {
        if (!imageModal || imageModal.style.display !== 'block') return;
        if (e.key === "Escape") history.back();
        if (currentModalImages.length <= 1) return;
        if (e.key === "ArrowLeft") showImage(currentImageIndex - 1);
        else if (e.key === "ArrowRight") showImage(currentImageIndex + 1);
    }

    let touchStartX = 0, touchEndX = 0;
    function handleTouchStart(e) { touchStartX = e.touches[0].clientX; }
    function handleTouchMove(e) { touchEndX = e.touches[0].clientX; }
    function handleTouchEnd() {
        if (currentModalImages.length <= 1) return;
        if (touchStartX - touchEndX > 50) showImage(currentImageIndex + 1);
        if (touchStartX - touchEndX < -50) showImage(currentImageIndex - 1);
    }

    // --- Логика для виджета быстрого заказа ---
    const quickOrderWidget = document.getElementById('quickOrderWidget');
    if (quickOrderWidget) {
        const orderTrigger = document.getElementById('orderTrigger');
        const closePopup = document.getElementById('closePopup');
        const quickOrderForm = document.getElementById('quickOrderForm');
        const showQuickOrderBtn = document.getElementById('showQuickOrderFormBtn');

        window.closeQuickOrderPopup = () => {
            if (quickOrderWidget.classList.contains('active')) {
                quickOrderWidget.classList.remove('active');
            }
        };

        const openPopup = () => {
            if (!quickOrderWidget.classList.contains('active')) {
                quickOrderWidget.classList.add('active');
                history.pushState({ modal: 'quick-order' }, 'Швидке замовлення');
            }
        };

        if (orderTrigger) orderTrigger.addEventListener('click', (e) => { e.stopPropagation(); openPopup(); });
        if (showQuickOrderBtn) showQuickOrderBtn.addEventListener('click', openPopup);

        if (closePopup) closePopup.addEventListener('click', () => history.back());
        document.addEventListener('click', (e) => {
            if (quickOrderWidget.classList.contains('active') && !quickOrderWidget.contains(e.target) && e.target !== showQuickOrderBtn) {
                history.back();
            }
        });

        if (quickOrderForm) {
            quickOrderForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const phoneInput = document.getElementById('clientPhone');
                fetch('https://telegram-sender.brelok2023.workers.dev/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: phoneInput.value })
                }).then(response => response.json())
                .then(data => {
                    if (data.ok) {
                        showCustomAlert('Дякуємо! Ми скоро з вами зв\'яжемось.');
                        phoneInput.value = '';
                        if (quickOrderWidget.classList.contains('active')) {
                            history.back();
                        }
                    } else { throw new Error(data.description || 'Неизвестная ошибка'); }
                }).catch(error => {
                    console.error('Ошибка отправки через Worker:', error);
                    showCustomAlert('Виникла помилка. Спробуйте ще раз.');
                });
            });
        }
    }
    
    // --- Система уведомлений (CUSTOM ALERT) ---
    const customAlertModal = document.getElementById('customAlertModal');
    if (customAlertModal) {
        const customAlertMessage = customAlertModal.querySelector('.custom-alert-message');
        const customAlertCloseBtn = customAlertModal.querySelector('.custom-alert-close-btn');
        const customAlertOkBtn = customAlertModal.querySelector('.custom-alert-ok-btn');
        window.showCustomAlert = function(message) {
            if (customAlertMessage) {
                customAlertMessage.textContent = message;
                customAlertModal.style.display = 'block';
            }
        }
        const closeCustomAlert = () => { customAlertModal.style.display = "none"; }
        if(customAlertCloseBtn) customAlertCloseBtn.onclick = closeCustomAlert;
        if(customAlertOkBtn) customAlertOkBtn.onclick = closeCustomAlert;
        window.addEventListener('click', (event) => { if (event.target == customAlertModal) closeCustomAlert(); });
    } else {
        window.showCustomAlert = (message) => alert(message);
    }

    // --- Логика для модального окна "Условия акции" ---
// --- Логіка для модального вікна "Умови акції" (адаптована версія) ---
const promoTermsModal = document.getElementById('promoTermsModal');
const openPromoTermsLink = document.getElementById('open-promo-terms-link');
const closePromoTermsBtn = document.getElementById('closePromoTermsBtn');
const promoModalOkBtn = document.getElementById('promoModalOkBtn');

if (promoTermsModal && openPromoTermsLink && closePromoTermsBtn && promoModalOkBtn) {

    // Функция открытия теперь добавляет запись в историю
    const openModal = (e) => {
        e.preventDefault();
        promoTermsModal.style.display = 'block';
        // Добавляем состояние в историю, чтобы кнопка "назад" его перехватила
        history.pushState({ modal: 'promo-terms' }, 'Умови акції');
    };

    // Создаем глобальную функцию закрытия, чтобы ее мог вызвать popstate
    window.closePromoTermsModal = () => {
        if (promoTermsModal.style.display === 'block') {
            promoTermsModal.style.display = 'none';
        }
    };

    openPromoTermsLink.addEventListener('click', openModal);

    // Все кнопки закрытия теперь просто вызывают history.back()
    closePromoTermsBtn.addEventListener('click', () => history.back());
    promoModalOkBtn.addEventListener('click', () => history.back());

    promoTermsModal.addEventListener('click', (event) => {
        if (event.target === promoTermsModal) {
            history.back();
        }
    });
    
    // Этот обработчик остается на случай закрытия через ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape" && promoTermsModal.style.display === 'block') {
            history.back();
        }
    });
}

    // =======================================================
    // --- ЛОГИКА КОРЗИНЫ ---
    // =======================================================
    const cartIcon = document.getElementById('cart-icon');
    const cartModal = document.getElementById('cartModal');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartCountEl = document.getElementById('cart-count');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartSummaryEl = document.getElementById('cartSummary');
    const orderForm = document.getElementById('orderForm');
    const successModal = document.getElementById('successModal');
    const cartModalContent = cartModal ? cartModal.querySelector('.cart-modal-content') : null;
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];

    window.openCartModal = () => {
        if (!cartModal || cartModal.style.display === 'block') return;
        cartModal.style.display = 'block';
        body.classList.add('menu-open');
        showCartView();
        updateCart();
        if (window.location.hash !== '#cart') {
            history.pushState({ modal: 'cart' }, 'Корзина', '#cart');
        }
    };

    window.closeCartModal = () => {
        if (!cartModal || cartModal.style.display !== 'block') return;
        cartModal.style.display = 'none';
        body.classList.remove('menu-open');
    };
    
    function showCartView() { if (cartModalContent) cartModalContent.classList.remove('checkout-view'); }
    function showCheckoutView() { if (cartModalContent) cartModalContent.classList.add('checkout-view'); }

    if (cartIcon && cartModal && closeCartBtn) {
    cartIcon.addEventListener('click', openCartModal);
    closeCartBtn.addEventListener('click', () => history.back());
    cartModal.addEventListener('click', (event) => {
        if (event.target.id === 'chooseExtrasBtn') {
            history.back();
            setTimeout(() => {
                const extrasSection = document.getElementById('extras');
                if (extrasSection) {
                    extrasSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        } else if (event.target.id === 'checkoutBtn') {
            showCheckoutView();
        } else if (event.target.id === 'backToCartBtn') {
            event.preventDefault();
            showCartView();
        } else if (event.target === cartModal) {
            // --- ВІДНОВЛЕНА ЛОГІКА З "МЕРТВОЮ ЗОНОЮ" ---
            const content = cartModal.querySelector('.cart-modal-content');
            if (!content) {
                history.back();
                return;
            }

            const rect = content.getBoundingClientRect();
            const safeMargin = 350; // "Мертва зона" у 20px

            // Перевіряємо, чи був клік всередині "мертвої зони"
            const isClickInSafeArea = (
                event.clientX >= rect.left - safeMargin &&
                event.clientX <= rect.right + safeMargin &&
                event.clientY >= rect.top - safeMargin &&
                // Мертва зона не поширюється нижче кошика
                event.clientY <= rect.bottom 
            );

            // Якщо клік був на фоні, АЛЕ НЕ в мертвій зоні - закриваємо вікно
            if (!isClickInSafeArea) {
                history.back();
            }
        }
    });
}
    
    if (window.location.hash === '#cart') {
        openCartModal();
    }
    
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            addToCart({
                id: card.dataset.id, name: card.dataset.name,
                price: parseFloat(card.dataset.price), image: card.dataset.image, quantity: 1
            }, button);
        });
    });

    function flyToCart(startElement) {
        const cartIconEl = document.getElementById('cart-icon');
        if (!startElement || !cartIconEl) return;
        const flyer = document.createElement('div');
        flyer.classList.add('fly-to-cart-animation');
        flyer.style.backgroundColor = '#04c414ff';
        const startRect = startElement.getBoundingClientRect();
        const endRect = cartIconEl.getBoundingClientRect();
        flyer.style.width = `${startRect.width}px`;
        flyer.style.height = `${startRect.height}px`;
        flyer.style.top = `${startRect.top}px`;
        flyer.style.left = `${startRect.left}px`;
        document.body.appendChild(flyer);
        requestAnimationFrame(() => {
            flyer.style.top = `${endRect.top + endRect.height / 4}px`;
            flyer.style.left = `${endRect.left + endRect.width / 2}px`;
            flyer.style.width = '0px';
            flyer.style.height = '0px';
            flyer.style.opacity = '0';
        });
        flyer.addEventListener('transitionend', () => {
            flyer.remove();
        });
    }

    document.querySelectorAll('.add-extra-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.extra-item');
            flyToCart(e.target);
            if (card.dataset.id === 'extra1') {
                const selectedOption = card.querySelector('input[name="option-type-extra1"]:checked');
                const productName = selectedOption.dataset.name;
                const productImage = (productName === 'Кулон') ? card.dataset.imageKulon : card.dataset.imageBrelok;
                cart = cart.filter(item => item.id !== 'extra1-Брелок' && item.id !== 'extra1-Кулон');
                cart.push({
                    id: 'extra1-' + productName, name: productName, price: parseFloat(card.dataset.price),
                    image: productImage, quantity: 1
                });
                updateCart();
                animateButton(button);
            } else {
                addToCart({
                    id: card.dataset.id, name: card.dataset.name, price: parseFloat(card.dataset.price),
                    image: card.dataset.imageBrelok || card.querySelector('img').src, quantity: 1
                }, button);
            }
        });
    });

    function animateButton(button) {
        if (!button) return;
        button.classList.add('added');
        button.disabled = true;
        if (button.classList.contains('add-extra-to-cart')) {
            button.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                button.innerHTML = '+';
                button.classList.remove('added');
                button.disabled = false;
            }, 2000);
        } else {
            button.innerHTML = '<i class="fas fa-check"></i> Додано!';
            setTimeout(() => {
                button.innerHTML = '<i class="fas fa-cart-plus"></i>Замовити';
                button.classList.remove('added');
                button.disabled = false;
            }, 2000);
        }
    }
    
    function addToCart(product, button) {
        const existingProductIndex = cart.findIndex(item => item.id === product.id);
        if (existingProductIndex > -1) cart[existingProductIndex].quantity += 1;
        else cart.push(product);
        animateButton(button);
        updateCart();
        if (button && button.classList.contains('add-to-cart-btn')) openCartModal();
    }

    function updateCart() {
        if (cartItemsContainer) renderCartItems();
        if (cartSummaryEl) renderCartSummary();
        if (cartCountEl) updateCartIcon();
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
    }

 function renderCartItems() {
    if (!cartItemsContainer) return;
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="cart-empty-message">Ваша корзина порожня</p>';
        if(cartSummaryEl) cartSummaryEl.innerHTML = '';
        return;
    }
    cartItemsContainer.innerHTML = '';
    cart.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.classList.add('cart-item');

        const isPromoDuplicate = item.id === 'promo-duplicate-1uah';
        
        // Створюємо HTML для примітки, тільки якщо це акційний товар
        const promoNoteHTML = isPromoDuplicate 
            ? `<p class="promo-note">(При замовленні будь-якого брелоку або жетону,ви отримуєте його дублікат-брелок)</p>` 
            : '';

        itemEl.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                ${promoNoteHTML} 
                <p class="price">${item.price} грн</p>
            </div>
            <div class="cart-item-controls">
                <button class="quantity-btn" onclick="changeQuantity('${item.id}', -1)">-</button>
                <span class="item-quantity">${item.quantity}</span>
                <button class="quantity-btn" onclick="changeQuantity('${item.id}', 1)" ${isPromoDuplicate ? 'disabled' : ''}>+</button>
                <button class="remove-item-btn" onclick="removeItemFromCart('${item.id}')"><i class="fas fa-trash-alt"></i></button>
            </div>`;
        cartItemsContainer.appendChild(itemEl);
    });
}
    
    function renderCartSummary() {
        if (!cartSummaryEl) return;
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (cart.length > 0) {
            cartSummaryEl.innerHTML = `
                <h3>Загальна сума: ${totalPrice.toFixed(2)} грн</h3>
                <button id="chooseExtrasBtn" class="cta-button secondary-btn">Обрати додаткові товари</button>
                <button id="checkoutBtn" class="cta-button">Оформити замовлення</button>`;
        } else {
            cartSummaryEl.innerHTML = '';
        }
    }
    
    function updateCartIcon() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartCountEl) {
            cartCountEl.textContent = totalItems;
            cartCountEl.classList.toggle('visible', totalItems > 0);
        }
    }
    
    window.changeQuantity = (productId, amount) => {
    // --- ОСНОВНЕ ВИПРАВЛЕННЯ ---
    // Якщо намагаються збільшити кількість акційного дубліката, нічого не робимо
    if (productId === 'promo-duplicate-1uah' && amount > 0) {
        return;
    }

    const productIndex = cart.findIndex(item => item.id === productId);
    if (productIndex > -1) {
        if (cart[productIndex].id.startsWith('extra1-') && amount < 0) {
            cart.splice(productIndex, 1);
        } else {
            cart[productIndex].quantity += amount;
            if (cart[productIndex].quantity <= 0) cart.splice(productIndex, 1);
        }
        updateCart();
    }
};

    window.removeItemFromCart = (productId) => {
        cart = cart.filter(item => item.id !== productId);
        showCartView();
        updateCart();
    };

    // Оновлений обробник форми замовлення

// Оновлений обробник форми замовлення
// --- НОВЫЙ, УЛУЧШЕННЫЙ ОБРАБОТЧИК ФОРМЫ ЗАКАЗА ---
if (orderForm) {
    orderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = orderForm.querySelector('.place-order-btn');
        submitButton.disabled = true;
        submitButton.textContent = 'Відправка...';

        // Проверки (остаются без изменений)
        const hasSpecialItem = cart.some(item => item.id.startsWith('extra1-') || item.id === 'promo-duplicate-1uah');
        const hasMainProduct = cart.some(item => item.id.startsWith('product'));

        if (hasSpecialItem && !hasMainProduct) {
            showCustomAlert('Вибачте, акційні товари можна замовити тільки разом з основним жетоном або брелоком.');
            cart = cart.filter(item => !item.id.startsWith('extra1-') && item.id !== 'promo-duplicate-1uah');
            showCartView();
            updateCart();
            submitButton.disabled = false;
            submitButton.textContent = 'Замовити';
            return;
        }
        if (cart.length === 0) {
            showCustomAlert('Ваша корзина порожня!');
            submitButton.disabled = false;
            submitButton.textContent = 'Замовити';
            return;
        }

        const payload = {
            clientName: document.getElementById('clientName').value,
            clientPhone: document.getElementById('clientPhoneCart').value,
            viberTelegram: document.getElementById('clientViberTelegram').value,
            deliveryAddress: document.getElementById('deliveryAddress').value,
            cartItems: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price }))
        };

        // ---- ОСНОВНЫЕ ИЗМЕНЕНИЯ ТУТ ----
        fetch('https://telegram-sender.brelok2023.workers.dev/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            if (data.ok && data.orderId) {
                // УСПЕХ!
                
                // 1. ГОТОВИМ ДАННЫЕ ДЛЯ FACEBOOK PIXEL
                const purchaseData = {
                    transaction_id: data.orderId, // Используем ID заказа от сервера
                    value: cart.reduce((total, item) => total + item.price * item.quantity, 0),
                    currency: 'UAH',
                    items: cart.map(item => ({
                        item_id: item.id,
                        item_name: item.name,
                        price: item.price.toFixed(2),
                        quantity: item.quantity
                    }))
                };

                // 2. СОХРАНЯЕМ ДАННЫЕ В localStorage ДЛЯ СЛЕДУЮЩЕЙ СТРАНИЦЫ
                localStorage.setItem('lastPurchaseData', JSON.stringify(purchaseData));

                
                // Очищаем корзину (ваш старый код)
                cart = [];
                updateCart(); 
                
                // 3. ПЕРЕНАПРАВЛЯЕМ НА СТРАНИЦУ "СПАСИБО"
                window.location.href = `thank-you.html?order_id=${data.orderId}`;
                
            } else {
                // Если Worker вернул ошибку
                throw new Error(data.error || 'Неизвестная ошибка от сервера');
            }
        })
        .catch(error => {
            console.error('Ошибка отправки заказа:', error);
            showCustomAlert('Возникла ошибка при оформлении заказа.');
            submitButton.disabled = false;
            submitButton.textContent = 'Замовити';
        });
    });
}
    updateCart();

    // --- Анімація похитування для блоку "Додатково" ---
    const extrasBlock = document.getElementById('extras');
    if (extrasBlock) {
        const extrasGrid = extrasBlock.querySelector('.extras-grid');
        let swayIntervalId = null;
        const triggerSwayAnimation = () => {
            if (extrasGrid && !extrasGrid.classList.contains('sway-animation')) {
                extrasGrid.classList.add('sway-animation');
                extrasGrid.addEventListener('animationend', () => {
                    extrasGrid.classList.remove('sway-animation');
                }, { once: true });
            }
        };
        const stopSwayingPermanently = () => {
            clearInterval(swayIntervalId);
            if(extrasGrid) extrasGrid.removeEventListener('scroll', stopSwayingPermanently);
        };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (!swayIntervalId) {
                        swayIntervalId = setInterval(triggerSwayAnimation, 3000);
                        if(extrasGrid) extrasGrid.addEventListener('scroll', stopSwayingPermanently, { once: true });
                    }
                } else {
                    clearInterval(swayIntervalId);
                    swayIntervalId = null;
                }
            });
        }, { threshold: 0.5 });
        observer.observe(extrasBlock);
    }
    
    // --- Анимация переключателя "Брелок/Кулон" ---
    const switcherCard = document.getElementById('extra-item-switcher');
    if (switcherCard) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const inactiveLabel = switcherCard.querySelector('input:not(:checked) + label');
                if (!inactiveLabel) return;
                if (entry.isIntersecting) {
                    inactiveLabel.classList.add('start-jiggling');
                } else {
                    inactiveLabel.classList.remove('start-jiggling');
                }
            });
        }, { threshold: 0.5 });
        observer.observe(switcherCard);
    }

   // --- ОБРОБНИК ДЛЯ АКЦІЙНОЇ КНОПКИ "КУПИТИ ДУБЛІКАТ" (З ПОЛЬОТОМ ІКОНКИ) ---

// Нова функція спеціально для анімації польоту картинки
function flyImageToCart(button) {
    const cartIconEl = document.getElementById('cart-icon');
    const imageUrl = button.dataset.flyImage; // Беремо шлях до картинки з атрибута
    if (!imageUrl || !cartIconEl) return;

    // Створюємо "клона" картинки
    const flyer = document.createElement('img');
    flyer.src = imageUrl;
    flyer.classList.add('fly-to-cart-animation'); // Використовуємо існуючий стиль

    // Отримуємо координати
    const startRect = button.getBoundingClientRect();
    const endRect = cartIconEl.getBoundingClientRect();

    // Встановлюємо початкові позицію та розмір
    flyer.style.width = '50px'; // Початковий розмір іконки
    flyer.style.height = '50px';
    flyer.style.top = `${startRect.top + startRect.height / 2 - 25}px`;
    flyer.style.left = `${startRect.left + startRect.width / 2 - 25}px`;

    document.body.appendChild(flyer);

    // Запускаємо анімацію
    requestAnimationFrame(() => {
        flyer.style.top = `${endRect.top + endRect.height / 4}px`;
        flyer.style.left = `${endRect.left + endRect.width / 2}px`;
        flyer.style.width = '0px';
        flyer.style.height = '0px';
        flyer.style.opacity = '0';
    });

    // Видаляємо "клона" після завершення анімації
    flyer.addEventListener('transitionend', () => {
        flyer.remove();
    });
}

// Оновлений обробник для акційної кнопки
const promoBtn = document.getElementById('add-promo-item-btn');
if (promoBtn) {
    promoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        const button = e.currentTarget;
        const originalText = "Купити Дублікат за 1грн";

        // 1. Створюємо товар
        const product = {
            id: button.dataset.id,
            name: button.dataset.name,
            price: parseFloat(button.dataset.price),
            image: button.dataset.image,
            quantity: 1
        };

        // 2. Додаємо товар в кошик (тільки якщо його там ще немає)
        const isAlreadyInCart = cart.some(item => item.id === product.id);
        if (!isAlreadyInCart) {
            cart.push(product);
        }

        // 3. Оновлюємо дані кошика (localStorage, іконка)
        updateCart();

        // 4. Запускаємо нову анімацію польоту картинки
        flyImageToCart(button);

        // 5. Анімація самої кнопки
        button.classList.add('added');
        button.style.pointerEvents = 'none';
        button.textContent = 'Додано!';

        setTimeout(() => {
            button.classList.remove('added');
            button.style.pointerEvents = 'auto';
            button.textContent = originalText;
        }, 2000);

        // 6. Рядок openCartModal(); видалено, кошик не відкривається
    });
}

}); // <-- ЗДЕСЬ ЗАКРЫВАЕТСЯ ГЛАВНЫЙ DOMCONTENTLOADED

// =======================================================
// КОД НИЖЕ НАХОДИТСЯ СНАРУЖИ ДЛЯ ПРАВИЛЬНОЙ РАБОТЫ
// =======================================================

// --- ЛОГИКА ВИДЕОПЛЕЕРА ---
const playerWrapper = document.querySelector('.player-wrapper');
if (playerWrapper) {
    const video = playerWrapper.querySelector('.player');
    const playButton = playerWrapper.querySelector('.toggle-play');
    const volumeSlider = playerWrapper.querySelector('input[name="volume"]');
    const fullscreenButton = playerWrapper.querySelector('.fullscreen');
    const progressBar = playerWrapper.querySelector('.progress');
    const progressFilled = playerWrapper.querySelector('.progress-filled');

    function togglePlay() {
        if (video.paused) video.play();
        else video.pause();
    }
    function updateButton() {
        const icon = video.paused ? '►' : '❚❚';
        if (playButton) playButton.textContent = icon;
    }
    function handleVolumeUpdate() { if(video) video.volume = this.value; }
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            if(playerWrapper) playerWrapper.requestFullscreen().catch(err => {
                if(window.showCustomAlert) showCustomAlert(`Помилка: ${err.message}`);
            });
        } else {
            if(document.exitFullscreen) document.exitFullscreen();
        }
    }
    function handleProgress() {
        const percent = (video.currentTime / video.duration) * 100;
        if (progressFilled) progressFilled.style.flexBasis = `${percent}%`;
    }
    function scrub(e) {
        const scrubTime = (e.offsetX / progressBar.offsetWidth) * video.duration;
        video.currentTime = scrubTime;
    }

    if (video) {
        video.addEventListener('click', togglePlay);
        video.addEventListener('play', updateButton);
        video.addEventListener('pause', updateButton);
        video.addEventListener('timeupdate', handleProgress);
    }
    if (playButton) playButton.addEventListener('click', togglePlay);
    if (volumeSlider) volumeSlider.addEventListener('input', handleVolumeUpdate);
    if (fullscreenButton) fullscreenButton.addEventListener('click', toggleFullscreen);

    let mousedown = false;
    if (progressBar) {
        progressBar.addEventListener('click', scrub);
        progressBar.addEventListener('mousemove', (e) => mousedown && scrub(e));
        progressBar.addEventListener('mousedown', () => mousedown = true);
        progressBar.addEventListener('mouseup', () => mousedown = false);
    }
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault(); 
            togglePlay();
        }
    });
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting && video && !video.paused) video.pause();
        });
    }, { threshold: 0 });
    observer.observe(playerWrapper);
}

// --- ЕДИНЫЙ ОБРАБОТЧИК ДЛЯ КНОПКИ "НАЗАД" ---
window.addEventListener('popstate', () => {
    if (typeof window.closeImageModalLogic === 'function') {
        window.closeImageModalLogic();
    }
    if (typeof window.closeCartModal === 'function') {
        window.closeCartModal();
    }
    if (typeof window.closeQuickOrderPopup === 'function') {
        window.closeQuickOrderPopup();
    }
    // 👇 ВОТ ИЗМЕНЕНИЕ 👇
    if (typeof window.closePromoTermsModal === 'function') {
        window.closePromoTermsModal();
    }
    

});


