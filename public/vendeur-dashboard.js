const token = localStorage.getItem('sellerToken');
const sellerInfo = JSON.parse(localStorage.getItem('sellerInfo'));

if (!token || !sellerInfo) {
    window.location.href = 'vendeur-login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('store-name-aside').textContent = sellerInfo.store_name;
    
    setupTabs();
    loadStats();
    loadMyProducts();
    loadMyOrders();
});

function setupTabs() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-tab]');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const titleEl = document.getElementById('tab-title');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = item.getAttribute('data-tab');
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            tabPanes.forEach(pane => pane.classList.remove('active'));
            document.getElementById(`tab-${targetTab}`).classList.add('active');
            
            const titles = { 'stats': 'Mon Tableau de Bord', 'my-products': 'Mes Produits', 'my-orders': 'Mes Ventes' };
            titleEl.textContent = titles[targetTab];
        });
    });
}

async function fetchAuth(url, options = {}) {
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    return fetch(url, options);
}

async function loadStats() {
    try {
        const res = await fetchAuth('/api/seller/orders');
        const result = await res.json();
        
        if (result.message === 'success') {
            const stats = result.data.reduce((acc, order) => {
                acc.brut += order.seller_subtotal;
                acc.commission += order.commission;
                acc.net += order.seller_net;
                return acc;
            }, { brut: 0, commission: 0, net: 0 });

            document.getElementById('stat-brut').textContent = stats.brut.toLocaleString() + ' GNF';
            document.getElementById('stat-commission').textContent = '-' + stats.commission.toLocaleString() + ' GNF';
            document.getElementById('stat-net').textContent = stats.net.toLocaleString() + ' GNF';
        }
    } catch (err) { console.error(err); }
}

async function loadMyProducts() {
    try {
        const res = await fetchAuth('/api/seller/products');
        const result = await res.json();
        const tbody = document.getElementById('seller-products-list');
        tbody.innerHTML = '';

        if (result.message === 'success') {
            result.data.forEach(p => {
                const tr = document.createElement('tr');
                const statusLabel = p.is_approved === 1 ? 'Approuvé' : 'En attente';
                const statusClass = p.is_approved === 1 ? 'status-approved' : 'status-pending';
                
                const stockClass = p.stock < 5 ? 'badge-stock-low' : '';
                
                tr.innerHTML = `
                    <td><img src="${p.image}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;"></td>
                    <td><strong>${p.name}</strong><br><small>${p.category}</small></td>
                    <td>${p.price.toLocaleString()} GNF</td>
                    <td><span class="stock-value ${stockClass}">${p.stock}</span></td>
                    <td><span class="badge-status ${statusClass}">${statusLabel}</span></td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) { console.error(err); }
}

async function loadMyOrders() {
    try {
        const res = await fetchAuth('/api/seller/orders');
        const result = await res.json();
        const tbody = document.getElementById('seller-orders-list');
        tbody.innerHTML = '';

        if (result.message === 'success') {
            result.data.forEach(order => {
                const tr = document.createElement('tr');
                const date = new Date(order.created_at).toLocaleDateString();
                const items = JSON.parse(order.items);
                const itemsHtml = items.map(i => `• ${i.name} (x${i.quantity})`).join('<br>');

                tr.innerHTML = `
                    <td>#${order.id}</td>
                    <td>${date}</td>
                    <td style="font-size: 0.85rem;">${itemsHtml}</td>
                    <td><strong>${order.seller_subtotal.toLocaleString()} GNF</strong></td>
                    <td>${order.status}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) { console.error(err); }
}

function openAddProductModal() {
    document.getElementById('product-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('product-modal').style.display = 'none';
}

document.getElementById('seller-add-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        name: document.getElementById('p-name').value,
        description: document.getElementById('p-desc').value,
        price: Number(document.getElementById('p-price').value),
        stock: Number(document.getElementById('p-stock').value),
        category: document.getElementById('p-category').value,
        image: document.getElementById('p-image').value
    };

    try {
        const res = await fetchAuth('/api/seller/products', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            alert('Produit soumis ! Il apparaîtra dès que l\'admin l\'aura validé.');
            closeModal();
            loadMyProducts();
        }
    } catch (err) { alert('Erreur lors de l\'ajout.'); }
});

function logout() {
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('sellerInfo');
    window.location.href = 'vendeur-login.html';
}
