// Global state
let currentUser = null;
let authToken = null;
let products = [];
let categories = [];
let cart = { items: [], total: 0 };

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Check for stored auth token
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedToken && storedUser) {
        authToken = storedToken;
        currentUser = JSON.parse(storedUser);
        updateAuthUI();
        loadCart();
    }
    
    loadProducts();
    loadCategories();
});

// Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Load section-specific data
    if (sectionId === 'cart' && currentUser) {
        loadCart();
    } else if (sectionId === 'orders' && currentUser) {
        loadOrders();
    }
}

// Authentication
async function register(event) {
    event.preventDefault();
    
    const formData = {
        username: document.getElementById('regUsername').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        full_name: document.getElementById('regFullName').value,
        address: document.getElementById('regAddress').value,
        phone: document.getElementById('regPhone').value
    };
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateAuthUI();
            showToast('Account created successfully!', 'success');
            showSection('home');
            document.getElementById('registerForm').reset();
        } else {
            showToast(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    }
}

async function login(event) {
    event.preventDefault();
    
    const formData = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateAuthUI();
            showToast('Login successful!', 'success');
            showSection('home');
            document.getElementById('loginForm').reset();
            loadCart();
        } else {
            showToast(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    cart = { items: [], total: 0 };
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    updateAuthUI();
    showToast('Logged out successfully', 'success');
    showSection('home');
}

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    
    if (currentUser) {
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';
        userName.textContent = currentUser.full_name || currentUser.username;
    } else {
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
    }
}

// Products
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        products = await response.json();
        displayProducts(products);
        displayFeaturedProducts(products.slice(0, 4));
    } catch (error) {
        showToast('Failed to load products', 'error');
    }
}

async function loadCategories() {
    try {
        const response = await fetch('/api/products/categories');
        categories = await response.json();
        populateCategoryFilter();
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

function populateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });
}

function displayProducts(productsToShow) {
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = '';
    
    if (productsToShow.length === 0) {
        productsGrid.innerHTML = '<p class="empty-cart">No products found.</p>';
        return;
    }
    
    productsToShow.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

function displayFeaturedProducts(featuredProducts) {
    const featuredGrid = document.getElementById('featuredProducts');
    featuredGrid.innerHTML = '';
    
    featuredProducts.forEach(product => {
        const productCard = createProductCard(product);
        featuredGrid.appendChild(productCard);
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.onclick = () => showProductDetail(product);
    
    // Create image element with proper handling
    const imageHtml = product.image_url ? 
        `<img src="${product.image_url}" alt="${product.name}" class="product-image-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
         <div class="product-image-placeholder" style="display:none"><i class="fas fa-image"></i></div>` :
        `<div class="product-image-placeholder"><i class="fas fa-image"></i></div>`;
    
    card.innerHTML = `
        <div class="product-image">
            ${imageHtml}
        </div>
        <div class="product-info">
            <div class="product-name">${product.name}</div>
            <div class="product-description">${product.description || ''}</div>
            <div class="product-price">$${product.price}</div>
            <div class="product-actions">
                <button class="btn btn-primary" onclick="event.stopPropagation(); addToCart(${product.id})">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
            </div>
        </div>
    `;
    
    return card;
}

function showProductDetail(product) {
    const modal = document.getElementById('productModal');
    const productDetail = document.getElementById('productDetail');
    
    // Create image element for modal with proper handling
    const imageHtml = product.image_url ? 
        `<img src="${product.image_url}" alt="${product.name}" class="product-detail-image-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
         <div class="product-detail-image-placeholder" style="display:none"><i class="fas fa-image"></i></div>` :
        `<div class="product-detail-image-placeholder"><i class="fas fa-image"></i></div>`;
    
    productDetail.innerHTML = `
        <div class="product-detail">
            <div class="product-detail-image">
                ${imageHtml}
            </div>
            <div class="product-detail-info">
                <h3>${product.name}</h3>
                <div class="product-detail-price">$${product.price}</div>
                <div class="product-detail-description">
                    ${product.description || 'No description available.'}
                </div>
                <div class="product-detail-category">
                    <strong>Category:</strong> ${product.category_name || 'Uncategorized'}
                </div>
                <div class="product-detail-stock">
                    <strong>In Stock:</strong> ${product.stock_quantity} units
                </div>
                <button class="btn btn-primary btn-large" onclick="addToCart(${product.id}); closeModal();">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('productModal').style.display = 'none';
}

function filterProducts() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    let filteredProducts = products;
    
    if (categoryFilter) {
        filteredProducts = products.filter(product => product.category_name === categoryFilter);
    }
    
    displayProducts(filteredProducts);
}

function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    let filteredProducts = products;
    
    if (searchTerm) {
        filteredProducts = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm))
        );
    }
    
    displayProducts(filteredProducts);
}

// Cart
async function addToCart(productId) {
    if (!currentUser) {
        showToast('Please login to add items to cart', 'error');
        showSection('login');
        return;
    }
    
    try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ product_id: productId, quantity: 1 })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Item added to cart!', 'success');
            loadCart();
        } else {
            showToast(data.error || 'Failed to add item to cart', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    }
}

async function loadCart() {
    if (!currentUser) return;
    
    try {
        const response = await fetch('/api/cart', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        cart = data;
        updateCartUI();
        updateCartCount();
    } catch (error) {
        console.error('Failed to load cart:', error);
    }
}

function updateCartUI() {
    const cartItems = document.getElementById('cartItems');
    const cartSummary = document.getElementById('cartSummary');
    
    if (!cart.items || cart.items.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        cartSummary.innerHTML = '';
        return;
    }
    
    cartItems.innerHTML = '';
    cart.items.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-image">
                <i class="fas fa-image"></i>
            </div>
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${item.price} each</div>
            </div>
            <div class="cart-item-controls">
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateCartQuantity(${item.product_id}, ${item.quantity - 1})">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1" 
                           onchange="updateCartQuantity(${item.product_id}, this.value)">
                    <button class="quantity-btn" onclick="updateCartQuantity(${item.product_id}, ${item.quantity + 1})">+</button>
                </div>
                <div class="cart-item-subtotal">$${item.subtotal}</div>
                <button class="btn btn-outline" onclick="removeFromCart(${item.product_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });
    
    cartSummary.innerHTML = `
        <div class="cart-total">Total: $${cart.total}</div>
        <button class="btn btn-primary btn-full" onclick="showCheckout()">
            <i class="fas fa-credit-card"></i> Checkout
        </button>
    `;
}

function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    const totalItems = cart.items ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
    cartCount.textContent = totalItems;
}

async function updateCartQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    try {
        const response = await fetch(`/api/cart/update/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ quantity: parseInt(newQuantity) })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            loadCart();
        } else {
            showToast(data.error || 'Failed to update cart', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    }
}

async function removeFromCart(productId) {
    try {
        const response = await fetch(`/api/cart/remove/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Item removed from cart', 'success');
            loadCart();
        } else {
            showToast(data.error || 'Failed to remove item', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    }
}

// Checkout
function showCheckout() {
    if (!cart.items || cart.items.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }
    
    const modal = document.getElementById('checkoutModal');
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    checkoutItems.innerHTML = '';
    cart.items.forEach(item => {
        const checkoutItem = document.createElement('div');
        checkoutItem.className = 'checkout-item';
        checkoutItem.innerHTML = `
            <span>${item.name} x ${item.quantity}</span>
            <span>$${item.subtotal}</span>
        `;
        checkoutItems.appendChild(checkoutItem);
    });
    
    checkoutTotal.textContent = cart.total;
    
    // Pre-fill shipping address if available
    if (currentUser.address) {
        document.getElementById('shippingAddress').value = currentUser.address;
    }
    
    modal.style.display = 'block';
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').style.display = 'none';
}

async function placeOrder(event) {
    event.preventDefault();
    
    const shippingAddress = document.getElementById('shippingAddress').value;
    
    try {
        const response = await fetch('/api/orders/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ shipping_address: shippingAddress })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Order placed successfully!', 'success');
            closeCheckoutModal();
            loadCart();
            showSection('orders');
            loadOrders();
        } else {
            showToast(data.error || 'Failed to place order', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    }
}

// Orders
async function loadOrders() {
    if (!currentUser) return;
    
    try {
        const response = await fetch('/api/orders', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const orders = await response.json();
        displayOrders(orders);
    } catch (error) {
        showToast('Failed to load orders', 'error');
    }
}

function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<div class="empty-cart">No orders found</div>';
        return;
    }
    
    ordersList.innerHTML = '';
    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        orderCard.innerHTML = `
            <div class="order-header">
                <div class="order-id">Order #${order.id}</div>
                <div class="order-status ${order.status}">${order.status}</div>
            </div>
            <div class="order-info">
                <div><strong>Total:</strong> $${order.total_amount}</div>
                <div><strong>Items:</strong> ${order.item_count}</div>
                <div><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</div>
                <div><strong>Address:</strong> ${order.shipping_address || 'Not provided'}</div>
            </div>
        `;
        ordersList.appendChild(orderCard);
    });
}

// Utility functions
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Close modals when clicking outside
window.onclick = function(event) {
    const productModal = document.getElementById('productModal');
    const checkoutModal = document.getElementById('checkoutModal');
    
    if (event.target === productModal) {
        productModal.style.display = 'none';
    }
    if (event.target === checkoutModal) {
        checkoutModal.style.display = 'none';
    }
}
