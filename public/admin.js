// Vérification du token au chargement
const token = localStorage.getItem('adminToken');
if (!token || token === 'undefined') {
    window.location.href = 'login.html';
}

// Helper pour les requêtes autorisées
async function fetchAuth(url, options = {}) {
    if (!options.headers) options.headers = {};
    if (!(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
    }
    options.headers['Authorization'] = 'Bearer ' + token;
    
    const response = await fetch(url, options);
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken');
        window.location.href = 'login.html';
        throw new Error('Non autorisé');
    }
    return response;
}

document.addEventListener('DOMContentLoaded', () => {
    // Bouton de déconnexion
    const logoutBtn = document.createElement('a');
    logoutBtn.href = '#';
    logoutBtn.className = 'nav-item';
    logoutBtn.innerHTML = 'Déconnexion';
    logoutBtn.style.color = '#ef4444';
    logoutBtn.onclick = () => {
        localStorage.removeItem('adminToken');
        window.location.href = 'login.html';
    };
    document.querySelector('.sidebar-nav').appendChild(logoutBtn);

    setupTabs();
    setupModal();
    loadDashboardData();
    loadProducts();
    loadOrders();
    loadReviewsAdmin();
    loadSellerRequestsAdmin();
    loadPendingProductsAdmin();
});

// ==========================================
// Navigation & Tabs
// ==========================================
function setupTabs() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-tab]');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = item.getAttribute('data-tab');

            // Update nav active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update panes
            tabPanes.forEach(pane => pane.classList.remove('active'));
            document.getElementById(`tab-${targetTab}`).classList.add('active');
        });
    });
}

// ==========================================
// Modal
// ==========================================
function setupModal() {
    const modalOverlay = document.getElementById('product-modal');
    const openBtn = document.getElementById('add-product-btn');
    const closeBtn = document.getElementById('close-modal-btn');
    const form = document.getElementById('product-form');

    form.dataset.mode = 'add';

    openBtn.addEventListener('click', () => {
        form.reset();
        form.dataset.mode = 'add';
        document.querySelector('.modal-header h3').textContent = 'Ajouter un Produit';
        modalOverlay.classList.add('open');
    });

    closeBtn.addEventListener('click', () => {
        modalOverlay.classList.remove('open');
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('open');
        }
    });

    // Gestion de la recherche d'images sur le Web
    const btnSearch = document.getElementById('btn-search-image');
    btnSearch.addEventListener('click', () => {
        const query = document.getElementById('p-name').value;
        if (!query) {
            alert("Veuillez saisir un nom de produit d'abord.");
            return;
        }
        const searchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
        window.open(searchUrl, '_blank');
    });

    // Aperçu de l'image en temps réel
    const imageUrlInput = document.getElementById('p-image-url');
    const imagePreviewBox = document.getElementById('image-preview-box');

    imageUrlInput.addEventListener('input', () => {
        const url = imageUrlInput.value.trim();
        if (url) {
            imagePreviewBox.innerHTML = `<img src="${url}" onerror="this.parentElement.innerHTML='<span class=\'image-preview-placeholder\' style=\'color:red\'>Lien invalide ou protégé</span>'">`;
        } else {
            imagePreviewBox.innerHTML = `<span class="image-preview-placeholder">Aperçu de l'image</span>`;
        }
    });

    // Soumission du formulaire (mise à jour pour inclure les nouveaux champs si nécessaire, 
    // mais fetchAuth utilise déjà FormData ou JSON dynamiquement)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const mode = form.dataset.mode;
        const formData = new FormData();
        
        formData.append('name', document.getElementById('p-name').value);
        formData.append('description', document.getElementById('p-desc').value);
        formData.append('price', document.getElementById('p-price').value);
        formData.append('stock', document.getElementById('p-stock').value);
        formData.append('category', document.getElementById('p-category').value);
        formData.append('video_url', document.getElementById('p-video-url') ? document.getElementById('p-video-url').value.trim() : '');
        
        const fileInput = document.getElementById('p-image-file');
        const urlInput = document.getElementById('p-image-url');
        
        if (fileInput.files[0]) {
            formData.append('image_file', fileInput.files[0]);
        } else if (urlInput.value.trim() !== "") {
            formData.append('image', urlInput.value.trim());
        }
        
        try {
            if (mode === 'add') {
                await fetchAuth('/api/admin/products', {
                    method: 'POST',
                    body: formData
                });
            } else if (mode === 'edit') {
                const id = form.dataset.editId;
                await fetchAuth(`/api/admin/products/${id}`, {
                    method: 'PUT',
                    body: formData
                });
            }
            
            // Réinitialiser le formulaire et l'aperçu
            form.reset();
            document.getElementById('image-preview-box').innerHTML = '<span class="image-preview-placeholder">Aperçu de l\'image</span>';
            
            modalOverlay.classList.remove('open');
            loadProducts();
            loadDashboardData();
        } catch (err) {
            alert('Erreur: ' + err.message);
        }
    });
}

// ==========================================
// Data Loaders
// ==========================================
async function loadDashboardData() {
    try {
        const [productsRes, ordersRes] = await Promise.all([
            fetch('/api/products'),
            fetchAuth('/api/admin/orders')
        ]);
        
        const productsResult = await productsRes.json();
        const ordersResult = await ordersRes.json();

        if (productsResult.message === 'success' && ordersResult.message === 'success') {
            document.getElementById('stat-products').textContent = productsResult.data.length;
            const pendingOrders = ordersResult.data.filter(o => o.status === 'En attente').length;
            document.getElementById('stat-pending').textContent = pendingOrders;
            document.getElementById('stat-revenue').textContent = ordersResult.data.reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString() + ' GNF';
        }
    } catch (err) {
        console.error("Erreur Dashboard:", err);
    }
}

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const result = await response.json();
        const tbody = document.querySelector('#products-table tbody');
        tbody.innerHTML = '';

        if (result.message === 'success') {
            result.data.forEach(p => {
                const tr = document.createElement('tr');
                const isLowStock = p.stock < 5;
                tr.innerHTML = `
                    <td><img src="${p.image}" class="table-img"></td>
                    <td style="font-weight: 500;">${p.name}</td>
                    <td>${p.category || '-'}</td>
                    <td>${p.price.toLocaleString()} GNF</td>
                    <td style="${isLowStock ? 'color:#ef4444; font-weight:bold;' : ''}">
                        ${p.stock} ${isLowStock ? '<small>(Bas !)</small>' : ''}
                    </td>
                    <td>
                        <button class="btn btn-primary" onclick="editProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}', '${p.description.replace(/'/g, "\\'")}', ${p.price}, ${p.stock}, '${p.category}', '${p.image}', '${p.video_url || ''}')" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; margin-right: 0.5rem;">Éditer</button>
                        <button class="btn btn-danger" onclick="deleteProduct(${p.id})">Supprimer</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) {
        console.error(err);
    }
}

async function loadOrders() {
    try {
        const response = await fetchAuth('/api/admin/orders');
        const result = await response.json();
        const tbody = document.querySelector('#orders-table tbody');
        tbody.innerHTML = '';

        if (result.message === 'success') {
            window.adminOrders = result.data;
            result.data.forEach(o => {
                let itemsListHtml = '';
                try {
                    if (o.items) {
                        const items = JSON.parse(o.items);
                        if (Array.isArray(items) && items.length > 0) {
                            itemsListHtml = '<ul style="margin: 0.5rem 0 0; padding: 0; list-style-type: none; font-size: 0.8rem; color: #64748b;">';
                            items.forEach(item => {
                                itemsListHtml += `<li>• ${item.quantity}x ${item.name}</li>`;
                            });
                            itemsListHtml += '</ul>';
                        }
                    }
                } catch(e) { /* ignore JSON parse error */ }

                const tr = document.createElement('tr');
                const date = new Date(o.created_at).toLocaleString('fr-FR');
                const statusOptions = ['En attente', 'Payée', 'Expédiée', 'Livrée', 'Annulée'];
                
                tr.innerHTML = `
                    <td>#${o.id.toString().padStart(5, '0')} <br><small style="color:var(--text-muted)">${date}</small></td>
                    <td>
                        <strong>${o.customer_name || 'Anonyme'}</strong><br><small>${o.address || ''}</small>
                        ${itemsListHtml}
                    </td>
                    <td>
                        <span class="status-badge" style="background:#e0f2fe; color:#0369a1">${o.payment_method || 'NC'}</span>
                        ${o.payment_ref ? `<br><small style="color:#059669; font-weight:600;">Ref: ${o.payment_ref}</small>` : ''}
                    </td>
                    <td style="font-weight: bold;">${o.total.toLocaleString()} GNF</td>
                    <td>
                        <select onchange="window.updateOrderStatus(${o.id}, this.value)" class="status-select ${o.status.toLowerCase().replace(' ', '-')}">
                            ${statusOptions.map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </td>
                    <td>
                        <a href="https://wa.me/224611760045?text=${encodeURIComponent('Bonjour, concernant votre commande #' + o.id)}" target="_blank" class="btn btn-primary" style="background:#25d366; padding: 0.25rem 0.5rem; font-size: 0.8rem; display:inline-block; margin-bottom: 0.25rem;">
                            Relancer
                        </a>
                        <br>
                        <button class="btn btn-secondary" onclick="window.generateInvoice(${o.id})" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; color:#334155; background:#e2e8f0; border: none; border-radius: 4px; cursor: pointer;">
                            📄 Facture
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) {
        console.error(err);
    }
}

async function loadReviewsAdmin() {
    try {
        const response = await fetchAuth('/api/admin/reviews');
        const data = await response.json();
        const tbody = document.querySelector('#reviews-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        if (data.message === 'success') {
            data.data.forEach(r => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${r.user_name}</td>
                    <td>${'★'.repeat(r.rating)}</td>
                    <td>${r.comment}</td>
                    <td>${new Date(r.created_at).toLocaleDateString()}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) { console.error(err); }
}

async function loadSellerRequestsAdmin() {
    try {
        const response = await fetchAuth('/api/admin/sellers');
        const data = await response.json();
        const tbody = document.querySelector('#sellers-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        if (data.message === 'success') {
            data.data.forEach(s => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${s.store_name}</strong><br><small>${s.email || ''}</small></td>
                    <td>${s.owner_name}</td>
                    <td>${s.phone}</td>
                    <td>${s.category}</td>
                    <td>
                        <div style="display:flex; gap:0.5rem; align-items:center;">
                            <select onchange="window.updateSellerStatus(${s.id}, this.value)" style="padding:0.4rem; border-radius:4px; border:1px solid var(--border); background:var(--bg-card); color:var(--text); font-weight:600; flex:1;">
                                <option value="pending" ${s.status === 'pending' ? 'selected' : ''}>⏳ Attente</option>
                                <option value="approved" ${s.status === 'approved' ? 'selected' : ''}>✅ Ok</option>
                                <option value="rejected" ${s.status === 'rejected' ? 'selected' : ''}>❌ Non</option>
                            </select>
                            <button onclick="window.deleteSeller(${s.id})" class="btn-danger" style="padding:0.4rem; border:none; background:#fee2e2; color:#ef4444; border-radius:4px; cursor:pointer;" title="Supprimer le vendeur">
                                🗑️
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) { console.error(err); }
}

async function loadPendingProductsAdmin() {
    try {
        const response = await fetchAuth('/api/admin/products/pending');
        const data = await response.json();
        const tbody = document.querySelector('#pending-products-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        if (data.message === 'success' && data.data) {
            data.data.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><img src="${p.image}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;"></td>
                    <td><strong>${p.name}</strong></td>
                    <td><span class="badge" style="background:var(--primary-light);">${p.store_name}</span></td>
                    <td>${p.category}</td>
                    <td>${p.price.toLocaleString()} GNF</td>
                    <td>
                        <button onclick="window.approveProduct(${p.id})" class="btn-primary" style="padding:0.4rem 0.8rem; font-size:0.8rem;">Accepter</button>
                        <button onclick="window.deleteProduct(${p.id})" class="btn-danger" style="padding:0.4rem 0.8rem; font-size:0.8rem; background:#ef4444; border:none; color:white; border-radius:4px; cursor:pointer;">Refuser</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) { console.error(err); }
}

window.approveProduct = async function(id) {
    if(!confirm('Approuver ce produit ?')) return;
    try {
        const res = await fetchAuth(`/api/admin/products/${id}/approve`, { method: 'PUT' });
        if(res.ok) {
            loadPendingProductsAdmin();
            loadProducts(); // Refresh main list
        }
    } catch (err) { alert('Erreur lors de l\'approbation'); }
}

window.updateSellerStatus = async function(id, newStatus) {
    if (!confirm('Changer le statut de ce vendeur ?')) return;
    try {
        await fetchAuth(`/api/admin/sellers/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        loadSellerRequestsAdmin(); // Recharger le tableau
    } catch (err) {
        alert('Erreur lors de la mise à jour du statut.');
    }
}

window.deleteSeller = async function(id) {
    if (!confirm('🚨 ATTENTION : Supprimer ce vendeur supprimera également TOUS ses produits. Continuer ?')) return;
    try {
        const res = await fetchAuth(`/api/admin/sellers/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadSellerRequestsAdmin();
            loadProducts(); // Refresh product list too
            loadDashboardData();
        } else {
            const err = await res.json();
            alert('Erreur: ' + err.error);
        }
    } catch (err) {
        alert('Erreur lors de la suppression du vendeur.');
    }
}

window.updateOrderStatus = async function(id, newStatus) {
    try {
        await fetchAuth(`/api/admin/orders/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        loadDashboardData();
    } catch (err) {
        alert('Erreur lors de la mise à jour du statut');
    }
}

// ==========================================
// Actions
// ==========================================
window.editProduct = function(id, name, desc, price, stock, category, image, video_url) {
    const form = document.getElementById('product-form');
    document.getElementById('p-name').value = name;
    document.getElementById('p-desc').value = desc;
    document.getElementById('p-price').value = price;
    document.getElementById('p-stock').value = stock;
    document.getElementById('p-category').value = category || 'Mode';
    document.getElementById('p-image-url').value = image;
    document.getElementById('p-video-url').value = video_url || '';
    document.getElementById('p-image-file').value = '';

    form.dataset.mode = 'edit';
    form.dataset.editId = id;
    
    document.querySelector('.modal-header h3').textContent = 'Modifier le Produit';
    document.getElementById('product-modal').classList.add('open');
}

window.deleteProduct = async function(id) {
    if (confirm('Voulez-vous vraiment supprimer ce produit ?')) {
        try {
            await fetchAuth(`/api/admin/products/${id}`, { method: 'DELETE' });
            loadProducts();
            loadDashboardData();
        } catch (err) {
            console.error(err);
        }
    }
}

// ---------------------------
// GESTION LIVRAISON
// ---------------------------
async function loadShippingZones() {
    try {
        const res = await fetch('/api/delivery-zones');
        const result = await res.json();
        const tbody = document.querySelector('#shipping-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (result.message === 'success' && result.data) {
            result.data.forEach(z => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${z.name}</strong></td>
                    <td>${z.price.toLocaleString()} GNF</td>
                    <td>
                        <button class="btn" style="background:#ef4444; color:white; padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="deleteZone(${z.id})">Supprimer</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) {
        console.error(e);
    }
}

window.deleteZone = async (id) => {
    if (!confirm('Voulez-vous supprimer cette zone de livraison ?')) return;
    try {
        const res = await fetchAuth('/api/delivery-zones/' + id, { method: 'DELETE' });
        const result = await res.json();
        if (result.message) {
            loadShippingZones();
        } else {
            alert(result.error);
        }
    } catch (e) {
        console.error(e);
    }
};

const addZoneBtn = document.getElementById('add-zone-btn');
if (addZoneBtn) {
    addZoneBtn.addEventListener('click', async () => {
        const name = prompt("Nom du quartier / zone :");
        if (!name) return;
        const price = prompt("Prix de la livraison (ex: 20000) :");
        if (!price || isNaN(price)) return;
        
        try {
            const res = await fetchAuth('/api/delivery-zones', {
                method: 'POST',
                body: JSON.stringify({ name, price: parseFloat(price) })
            });
            const result = await res.json();
            if (result.id) loadShippingZones();
            else alert(result.error || "Erreur.");
        } catch (e) {
            console.error(e);
        }
    });
}

// ---------------------------
// FACTURATION PDF (jsPDF)
// ---------------------------
window.generateInvoice = function(orderId) {
    if (!window.adminOrders) return;
    const order = window.adminOrders.find(o => o.id === parseInt(orderId));
    if (!order) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138); // Bleu
    doc.text("DIALLO DIGITAL", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Boutique High-Tech & Accessoires Premium", 14, 26);
    doc.text("Conakry, Guinée", 14, 32);
    doc.text("Téléphone: +224 611 760 045", 14, 38);

    // Titre Facture
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("FACTURE", 140, 20);
    
    // Details
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`N° Commande : #${order.id.toString().padStart(5, '0')}`, 140, 28);
    doc.text(`Date : ${new Date(order.created_at).toLocaleDateString('fr-FR')}`, 140, 34);
    
    // Client Info
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 45, 196, 45); // Ligne horizontale
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Informations du Client", 14, 55);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Nom : ${order.customer_name || 'Client Web'}`, 14, 62);
    doc.text(`Téléphone : ${order.customer_phone || 'NC'}`, 14, 68);
    doc.text(`Zone de livraison : ${order.address || 'NC'}`, 14, 74);
    
    // Items Table
    let tableData = [];
    let items = [];
    try {
        if (order.items) items = JSON.parse(order.items);
    } catch(e) {}

    items.forEach(item => {
        tableData.push([
            item.name,
            item.quantity.toString(),
            item.price.toLocaleString() + ' GNF',
            (item.price * item.quantity).toLocaleString() + ' GNF'
        ]);
    });

    doc.autoTable({
        startY: 85,
        head: [['Désignation', 'Qté', 'Prix Unitaire', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138] },
        styles: { font: 'helvetica' }
    });

    // Total section
    let finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    
    // On estime les frais de livraison
    const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const shipping = order.total - subtotal;
    
    if (shipping > 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Sous-total: ${subtotal.toLocaleString()} GNF`, 130, finalY);
        finalY += 6;
        doc.text(`Frais de livraison: ${shipping.toLocaleString()} GNF`, 130, finalY);
        finalY += 8;
    }
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 138);
    doc.text(`TOTAL : ${order.total.toLocaleString()} GNF`, 130, finalY);
    
    // Footer
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(148, 163, 184);
    doc.text("Merci pour votre confiance !", 105, 280, null, null, "center");

    // Save
    doc.save(`Facture_DialloDigital_${order.id}.pdf`);
};
