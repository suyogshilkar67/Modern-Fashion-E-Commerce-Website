// Load products from HTML
const products = JSON.parse(document.getElementById('product-data').textContent);

let cart = [];
let productSlideIndices = {};

// Modal State
let currentModalProductId = null;
let currentModalImageIndex = 0;

// DOM Elements
const productGrid = document.getElementById('product-grid');
const imageModal = document.getElementById('image-modal');
const modalImg = document.getElementById('modal-img');
const modalDots = document.getElementById('modal-dots');
const cartBtn = document.getElementById('cart-btn');
const closeCartBtn = document.getElementById('close-cart');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartSubtotal = document.getElementById('cart-subtotal');
const emptyCartMsg = document.getElementById('empty-cart-msg');
const filterBtns = document.querySelectorAll('.filter-btn');
const toast = document.getElementById('toast');
const checkoutBtn = document.getElementById('checkout-btn');

// Initialization
function init() {
    // Load hero image
    const heroImg = document.getElementById('hero-main-img');
    const heroImgSrc = document.getElementById('hero-image').dataset.src;
    heroImg.src = heroImgSrc;

    products.forEach(p => productSlideIndices[p.id] = 0);
    renderProducts(products);
    setupEventListeners();
    animateIntro();
}

// Image Modal Logic
function openImageModal(productId, index) {
    currentModalProductId = productId;
    currentModalImageIndex = index;
    
    const product = products.find(p => p.id === productId);
    updateModalContent(product);

    imageModal.classList.remove('hidden');
    
    gsap.to(imageModal, {
        opacity: 1,
        duration: 0.4,
        ease: "power2.out"
    });
    
    gsap.fromTo(modalImg, 
        { scale: 0.9, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    );
    
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleModalKeys);
}

function updateModalContent(product) {
    modalImg.src = product.images[currentModalImageIndex];
    
    modalDots.innerHTML = product.images.map((_, idx) => `
        <div class="w-2 h-2 rounded-full transition-all duration-300 ${idx === currentModalImageIndex ? 'bg-white scale-125' : 'bg-gray-600 hover:bg-gray-400 cursor-pointer'}" 
             onclick="event.stopPropagation(); goToModalImage(${idx})"></div>
    `).join('');
}

function changeModalImage(direction) {
    const product = products.find(p => p.id === currentModalProductId);
    const maxIndex = product.images.length - 1;
    
    let newIndex = currentModalImageIndex + direction;
    if (newIndex < 0) newIndex = maxIndex;
    if (newIndex > maxIndex) newIndex = 0;
    
    goToModalImage(newIndex);
}

function goToModalImage(index) {
    if (index === currentModalImageIndex) return;

    const product = products.find(p => p.id === currentModalProductId);
    
    const tl = gsap.timeline();
    
    tl.to(modalImg, {
        opacity: 0,
        scale: 0.95,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
            currentModalImageIndex = index;
            modalImg.src = product.images[currentModalImageIndex];
            updateModalContent(product);
        }
    })
    .to(modalImg, {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
    });
}

function handleModalKeys(e) {
    if (e.key === 'ArrowLeft') changeModalImage(-1);
    if (e.key === 'ArrowRight') changeModalImage(1);
    if (e.key === 'Escape') closeImageModal();
}

function closeImageModal() {
    document.removeEventListener('keydown', handleModalKeys);

    gsap.to(modalImg, {
        scale: 0.95,
        opacity: 0,
        y: -20,
        duration: 0.3,
        ease: "power2.in"
    });

    gsap.to(imageModal, {
        opacity: 0,
        duration: 0.3,
        delay: 0.1,
        ease: "power2.in",
        onComplete: () => {
            imageModal.classList.add('hidden');
            modalImg.src = '';
        }
    });
    
    document.body.style.overflow = '';
}

// Render Products
function renderProducts(productsToRender) {
    productGrid.innerHTML = '';
    
    if (productsToRender.length === 0) {
        productGrid.innerHTML = '<div class="col-span-full py-12 text-center text-gray-400">No products found in this category.</div>';
        return;
    }

    productsToRender.forEach((product, index) => {
        const badgeHTML = product.badge ? `<span class="absolute top-0 left-0 bg-white text-black text-[10px] uppercase font-bold tracking-widest px-3 py-2 z-10">${product.badge}</span>` : '';
        
        const slidesHTML = product.images.map((img, idx) => `
            <div style="min-width: 100%; height: 100%; cursor: zoom-in;" onclick="openImageModal(${product.id}, ${idx})">
                <img src="${img}" alt="${product.name}" class="w-full h-full object-cover">
            </div>
        `).join('');

        const productEl = document.createElement('div');
        productEl.className = 'product-card group cursor-pointer opacity-0 translate-y-5';
        productEl.innerHTML = `
            <div class="relative overflow-hidden h-[450px] mb-5 bg-[#f0f0f0]">
                ${badgeHTML}
                
                <div id="slider-${product.id}" class="slider-wrapper flex h-full transition-transform duration-700 ease-out" style="width: 100%; transform: translateX(0%);">
                     ${slidesHTML}
                </div>
                
                <div class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"></div>

                <div class="absolute bottom-0 left-0 w-full translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                     <button onclick="addToCart(${product.id})" class="bg-black text-white w-full py-4 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                        <span>Add to Cart</span> <i class="fas fa-plus"></i>
                    </button>
                </div>

                <div class="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <button onclick="moveSlide(event, ${product.id}, -1)" class="pointer-events-auto w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white text-black rounded-full shadow-lg transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                        <i class="fas fa-chevron-left text-xs"></i>
                    </button>
                    <button onclick="moveSlide(event, ${product.id}, 1)" class="pointer-events-auto w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white text-black rounded-full shadow-lg transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                        <i class="fas fa-chevron-right text-xs"></i>
                    </button>
                </div>

                <button onclick="toggleLike(event, ${product.id})" class="like-btn like-btn-${product.id} absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full text-gray-900 hover:text-red-500 z-20 shadow-sm hover:scale-110 transition-all duration-300">
                    <i class="fas fa-heart text-sm ${product.liked ? 'fas text-red-500' : 'far'}"></i>
                </button>
            </div>

            <div class="flex flex-col gap-1">
                <div class="flex justify-between items-start">
                    <h3 class="font-bold text-sm uppercase tracking-wider text-gray-900 group-hover:text-gray-600 transition-colors">${product.name}</h3>
                    <span class="font-bold text-sm text-gray-900">$${product.price}</span>
                </div>
                <p class="text-[10px] text-gray-400 uppercase tracking-widest">${product.category}</p>
            </div>
        `;
        
        productGrid.appendChild(productEl);
        
        gsap.to(productEl, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay: index * 0.1,
            ease: "power2.out"
        });
    });
}

// Slider Logic
function moveSlide(event, productId, direction) {
    event.stopPropagation();
    const product = products.find(p => p.id === productId);
    const maxIndex = product.images.length - 1;
    let currentIndex = productSlideIndices[productId];

    currentIndex += direction;
    if (currentIndex < 0) currentIndex = maxIndex;
    if (currentIndex > maxIndex) currentIndex = 0;
    
    productSlideIndices[productId] = currentIndex;

    const slider = document.getElementById(`slider-${productId}`);
    if (slider) {
        slider.style.transform = `translateX(-${currentIndex * 100}%)`;
    }
}

// Like Logic
function toggleLike(event, productId) {
    event.stopPropagation();
    const product = products.find(p => p.id === productId);
    product.liked = !product.liked;
    
    const btn = document.querySelector(`.like-btn-${productId} i`);
    if (product.liked) {
        btn.classList.remove('far');
        btn.classList.add('fas', 'text-red-500');
        btn.parentElement.classList.add('text-red-500');
    } else {
        btn.classList.remove('fas', 'text-red-500');
        btn.classList.add('far');
        btn.parentElement.classList.remove('text-red-500');
    }
    
    gsap.fromTo(btn, 
        { scale: 0.8 },
        { scale: 1.2, duration: 0.2, yoyo: true, repeat: 1 }
    );
}

// Cart Logic
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const cartProduct = { ...product, image: product.images[0] };
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...cartProduct, quantity: 1 });
    }

    updateCartUI();
    showToast(product.name, product.images[0]);
    
    if (!cartSidebar.classList.contains('open')) {
        toggleCart();
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCartUI();
        }
    }
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    if (totalItems > 0) {
        cartCount.classList.remove('scale-0');
    } else {
        cartCount.classList.add('scale-0');
    }

    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        emptyCartMsg.style.display = 'flex';
        cartSubtotal.textContent = '$0.00';
    } else {
        emptyCartMsg.style.display = 'none';
        let total = 0;

        cart.forEach(item => {
            total += item.price * item.quantity;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'flex gap-6';
            cartItem.innerHTML = `
                <div class="h-24 w-20 flex-shrink-0 overflow-hidden bg-gray-100">
                    <img src="${item.image}" alt="${item.name}" class="h-full w-full object-cover">
                </div>
                <div class="flex flex-1 flex-col justify-between">
                    <div>
                        <div class="flex justify-between text-base font-medium text-gray-900">
                            <h3 class="serif-font text-lg"><a href="#">${item.name}</a></h3>
                            <p class="ml-4">$${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <p class="mt-1 text-xs text-gray-500 uppercase tracking-wide">${item.category}</p>
                    </div>
                    <div class="flex flex-1 items-end justify-between text-sm">
                        <div class="flex items-center border border-gray-200">
                            <button onclick="updateQuantity(${item.id}, -1)" class="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors">-</button>
                            <span class="px-2 font-medium text-gray-900 text-xs">${item.quantity}</span>
                            <button onclick="updateQuantity(${item.id}, 1)" class="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors">+</button>
                        </div>
                        <button onclick="removeFromCart(${item.id})" type="button" class="font-medium text-xs text-gray-400 hover:text-black border-b border-transparent hover:border-black transition-all">Remove</button>
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(cartItem);
        });

        cartSubtotal.textContent = '$' + total.toFixed(2);
    }
}

function toggleCart() {
    const isOpen = cartSidebar.classList.contains('open');
    if (isOpen) {
        cartSidebar.classList.remove('open');
        cartOverlay.classList.remove('opacity-100');
        setTimeout(() => {
            cartOverlay.classList.add('hidden');
        }, 300);
    } else {
        cartOverlay.classList.remove('hidden');
        void cartOverlay.offsetWidth;
        cartOverlay.classList.add('opacity-100');
        cartSidebar.classList.add('open');
    }
}

function showToast(productName, image) {
    const toastMsg = document.getElementById('toast-message');
    const toastImg = document.getElementById('toast-img');
    
    toastMsg.textContent = `${productName} has been added to your cart.`;
    toastImg.src = image;
    
    toast.classList.remove('translate-x-[120%]');
    
    setTimeout(() => {
        toast.classList.add('translate-x-[120%]');
    }, 3000);
}

function filterProducts(category, btn) {
    filterBtns.forEach(b => {
        b.classList.remove('bg-black', 'text-white', 'border-black');
        b.classList.add('text-gray-600', 'border-gray-200');
    });
    btn.classList.remove('text-gray-600', 'border-gray-200');
    btn.classList.add('bg-black', 'text-white', 'border-black');

    const filtered = category === 'all' 
        ? products 
        : products.filter(p => p.category === category);
    
    gsap.to('.product-card', {
        opacity: 0,
        y: 10,
        duration: 0.3,
        stagger: 0.05,
        onComplete: () => {
            renderProducts(filtered);
        }
    });
}

// Setup Event Listeners
function setupEventListeners() {
    cartBtn.addEventListener('click', toggleCart);
    closeCartBtn.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);
    
    document.getElementById('start-shopping').addEventListener('click', toggleCart);
    
    checkoutBtn.addEventListener('click', () => {
        if (cart.length > 0) {
            alert('Checkout functionality would be implemented here');
        } else {
            alert('Please add items to your cart first.');
        }
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterProducts(btn.dataset.filter, btn);
        });
    });
}

// Animations
function animateIntro() {
    const tl = gsap.timeline();
    
    tl.to('.loader h1 span', {
        y: 0,
        duration: 1,
        ease: "power4.out"
    })
    .to('.loader p', {
        opacity: 1,
        duration: 1
    }, "-=0.5")
    .to('.loader', {
        y: "-100%",
        duration: 1,
        ease: "power4.inOut",
        delay: 0.5
    });

    tl.to('.hero-content', {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out"
    }, "-=0.5")
    .to('.hero-image', {
        opacity: 1,
        scale: 1,
        duration: 1.2,
        ease: "power3.out"
    }, "-=0.8");

    gsap.to(".marquee-content", {
        xPercent: -50,
        repeat: -1,
        duration: 20,
        ease: "linear"
    });

    gsap.utils.toArray('.section-title').forEach(el => {
        gsap.to(el, {
            scrollTrigger: { trigger: el, start: "top 85%" },
            opacity: 1,
            y: 0,
            duration: 0.8
        });
    });
    
    gsap.to('.product-filters', {
        scrollTrigger: { trigger: '.product-filters', start: "top 85%" },
        opacity: 1,
        y: 0,
        duration: 0.8
    });
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', init);