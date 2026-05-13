document.addEventListener('DOMContentLoaded', () => {
    // Initialisation
    if (document.getElementById('products-container')) {
        fetchProducts();
        fetchPublicSellers(); // Nouveau : Charger les vendeurs pour le filtre
        setupFilters();
    }
    
    fetchDeliveryZones();
    
    // Page Dététail Produit
    if (document.getElementById('product-detail-container')) {
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id');
        if (productId) {
            fetchProductDetail(productId);
        } else {
            document.getElementById('product-detail-container').innerHTML = '<h2>Produit non trouvé.</h2>';
        }
    }

    setupCartUI();
    setupNewsletter();
    setupSearchUI();
    setupMobileMenu();
});

let allProducts = [];
let cart = [];

// ==========================================
// API & Data fetching
// ==========================================
async function fetchProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    try {
        const response = await fetch('/api/products');
        const result = await response.json();
        
        if (result.message === 'success') {
            allProducts = result.data;
            displayProducts(allProducts);
            updateProductCount(allProducts.length);
        } else {
            container.innerHTML = `<div class="error">Erreur: ${result.error}</div>`;
        }
    } catch (error) {
        container.innerHTML = `<div class="error">Erreur de connexion au serveur.</div>`;
    }
}

async function fetchDeliveryZones() {
    try {
        const response = await fetch('/api/delivery-zones');
        const result = await response.json();
        
        if (result.message === 'success') {
            const select = document.getElementById('checkout-zone');
            if (select) {
                // Keep the placeholder
                select.innerHTML = '<option value="0" data-price="0">Sélectionnez votre zone de livraison...</option>';
                result.data.forEach(zone => {
                    const option = document.createElement('option');
                    option.value = zone.id;
                    option.setAttribute('data-price', zone.price);
                    option.textContent = `${zone.name} - ${formatCurrency(zone.price)}`;
                    select.appendChild(option);
                });
                
                select.addEventListener('change', renderCartItems);
                
                // Signal that zones are ready for pre-filling
                document.dispatchEvent(new CustomEvent('zonesLoaded'));
            }
        }
    } catch (err) {
        console.error("Erreur chargement zones:", err);
    }
}

async function fetchPublicSellers() {
    try {
        const res = await fetch('/api/public/sellers');
        const result = await res.json();
        if (result.message === 'success') {
            const select = document.getElementById('filter-shop');
            if (select) {
                result.data.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.store_name;
                    opt.textContent = s.store_name;
                    select.appendChild(opt);
                });
            }
        }
    } catch (e) { console.error(e); }
}

async function fetchProductDetail(id) {
    const container = document.getElementById('product-detail-container');
    if (!container) return;

    try {
        const response = await fetch(`/api/products/${id}`);
        const result = await response.json();

        if (result.message === 'success') {
            const product = result.data;
            
            // Dynamic SEO Enriched (Google Rich Results)
            document.title = `${product.name} | Prix Guinée GNF | Diallo Digital`;
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute('content', `Achetez ${product.name} chez Diallo Digital. ${product.description.substring(0, 150)}... Livraison rapide à Conakry et partout en Guinée.`);
            }

            // Update Open Graph for WhatsApp sharing
            const ogTitle = document.querySelector('meta[property="og:title"]');
            if (ogTitle) ogTitle.setAttribute('content', `${product.name} - Diallo Digital`);
            const ogImg = document.querySelector('meta[property="og:image"]');
            if (ogImg) ogImg.setAttribute('content', product.image);

            // Inject Product Structured Data (JSON-LD)
            let existingSchema = document.getElementById('product-schema');
            if (existingSchema) existingSchema.remove();

            const schema = {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": product.name,
                "image": product.image,
                "description": product.description,
                "brand": {
                    "@type": "Brand",
                    "name": product.store_name || "Diallo Digital"
                },
                "offers": {
                    "@type": "Offer",
                    "url": window.location.href,
                    "priceCurrency": "GNF",
                    "price": product.price,
                    "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
                }
            };
            const script = document.createElement('script');
            script.id = 'product-schema';
            script.type = 'application/ld+json';
            script.text = JSON.stringify(schema);
            document.head.appendChild(script);

            // Conversion YouTube URL → embed
            let videoEmbed = '';
            if (product.video_url) {
                let videoHtml = '';
                const ytMatch = product.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                if (ytMatch) {
                    videoHtml = `<iframe src="https://www.youtube.com/embed/${ytMatch[1]}" allowfullscreen title="Vidéo ${product.name}"></iframe>`;
                } else if (product.video_url.endsWith('.mp4') || product.video_url.includes('/uploads/')) {
                    videoHtml = `<video controls><source src="${product.video_url}" type="video/mp4"></video>`;
                }
                if (videoHtml) {
                    videoEmbed = `<div class="product-video-container has-video">${videoHtml}</div>`;
                }
            }

            container.innerHTML = `
                <div class="product-detail-grid">
                    <!-- Colonne Gauche : Image + Vidéo -->
                    <div class="product-media">
                        <div class="product-image-main">
                            <img src="${product.image}" alt="${product.name}" onerror="this.src='https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800'">
                        </div>
                        ${videoEmbed}
                    </div>

                    <!-- Colonne Droite : Infos -->
                    <div class="product-info-panel">
                        <span class="product-category">${product.category || 'Électronique'}</span>
                        <h1>${product.name}</h1>
                        <div class="seller-badge">🏢 ${product.store_name || 'Diallo Digital'}</div>

                        <p class="product-desc">${product.description}</p>

                        <div class="price-block">
                            <div class="price-val">${formatCurrency(product.price)}</div>
                            <div class="price-note">TVA incluse · Livraison calculée au checkout</div>
                        </div>

                        <div class="product-actions" style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
                            <button class="add-cart-detail" id="add-to-cart-detail" style="margin-bottom:0;">
                                🛒 Ajouter au panier
                            </button>
                            
                            <a href="https://wa.me/?text=${encodeURIComponent('Hé ! Regarde ces ' + product.name + ' chez Diallo Digital : ' + window.location.href)}" 
                               target="_blank" 
                               class="share-whatsapp-btn" 
                               style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: #25d366; color: white; padding: 1rem; border-radius: var(--radius-md); text-decoration: none; font-weight: 700; font-size: 0.9rem; transition: var(--t-fast);">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.012 2c-5.508 0-9.988 4.48-9.988 9.988 0 1.76.46 3.412 1.264 4.852l-1.288 4.712 4.828-1.264c1.396.764 2.992 1.2 4.684 1.2 5.508 0 9.988-4.48 9.988-9.988 0-5.508-4.48-9.988-9.988-9.988zm-5.004 5.004c.164 0 .332.004.484.012.236.012.428.028.596.224.2.228.676 1.64.736 1.764.06.124.1.268.016.44-.084.172-.128.28-.256.424-.128.144-.268.32-.384.428-.128.12-.264.252-.112.512.152.26 1.348 2.228 3.016 3.712 1.108.988 2.124 1.408 2.456 1.576.332.168.528.144.728-.088.2-.232.868-1.012 1.104-1.36.056-.08.18-.148.332-.092.152.056.964.456 1.632.792.668.336 1.108.5 1.236.72.128.22.128 1.264-.32 2.528-.448 1.264-2.22 1.832-3.076 1.832-.856 0-3.648-.82-6.524-3.528C5.232 12.004 4.228 8.8 4.228 8.02c0-.78.712-1.552 1.488-2.676.776-1.124 1.292-1.34 1.292-1.34z"/></svg>
                                Partager sur WhatsApp
                            </a>
                        </div>

                        <div class="guarantees-grid">
                            <div class="guarantee-item">
                                <span class="g-icon">✅</span>
                                <span class="g-label">Produit Authentique</span>
                            </div>
                            <div class="guarantee-item">
                                <span class="g-icon">🚚</span>
                                <span class="g-label">Livraison Rapide</span>
                            </div>
                            <div class="guarantee-item">
                                <span class="g-icon">💬</span>
                                <span class="g-label">Support WhatsApp</span>
                            </div>
                        </div>

                        <div class="payment-badges">
                            <span>Paiement :</span>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Orange_logo.svg" alt="Orange Money">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MTN_Logo.svg" alt="MTN Money">
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('add-to-cart-detail').addEventListener('click', () => {
                addToCart(product);
            });

            // ENRICHISSEMENT : Avis et Produits Similaires
            fetchReviews(product.id);
            setupReviewForm(product.id);
            fetchRelatedProducts(product.category, product.id);
        } else {
            container.innerHTML = '<h2>Produit non trouvé.</h2>';
        }
    } catch (error) {
        container.innerHTML = '<h2>Erreur lors du chargement du produit.</h2>';
    }
}

function updateProductCount(count) {
    const countEl = document.getElementById('product-count');
    if (countEl) {
        countEl.textContent = `${count} produits`;
    }
}

// ==========================================
// Product Rendering (Nouveau Design)
// ==========================================
function displayProducts(products, containerId = 'products-container') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!Array.isArray(products)) {
        console.error("displayProducts: products n'est pas un tableau", products);
        return;
    }
    
    container.innerHTML = ''; 

    if (products.length === 0) {
        container.innerHTML = `<div class="loading-spinner">Aucun produit trouvé.</div>`;
        return;
    }

    products.forEach((product, index) => {
        const card = document.createElement('div');
        const isPromo = index % 3 === 0; 
        const isNew = index % 4 === 0;   
        
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image-wrapper">
                <a href="produit.html?id=${product.id}">
                    ${isPromo ? '<span class="badge-label">Promotion</span>' : ''}
                    ${isNew && !isPromo ? '<span class="badge-label badge-new">Nouveau</span>' : ''}
                    <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop'">
                </a>
            </div>
            <div class="product-info">
                <span class="product-category">${product.category || 'Tech'}</span>
                <a href="produit.html?id=${product.id}" class="product-title">${product.name}</a>
                <div style="font-size: 0.75rem; color: var(--primary); margin-bottom: 0.5rem; font-weight: 500;">
                    ${product.store_name ? '🏢 Vendu par ' + product.store_name : '🏢 Diallo Digital'}
                </div>
                <span class="product-price">${formatCurrency(product.price)}</span>
                <button class="add-btn" data-id="${product.id}">
                    Ajouter au panier
                </button>
            </div>
        `;
        
        // Attach event listener safely
        const addBtn = card.querySelector('.add-btn');
        addBtn.addEventListener('click', () => {
            addToCart(product);
        });
        
        container.appendChild(card);
    });
}



// ==========================================
// Newsletter — Sauvegarde en base de données
// ==========================================
function setupNewsletter() {
    const form = document.querySelector('.newsletter-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = form.querySelector('input[type="email"]');
        const btn = form.querySelector('button[type="submit"]');
        const email = input.value.trim();
        if (!email) return;

        btn.disabled = true;
        btn.innerHTML = '⏳';

        try {
            const res = await fetch('/api/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();

            if (data.message === 'success') {
                input.value = '';
                showNewsletterMsg(form, '✅ Merci ! Vous êtes bien inscrit.', 'success');
            } else if (data.message === 'already_subscribed') {
                showNewsletterMsg(form, 'ℹ️ Vous êtes déjà inscrit !', 'info');
            } else {
                showNewsletterMsg(form, '❌ Une erreur est survenue.', 'error');
            }
        } catch (err) {
            showNewsletterMsg(form, '❌ Connexion impossible.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';
        }
    });
}

function showNewsletterMsg(form, msg, type) {
    let el = form.parentNode.querySelector('.newsletter-msg');
    if (!el) {
        el = document.createElement('p');
        el.className = 'newsletter-msg';
        el.style.cssText = 'margin-top:1rem; font-weight:600; font-size:0.9rem;';
        form.after(el);
    }
    el.textContent = msg;
    el.style.color = type === 'success' ? '#30d158' : type === 'info' ? '#2997ff' : '#ff453a';
    setTimeout(() => { el.textContent = ''; }, 5000);
}

// ==========================================
// Filtering & Search
// ==========================================
function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const shopSelect = document.getElementById('filter-shop');
    const priceRange = document.getElementById('filter-price-range');
    const priceLabel = document.getElementById('price-value');
    const resetBtn = document.getElementById('reset-filters');
    const inlineSearch = document.getElementById('inline-search');

    let currentCategory = 'all';

    const applyAllFilters = () => {
        try {
            const maxPrice = priceRange ? parseInt(priceRange.value) : 10000000;
            const selectedShop = shopSelect ? shopSelect.value : 'all';
            const searchTerm = (inlineSearch ? inlineSearch.value : '').toLowerCase();

            let filtered = allProducts.filter(p => {
                if (!p) return false;
                // 1. Catégorie
                let matchCat = true;
                const cat = (p.category || '').toLowerCase();
                const name = (p.name || '').toLowerCase();

                if (currentCategory === 'pro') matchCat = name.includes('pro');
                else if (currentCategory === 'max') matchCat = name.includes('max');
                else if (currentCategory === 'neuf') matchCat = name.includes('neuf');
                else if (currentCategory === 'reconditionne') matchCat = name.includes('reconditionn');
                else if (currentCategory !== 'all') matchCat = cat === currentCategory.toLowerCase();

                // 2. Prix
                const matchPrice = (p.price || 0) <= maxPrice;

                // 3. Boutique
                // Si store_name est null, on considère que c'est "Diallo Digital"
                const pStore = p.store_name || "Diallo Digital";
                const matchShop = selectedShop === 'all' || pStore === selectedShop;

                // 4. Recherche
                const desc = (p.description || '').toLowerCase();
                const matchSearch = name.includes(searchTerm) || desc.includes(searchTerm);

                return matchCat && matchPrice && matchShop && matchSearch;
            });

            displayProducts(filtered);
            updateProductCount(filtered.length);
            if (priceLabel) {
                priceLabel.textContent = maxPrice >= 10000000 ? 'Max' : formatCurrency(maxPrice);
            }
        } catch (err) {
            console.error("Erreur dans applyAllFilters:", err);
        }
    };

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            applyAllFilters();
        });
    });

    if (shopSelect) shopSelect.addEventListener('change', applyAllFilters);
    if (priceRange) priceRange.addEventListener('input', applyAllFilters);
    if (inlineSearch) inlineSearch.addEventListener('input', applyAllFilters);

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            currentCategory = 'all';
            filterBtns.forEach(b => b.classList.remove('active'));
            filterBtns[0].classList.add('active');
            if (shopSelect) shopSelect.value = 'all';
            if (priceRange) priceRange.value = 10000000;
            if (inlineSearch) inlineSearch.value = '';
            applyAllFilters();
        });
    }
}

// ==========================================
// Reviews & Recommendations
// ==========================================
async function fetchReviews(productId) {
    const list = document.getElementById('reviews-list');
    if (!list) return;

    try {
        const res = await fetch(`/api/products/${productId}/reviews`);
        const result = await res.json();
        
        if (result.message === 'success' && result.data.length > 0) {
            list.innerHTML = '';
            result.data.forEach(rev => {
                const date = new Date(rev.created_at).toLocaleDateString('fr-FR');
                const stars = '⭐'.repeat(rev.rating);
                
                const card = document.createElement('div');
                card.className = 'review-card';
                card.innerHTML = `
                    <div class="rev-header">
                        <span class="rev-name">${rev.user_name}</span>
                        <span class="rev-rating">${stars}</span>
                    </div>
                    <p class="rev-comment">${rev.comment}</p>
                    <span class="rev-date">Le ${date}</span>
                `;
                list.appendChild(card);
            });
        } else {
            list.innerHTML = '<p class="text-muted">Aucun avis pour le moment. Soyez le premier !</p>';
        }
    } catch (err) {
        list.innerHTML = '<p class="error">Impossible de charger les avis.</p>';
    }
}

function setupReviewForm(productId) {
    const btnOpen = document.getElementById('btn-open-review-form');
    const btnCancel = document.getElementById('btn-cancel-review');
    const formContainer = document.getElementById('review-form-container');
    const form = document.getElementById('submit-review-form');

    if (!btnOpen || !formContainer) return;

    btnOpen.onclick = () => formContainer.style.display = 'block';
    btnCancel.onclick = () => formContainer.style.display = 'none';

    form.onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            user_name: document.getElementById('rev-name').value,
            rating: document.getElementById('rev-rating').value,
            comment: document.getElementById('rev-comment').value
        };

        try {
            const res = await fetch(`/api/products/${productId}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                form.reset();
                formContainer.style.display = 'none';
                fetchReviews(productId);
            }
        } catch (err) { alert("Erreur lors de l'envoi de l'avis."); }
    };
}

async function fetchRelatedProducts(category, currentId) {
    const container = document.getElementById('related-products-container');
    if (!container) return;

    try {
        const res = await fetch(`/api/products?category=${encodeURIComponent(category)}`);
        const result = await res.json();
        if (result.message === 'success') {
            const filtered = result.data.filter(p => p.id != currentId).slice(0, 4);
            displayProducts(filtered, 'related-products-container');
        }
    } catch (e) { console.error(e); }
}

function setupSearchUI() {
    const searchToggle = document.getElementById('search-toggle');
    const searchOverlay = document.getElementById('search-overlay');
    const closeSearch = document.getElementById('close-search');
    const searchInput = document.getElementById('search-input');

    if (searchToggle && searchOverlay) {
        searchToggle.addEventListener('click', () => {
            searchOverlay.classList.add('active');
            setTimeout(() => { if (searchInput) searchInput.focus(); }, 100);
        });

        if (closeSearch) {
            closeSearch.addEventListener('click', () => {
                searchOverlay.classList.remove('active');
                if (searchInput) {
                    searchInput.value = '';
                    displayProducts(allProducts);
                    updateProductCount(allProducts.length);
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
                searchOverlay.classList.remove('active');
            }
        });

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = allProducts.filter(p => 
                    p.name.toLowerCase().includes(term) || 
                    (p.description && p.description.toLowerCase().includes(term))
                );
                displayProducts(filtered);
                updateProductCount(filtered.length);
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    searchOverlay.classList.remove('active');
                    const container = document.getElementById('products-container');
                    if (container) {
                        const y = container.getBoundingClientRect().top + window.scrollY - 100;
                        window.scrollTo({top: y, behavior: 'smooth'});
                    }
                }
            });
        }
    }
}

// ==========================================
// Shopping Cart Logic
// ==========================================
function setupCartUI() {
    const cartToggle = document.getElementById('cart-toggle');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCart = document.getElementById('close-cart');

    if (cartToggle && cartOverlay) {
        cartToggle.addEventListener('click', () => {
            cartOverlay.classList.add('active');
            
            const userInfoStr = localStorage.getItem('customer_info');
            if (userInfoStr) {
                try {
                    const userInfo = JSON.parse(userInfoStr);
                    if (userInfo.full_name) document.getElementById('checkout-name').value = userInfo.full_name;
                    if (userInfo.phone) document.getElementById('checkout-phone').value = userInfo.phone;
                    if (userInfo.address) document.getElementById('checkout-address').value = userInfo.address;
                    
                    const tryPreFillZone = () => {
                        const zoneSelect = document.getElementById('checkout-zone');
                        if (!zoneSelect || !userInfo.delivery_zone) return;
                        
                        for(let i=0; i<zoneSelect.options.length; i++){
                            if(zoneSelect.options[i].text.startsWith(userInfo.delivery_zone)){
                                zoneSelect.selectedIndex = i;
                                renderCartItems();
                                break;
                            }
                        }
                    };

                    // Try immediately if zones are already there
                    tryPreFillZone();
                    // Or wait for the event
                    document.addEventListener('zonesLoaded', tryPreFillZone, { once: true });
                } catch(e) {}
            }
        });

        closeCart.addEventListener('click', () => {
            cartOverlay.classList.remove('active');
        });

        // Fermer si on clique en dehors du panel
        cartOverlay.addEventListener('click', (e) => {
            if (e.target === cartOverlay) {
                cartOverlay.classList.remove('active');
            }
        });

        // Gestion du changement de mode de paiement
        const paymentSelect = document.getElementById('checkout-payment-method');
        const momoInstructions = document.getElementById('momo-instructions');
        const momoText = document.getElementById('momo-text');

        if (paymentSelect) {
            paymentSelect.addEventListener('change', () => {
                const method = paymentSelect.value;
                if (method === 'Orange Money') {
                    momoInstructions.style.display = 'block';
                    momoText.innerHTML = "🔹 <strong>Orange Money :</strong> Veuillez envoyer le montant total au <strong>622 00 00 00</strong>. Saisissez ensuite l'ID de transaction ci-dessous.";
                } else if (method === 'MTN Mobile Money') {
                    momoInstructions.style.display = 'block';
                    momoText.innerHTML = "🔹 <strong>MTN Mobile Money :</strong> Veuillez envoyer le montant total au <strong>664 00 00 00</strong>. Saisissez ensuite l'ID de transaction ci-dessous.";
                } else {
                    momoInstructions.style.display = 'none';
                }
            });
        }
    }

    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async () => {
            if (cart.length === 0) {
                alert("Votre panier est vide.");
                return;
            }

            const nameInput = document.getElementById('checkout-name').value.trim();
            const phoneInput = document.getElementById('checkout-phone').value.trim();
            const zoneSelect = document.getElementById('checkout-zone');
            const addressInput = document.getElementById('checkout-address').value.trim();
            const paymentMethodSelect = document.getElementById('checkout-payment-method');
            const paymentMethod = paymentMethodSelect ? paymentMethodSelect.value : 'WhatsApp / Livraison';
            const paymentRefInput = document.getElementById('checkout-payment-ref');
            const paymentRef = paymentRefInput ? paymentRefInput.value.trim() : '';

            if (!nameInput || !phoneInput || !zoneSelect || zoneSelect.selectedIndex <= 0 || !addressInput) {
                alert("Veuillez remplir vos coordonnées complètes et choisir une zone de livraison.");
                return;
            }

            if ((paymentMethod.includes('Orange') || paymentMethod.includes('MTN')) && !paymentRef) {
                alert("Veuillez saisir l'ID de transaction pour confirmer votre paiement Mobile Money.");
                return;
            }

            const deliveryFee = parseFloat(zoneSelect.options[zoneSelect.selectedIndex].getAttribute('data-price')) || 0;
            const deliveryZoneName = zoneSelect.options[zoneSelect.selectedIndex].text.split(' - ')[0];

            const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const total = subtotal + deliveryFee;

            let userId = null;
            try {
                const userInfoStr = localStorage.getItem('customer_info');
                if (userInfoStr) userId = JSON.parse(userInfoStr).id;
            } catch(e) {}

            try {
                const orderData = {
                    items: cart,
                    total: total,
                    customer_name: nameInput,
                    customer_phone: phoneInput,
                    delivery_zone: deliveryZoneName,
                    address: addressInput,
                    payment_method: paymentMethod,
                    payment_ref: paymentRef,
                    user_id: userId
                };

                const res = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });

                const result = await res.json();

                if (!res.ok) {
                    alert(`⚠️ Erreur : ${result.error}`);
                    return;
                }

                // Si OK, on génère le message WhatsApp
                let msg = `🛍️ *Nouvelle Commande Diallo Digital*\n`;
                msg += `--------------------------\n`;
                msg += `👤 *Client :* ${nameInput}\n`;
                msg += `📞 *Tel :* ${phoneInput}\n`;
                msg += `📍 *Zone :* ${deliveryZoneName}\n`;
                msg += `🏠 *Adresse :* ${addressInput}\n`;
                msg += `💳 *Paiement :* ${paymentMethod}\n`;
                if (paymentRef) msg += `🔑 *Réf. Transaction :* ${paymentRef}\n`;
                msg += `--------------------------\n`;
                msg += `📦 *Articles :*\n`;
                
                cart.forEach(item => {
                    msg += `- ${item.name} (x${item.quantity}) - ${formatCurrency(item.price * item.quantity)}\n`;
                });

                msg += `--------------------------\n`;
                msg += `🚚 *Livraison :* ${formatCurrency(deliveryFee)}\n`;
                msg += `💰 *Total : ${formatCurrency(total)}*\n\n`;
                msg += `*ID Commande : #${result.orderId}*`;
                
                const url = `https://wa.me/224611760045?text=${encodeURIComponent(msg)}`;
                window.open(url, '_blank');
                
                // Vider le panier après succès
                cart = [];
                updateCartIcon();
                renderCartItems();
                document.getElementById('cart-overlay').classList.remove('active');
                alert(`✅ Commande #${result.orderId} enregistrée ! Merci.`);

            } catch (err) {
                console.error(err);
                alert("Erreur lors de la validation. Veuillez réessayer.");
            }
        });
    }
}

function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    updateCartIcon();
    renderCartItems();
    document.getElementById('cart-overlay').classList.add('active');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartIcon();
    renderCartItems();
}

function updateCartIcon() {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const subtotalEl = document.getElementById('cart-subtotal-price');
    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);

    const zoneSelect = document.getElementById('checkout-zone');
    let deliveryFee = 0;
    if (zoneSelect && zoneSelect.selectedIndex > 0) {
        deliveryFee = parseFloat(zoneSelect.options[zoneSelect.selectedIndex].getAttribute('data-price')) || 0;
    }
    
    const shippingEl = document.getElementById('cart-delivery-price');
    if (shippingEl) shippingEl.textContent = formatCurrency(deliveryFee);

    const total = subtotal + deliveryFee;
    const totalEl = document.getElementById('cart-total-price');
    if (totalEl) totalEl.textContent = formatCurrency(total);

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countEl = document.querySelector('.cart-count');
    if (countEl) countEl.textContent = totalItems;
}

function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    const footerEl = document.getElementById('cart-footer');
    
    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-cart">Votre panier est vide</div>';
        if (footerEl) footerEl.style.display = 'none';
        return;
    }

    if (footerEl) footerEl.style.display = 'block';

    container.innerHTML = '';
    let subtotal = 0;

    const subTotalPriceEl = document.getElementById('cart-subtotal-price');
    const deliveryPriceEl = document.getElementById('cart-delivery-price');
    const totalPriceEl = document.getElementById('cart-total-price');

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const el = document.createElement('div');
        el.className = 'cart-item-row';
        el.style.display = 'flex';
        el.style.gap = '1rem';
        el.style.marginBottom = '1.5rem';
        el.style.alignItems = 'center';
        
        el.innerHTML = `
            <img src="${item.image}" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover;">
            <div style="flex: 1;">
                <div style="font-weight: 600; font-size: 0.9rem;">${item.name}</div>
                <div style="font-size: 0.8rem; color: #64748b;">${item.quantity} x ${formatCurrency(item.price)}</div>
            </div>
            <button onclick="removeFromCart(${item.id})" style="background: none; border: none; color: #ef4444; cursor: pointer;">&times;</button>
        `;
        container.appendChild(el);
    });

    const zoneSelect = document.getElementById('checkout-zone');
    let deliveryFee = 0;
    if (zoneSelect && zoneSelect.selectedIndex > 0) {
        deliveryFee = parseFloat(zoneSelect.options[zoneSelect.selectedIndex].getAttribute('data-price')) || 0;
    }

    if (subTotalPriceEl) subTotalPriceEl.textContent = formatCurrency(subtotal);
    if (deliveryPriceEl) deliveryPriceEl.textContent = deliveryFee > 0 ? formatCurrency(deliveryFee) : '0 GNF';
    if (totalPriceEl) totalPriceEl.textContent = formatCurrency(subtotal + deliveryFee);
}

function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0 GNF';
    return new Intl.NumberFormat('fr-GN').format(amount) + ' GNF';
}

// ==========================================
// Mobile Menu Navigation
// ==========================================
function setupMobileMenu() {
    if (window.innerWidth > 768) return; // Uniquement sur mobile

    const headerContainer = document.querySelector('.header-container');
    const headerActions = document.querySelector('.header-actions');
    const existingNav = document.querySelector('.nav-menu');
    
    // S'il n'y a pas de menu existant sur la page, on ignore
    if (!existingNav) return;

    // Création du bouton Hamburger
    const menuBtn = document.createElement('button');
    menuBtn.className = 'mobile-menu-btn';
    menuBtn.innerHTML = '<span></span><span></span><span></span>';
    
    // Placement du bouton
    if (headerActions) {
        // L'insérer au début des actions
        headerActions.insertBefore(menuBtn, headerActions.firstChild);
    } else if (headerContainer) {
        headerContainer.appendChild(menuBtn);
    } else {
        return;
    }

    // Création de l'overlay avec les liens copiés
    const overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    
    const ul = document.createElement('ul');
    ul.innerHTML = existingNav.innerHTML;
    
    overlay.appendChild(ul);
    document.body.appendChild(overlay);

    // Fonctionnalité d'ouverture/fermeture
    menuBtn.addEventListener('click', () => {
        menuBtn.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = overlay.classList.contains('active') ? 'hidden' : '';
    });

    // Fermer le menu au clic sur un lien
    const links = overlay.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            menuBtn.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}
