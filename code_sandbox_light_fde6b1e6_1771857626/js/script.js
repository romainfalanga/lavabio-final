// ==========================================
// LAVABIO - JAVASCRIPT
// Animations fluides 60fps & Fonctionnalités
// ==========================================

(function() {
    'use strict';

    // === VARIABLES ===
    const nav = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    // === NAVIGATION MOBILE ===
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });

        // Fermer le menu lors du clic sur un lien
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // === SCROLL NAVBAR ===
    let lastScroll = 0;
    const scrollThreshold = 50;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > scrollThreshold) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });

    // === INTERSECTION OBSERVER POUR ANIMATIONS ===
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const animateOnScroll = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('animated');
                }, index * 100);
                animateOnScroll.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observer tous les éléments avec data-animate
    document.querySelectorAll('[data-animate]').forEach(el => {
        animateOnScroll.observe(el);
    });

    // === TARIFS TABS ===
    const tarifTabs = document.querySelectorAll('.tarif-tab');
    const tarifCategories = document.querySelectorAll('.tarif-category');

    tarifTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const category = tab.dataset.category;

            // Retirer active de tous les tabs
            tarifTabs.forEach(t => t.classList.remove('active'));
            // Ajouter active au tab cliqué
            tab.classList.add('active');

            // Cacher toutes les catégories
            tarifCategories.forEach(cat => {
                cat.classList.remove('active');
            });

            // Afficher la catégorie sélectionnée
            const activeCategory = document.querySelector(`.tarif-category[data-category="${category}"]`);
            if (activeCategory) {
                activeCategory.classList.add('active');
                
                // Réanimer les cards
                const cards = activeCategory.querySelectorAll('.tarif-card');
                cards.forEach((card, index) => {
                    card.classList.remove('animated');
                    setTimeout(() => {
                        card.classList.add('animated');
                    }, index * 50);
                });
            }
        });
    });

    // Animer les cards de la première catégorie au chargement
    window.addEventListener('load', () => {
        const firstCategory = document.querySelector('.tarif-category.active');
        if (firstCategory) {
            const cards = firstCategory.querySelectorAll('.tarif-card');
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('animated');
                }, index * 50);
            });
        }
    });

    // === COMMANDE LIVRAISON ===
    const commandeArticlesEl = document.getElementById('commandeArticles');

    if (commandeArticlesEl) {
        const DELIVERY_FEE = 5;
        const FREE_THRESHOLD = 29;

        // Articles disponibles à la commande.
        // Format : [nom, prix, type?]  — type : 'piece' (défaut) | 'from' (à partir de) | 'm2' (au mètre carré)
        const ORDER_ARTICLES = {
            'Vêtements': {
                icon: 'fa-tshirt',
                items: [
                    ['Chemise', 8], ['Chemisier', 12], ['Pantalon', 9], ['Veste', 12],
                    ['Manteau', 18], ['Parka', 22], ['Robe Simple', 13], ['Robe de Mariée', 110, 'from'],
                    ['Cuir et Daim', 59, 'from'], ['Doudoune Duvet', 22], ['Imperméable', 17], ['Cravate', 5],
                    ['Écharpe', 7], ['Carré de Soie', 7], ['Jupe Simple', 7], ['Pyjama', 7], ['Peignoir', 8],
                    ['Blouse/Tunique', 5], ['Slip', 2.5], ['Tablier', 3]
                ]
            },
            'Ameublement': {
                icon: 'fa-couch',
                items: [
                    ['Couette', 29], ['Couette Plume', 45], ['Couverture', 19], ['Dessus de Lit', 28],
                    ['Rideaux', 22], ['Tapis', 22, 'm2'], ['Housse de Canapé', 45], ['Housse Chaise', 4.5]
                ]
            },
            'Blanchisserie': {
                icon: 'fa-bed',
                items: [
                    ['Drap', 8], ['Housse de Couette', 13], ["Taie d'Oreiller", 2.5], ['Nappe', 15],
                    ['Serviette de Bain', 5], ['Serviette de Toilette', 3], ['Serviette de Table', 3],
                    ['Gant de Toilette', 1.99]
                ]
            }
        };

        // État de la sélection : nom -> { qty, price, category }
        const selection = {};
        const cards = [];

        const formatEuro = (value) =>
            value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

        const formatNum = (value) =>
            value.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

        // Libellé de quantité et montant d'une ligne, selon le type d'article
        function lineParts(name) {
            const s = selection[name];
            const amountValue = s.qty * s.price;
            if (s.type === 'm2') {
                return { qtyText: formatNum(s.qty) + ' m²', amount: formatEuro(amountValue) };
            }
            const prefix = s.type === 'from' ? 'à partir de ' : '';
            return { qtyText: '×' + s.qty, amount: prefix + formatEuro(amountValue) };
        }

        function hasFromSelected() {
            return Object.keys(selection).some((n) => selection[n].qty > 0 && selection[n].type === 'from');
        }

        // --- Créneaux : mardi (2) et vendredi (5), 18h–20h. On propose les DEUX prochains. ---
        const SLOT_DAYS = { 2: 'Mardi', 5: 'Vendredi' };

        function formatDateFr(d) {
            return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        }

        // Renvoie les `count` prochains créneaux (dates), en ordre chronologique,
        // en ne gardant que ceux dont le début (18h) est encore à venir.
        function upcomingSlots(count) {
            const now = new Date();
            const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const result = [];
            for (let i = 0; result.length < count && i < 90; i++) {
                const d = new Date(base);
                d.setDate(base.getDate() + i);
                if (SLOT_DAYS[d.getDay()]) {
                    const start = new Date(d);
                    start.setHours(18, 0, 0, 0);
                    if (start > now) result.push(d);
                }
            }
            return result;
        }

        const nextSlots = upcomingSlots(2);
        nextSlots.forEach((date, i) => {
            const dayName = SLOT_DAYS[date.getDay()];
            const label = dayName + ' ' + formatDateFr(date) + ', de 18h à 20h';
            const dayEl = document.getElementById('slot' + i + 'Day');
            const dateEl = document.getElementById('slot' + i + 'Date');
            const input = document.getElementById('slot' + i + 'Input');
            if (dayEl) dayEl.textContent = dayName;
            if (dateEl) dateEl.textContent = formatDateFr(date);
            if (input) input.value = label;
        });

        // --- Génération des cartes d'articles ---
        let index = 0;
        Object.keys(ORDER_ARTICLES).forEach((category) => {
            const { icon, items } = ORDER_ARTICLES[category];

            const group = document.createElement('div');
            group.className = 'article-group';
            group.dataset.category = category;

            const title = document.createElement('h5');
            title.className = 'article-group-title';
            title.innerHTML = `<i class="fas ${icon}"></i> ${category}`;
            group.appendChild(title);

            const grid = document.createElement('div');
            grid.className = 'article-grid';

            items.forEach((item) => {
                const name = item[0];
                const price = item[1];
                const type = item[2] || 'piece'; // 'piece' | 'from' | 'm2'
                const id = 'art-' + index++;
                selection[name] = { qty: 0, price: price, category: category, type: type };

                let priceLabel;
                if (type === 'from') priceLabel = 'À partir de ' + formatEuro(price);
                else if (type === 'm2') priceLabel = formatEuro(price) + '/m²';
                else priceLabel = formatEuro(price);

                let qtyControl;
                if (type === 'm2') {
                    qtyControl =
                        `<div class="article-card-qty article-card-m2" aria-hidden="true">` +
                            `<button type="button" class="qty-btn qty-minus" aria-label="Diminuer les m² de ${name}">&minus;</button>` +
                            `<input type="number" class="qty-m2-input" min="0" step="0.5" value="1" inputmode="decimal" aria-label="Nombre de m² de ${name}">` +
                            `<span class="qty-unit">m²</span>` +
                            `<button type="button" class="qty-btn qty-plus" aria-label="Augmenter les m² de ${name}">+</button>` +
                        `</div>`;
                } else {
                    qtyControl =
                        `<div class="article-card-qty" aria-hidden="true">` +
                            `<button type="button" class="qty-btn qty-minus" aria-label="Diminuer la quantité de ${name}">&minus;</button>` +
                            `<span class="qty-value">0</span>` +
                            `<button type="button" class="qty-btn qty-plus" aria-label="Augmenter la quantité de ${name}">+</button>` +
                        `</div>`;
                }

                const card = document.createElement('div');
                card.className = 'article-card' + (type === 'from' ? ' article-from' : '') + (type === 'm2' ? ' article-m2' : '');
                card.dataset.name = name;
                card.dataset.category = category;
                card.dataset.search = name.toLowerCase();
                card.innerHTML =
                    `<input type="checkbox" id="${id}" class="article-check">` +
                    `<label for="${id}" class="article-check-label">` +
                        `<span class="article-check-box"><i class="fas fa-check"></i></span>` +
                        `<span class="article-check-name">${name}</span>` +
                    `</label>` +
                    `<span class="article-card-price">${priceLabel}</span>` +
                    qtyControl;

                const checkbox = card.querySelector('.article-check');
                const qtyBox = card.querySelector('.article-card-qty');

                if (type === 'm2') {
                    const input = card.querySelector('.qty-m2-input');
                    const applyM2 = (v) => {
                        v = (isNaN(v) || v < 0) ? 0 : Math.round(v * 100) / 100;
                        selection[name].qty = v;
                        checkbox.checked = v > 0;
                        card.classList.toggle('selected', v > 0);
                        qtyBox.setAttribute('aria-hidden', v > 0 ? 'false' : 'true');
                        if (document.activeElement !== input) input.value = v > 0 ? v : '';
                        updateSummary();
                    };
                    checkbox.addEventListener('change', () => {
                        applyM2(checkbox.checked ? (selection[name].qty > 0 ? selection[name].qty : 1) : 0);
                    });
                    card.querySelector('.qty-plus').addEventListener('click', () => applyM2((selection[name].qty || 0) + 0.5));
                    card.querySelector('.qty-minus').addEventListener('click', () => applyM2((selection[name].qty || 0) - 0.5));
                    input.addEventListener('input', () => applyM2(parseFloat(input.value.replace(',', '.'))));
                } else {
                    const qtyValue = card.querySelector('.qty-value');
                    const setQty = (q) => {
                        const v = q > 0 ? q : 0;
                        selection[name].qty = v;
                        qtyValue.textContent = v;
                        checkbox.checked = v > 0;
                        card.classList.toggle('selected', v > 0);
                        qtyBox.setAttribute('aria-hidden', v > 0 ? 'false' : 'true');
                        updateSummary();
                    };
                    checkbox.addEventListener('change', () => {
                        setQty(checkbox.checked ? Math.max(1, selection[name].qty) : 0);
                    });
                    card.querySelector('.qty-plus').addEventListener('click', () => setQty(selection[name].qty + 1));
                    card.querySelector('.qty-minus').addEventListener('click', () => setQty(selection[name].qty - 1));
                }

                cards.push({ card, name, category });
                grid.appendChild(card);
            });

            group.appendChild(grid);
            commandeArticlesEl.appendChild(group);
        });

        // --- Filtres par catégorie + recherche ---
        const filterBtns = document.querySelectorAll('.commande-filter');
        const searchInput = document.getElementById('commandeSearch');
        let activeFilter = 'all';

        function applyFilters() {
            const term = (searchInput.value || '').trim().toLowerCase();
            const groups = commandeArticlesEl.querySelectorAll('.article-group');

            cards.forEach(({ card, category }) => {
                const matchCat = activeFilter === 'all' || category === activeFilter;
                const matchTerm = term === '' || card.dataset.search.indexOf(term) !== -1;
                card.style.display = (matchCat && matchTerm) ? '' : 'none';
            });

            groups.forEach((group) => {
                const visible = group.querySelectorAll('.article-card:not([style*="display: none"])').length;
                group.style.display = visible > 0 ? '' : 'none';
            });
        }

        filterBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                filterBtns.forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                activeFilter = btn.dataset.filter;
                applyFilters();
            });
        });
        if (searchInput) searchInput.addEventListener('input', applyFilters);

        // --- Récapitulatif (panier) + total ---
        const summaryList = document.getElementById('summaryList');
        const summaryEmpty = document.getElementById('summaryEmpty');
        const summarySubtotalEl = document.getElementById('summarySubtotal');
        const summaryDeliveryEl = document.getElementById('summaryDelivery');
        const totalEl = document.getElementById('commandeTotal');

        function getSelected() {
            return Object.keys(selection)
                .filter((name) => selection[name].qty > 0)
                .map((name) => ({ name: name, qty: selection[name].qty, price: selection[name].price }));
        }

        function computeSubtotal() {
            return getSelected().reduce((sum, item) => sum + item.qty * item.price, 0);
        }

        function computeDelivery(subtotal) {
            return (subtotal > 0 && subtotal < FREE_THRESHOLD) ? DELIVERY_FEE : 0;
        }

        function updateSummary() {
            const selected = getSelected();

            summaryList.querySelectorAll('.summary-item').forEach((el) => el.remove());

            if (selected.length === 0) {
                summaryEmpty.style.display = '';
            } else {
                summaryEmpty.style.display = 'none';
                selected.forEach((item) => {
                    const parts = lineParts(item.name);
                    const li = document.createElement('li');
                    li.className = 'summary-item';
                    li.innerHTML =
                        `<span class="summary-item-name">${item.name} <span class="summary-item-qty">${parts.qtyText}</span></span>` +
                        `<span class="summary-item-price">${parts.amount}</span>`;
                    summaryList.appendChild(li);
                });
            }

            const subtotal = computeSubtotal();
            const delivery = computeDelivery(subtotal);
            summarySubtotalEl.textContent = formatEuro(subtotal);
            summaryDeliveryEl.textContent = subtotal === 0 ? '—' : (delivery === 0 ? 'Gratuite' : formatEuro(delivery));
            totalEl.textContent = formatEuro(subtotal + delivery);

            const fromNote = document.getElementById('summaryFromNote');
            if (fromNote) fromNote.style.display = hasFromSelected() ? '' : 'none';
        }

        // --- Envoi de la commande (fonction serverless -> email) ---
        const submitBtn = document.getElementById('commandeSubmit');
        const successEl = document.getElementById('commandeSuccess');
        const nameInput = document.getElementById('cmdName');
        const phoneInput = document.getElementById('cmdPhone');
        const emailInput = document.getElementById('cmdEmail');
        const addressInput = document.getElementById('cmdAddress');
        const notesInput = document.getElementById('cmdNotes');
        const websiteInput = document.getElementById('cmdWebsite');

        function markError(input, hasError) {
            const field = input.closest('.commande-field');
            if (field) field.classList.toggle('field-error', hasError);
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                const selected = getSelected();
                if (selected.length === 0) {
                    alert('Veuillez sélectionner au moins un article avant de valider votre commande.');
                    return;
                }

                const slotInput = document.querySelector('#slotOptions input[name="slot"]:checked');
                if (!slotInput || !slotInput.value) {
                    alert('Veuillez choisir un créneau de livraison (mardi ou vendredi).');
                    return;
                }

                const nameOk = nameInput.value.trim() !== '';
                const phoneOk = phoneInput.value.trim() !== '';
                const addressOk = addressInput.value.trim() !== '';
                markError(nameInput, !nameOk);
                markError(phoneInput, !phoneOk);
                markError(addressInput, !addressOk);

                if (!(nameOk && phoneOk && addressOk)) {
                    alert('Merci de renseigner votre nom, votre téléphone et votre adresse de collecte et livraison.');
                    return;
                }

                const subtotal = computeSubtotal();
                const delivery = computeDelivery(subtotal);
                const total = subtotal + delivery;

                const creneau = slotInput.value;

                const data = {
                    nom: nameInput.value.trim(),
                    telephone: phoneInput.value.trim(),
                    email: emailInput.value.trim(),
                    adresse: addressInput.value.trim(),
                    creneau: creneau,
                    notes: notesInput.value.trim(),
                    articles: selected.map((item) => {
                        const parts = lineParts(item.name);
                        return { name: item.name, qtyText: parts.qtyText, lineTotal: parts.amount };
                    }),
                    subtotal: formatEuro(subtotal),
                    delivery: delivery === 0 ? 'Gratuite' : formatEuro(delivery),
                    total: formatEuro(total),
                    website: websiteInput ? websiteInput.value : ''
                };

                const originalHTML = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours…';

                fetch('/.netlify/functions/commande', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                })
                    .then((response) => {
                        if (!response.ok) throw new Error('Statut ' + response.status);
                        if (successEl) {
                            successEl.hidden = false;
                            successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                        submitBtn.style.display = 'none';
                    })
                    .catch(() => {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalHTML;
                        alert("Une erreur est survenue lors de l'envoi de votre commande. Merci de réessayer, ou de nous appeler au 06 51 13 05 37.");
                    });
            });
        }

        // Initialisation
        updateSummary();
    }

    // === FORMULAIRE DE CONTACT ===
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Récupérer les données du formulaire
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                message: document.getElementById('message').value,
                timestamp: new Date().toISOString()
            };

            // Sauvegarder dans localStorage (pour démo)
            let contacts = JSON.parse(localStorage.getItem('pressingContacts') || '[]');
            contacts.push(formData);
            localStorage.setItem('pressingContacts', JSON.stringify(contacts));

            // Afficher un message de succès
            alert('✅ Merci pour votre message ! Nous vous répondrons dans les plus brefs délais.');
            
            // Réinitialiser le formulaire
            contactForm.reset();
        });

        // Validation en temps réel
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(emailInput.value)) {
                    emailInput.style.borderColor = '#EF4444';
                } else {
                    emailInput.style.borderColor = '#10B981';
                }
            });
        }
    }

    // === SMOOTH SCROLL POUR LES ANCRES ===
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            // Ignorer les liens sans target
            if (href === '#' || href === '') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // === EASTER EGG: KONAMI CODE ===
    let konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;

    document.addEventListener('keydown', (e) => {
        if (e.key === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                activateEasterEgg();
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });

    function activateEasterEgg() {
        // Effet confetti
        document.body.style.animation = 'rainbow 2s infinite';
        
        // Message secret
        alert('🎉 Bravo ! Vous avez trouvé le code secret de Lavabio ! 🧥✨\n\n-20% sur votre prochaine visite avec le code: KONAMI2026');
        
        // Réinitialiser après 5 secondes
        setTimeout(() => {
            document.body.style.animation = '';
        }, 5000);
    }

    // === PERFORMANCE MONITORING ===
    if ('PerformanceObserver' in window) {
        const perfObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.duration > 50) {
                    console.warn(`⚠️ Slow operation detected: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
                }
            }
        });

        perfObserver.observe({ entryTypes: ['measure'] });
    }

    // === LAZY LOADING IMAGES ===
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // === CONSOLE SIGNATURE ===
    console.log(
        '%c🧥 Lavabio ',
        'background: linear-gradient(135deg, #0F172A 0%, #3B82F6 100%); color: white; padding: 10px 20px; font-size: 16px; font-weight: bold; border-radius: 10px;'
    );
    console.log(
        '%cSite développé avec ❤️ pour le meilleur pressing de Saint-Cyr-sur-Mer',
        'color: #3B82F6; font-size: 12px;'
    );

    // === LOG FINAL ===
    console.log('✅ JavaScript chargé et initialisé avec succès');
    
    // === EFFET GOUTTE D'EAU AU CLIC ===
    document.addEventListener('click', (e) => {
        const target = e.target.closest('.btn, .nav-link-phone');
        if (target) {
            target.classList.remove('ripple-effect');
            // Force reflow pour relancer l'animation
            void target.offsetWidth;
            target.classList.add('ripple-effect');
            
            setTimeout(() => {
                target.classList.remove('ripple-effect');
            }, 600);
        }
    });
    
})();