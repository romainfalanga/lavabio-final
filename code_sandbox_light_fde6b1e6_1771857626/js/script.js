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

    // === COMMANDE LIVRAISON / CLICK & COLLECT ===
    const commandeArticlesEl = document.getElementById('commandeArticles');

    if (commandeArticlesEl) {
        const PRESSING_EMAIL = 'lavabio.contact@gmail.com';

        // Articles disponibles à la commande (prix fixes uniquement)
        const ORDER_ARTICLES = {
            'Vêtements': {
                icon: 'fa-tshirt',
                items: [
                    ['Chemise', 8], ['Chemisier', 12], ['Pantalon', 9], ['Veste', 12],
                    ['Manteau', 18], ['Parka', 18], ['Robe Simple', 13], ['Robe de Mariée', 50],
                    ['Doudoune Duvet', 14], ['Imperméable', 14], ['Cravate', 5], ['Écharpe', 7],
                    ['Carré de Soie', 7], ['Jupe Simple', 7], ['Pyjama', 7], ['Peignoir', 8],
                    ['Blouse/Tunique', 5], ['Slip', 2.5], ['Tablier', 3]
                ]
            },
            'Ameublement': {
                icon: 'fa-couch',
                items: [
                    ['Couette', 26], ['Couette Plume', 39], ['Couverture', 19], ['Dessus de Lit', 28],
                    ['Rideaux', 22], ['Housse de Canapé', 39], ['Housse Chaise', 3]
                ]
            },
            'Blanchisserie': {
                icon: 'fa-bed',
                items: [
                    ['Drap', 10], ['Housse de Couette', 13], ["Taie d'Oreiller", 2.5], ['Nappe', 10],
                    ['Serviette de Bain', 5], ['Serviette de Toilette', 3], ['Serviette de Table', 3],
                    ['Gant de Toilette', 1.99]
                ]
            }
        };

        // Quantités sélectionnées : nom -> { qty, price }
        const quantities = {};

        const formatEuro = (value) =>
            value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

        // Génération de la liste des articles
        Object.keys(ORDER_ARTICLES).forEach((group) => {
            const { icon, items } = ORDER_ARTICLES[group];

            const title = document.createElement('h4');
            title.className = 'commande-group-title';
            title.innerHTML = `<i class="fas ${icon}"></i> ${group}`;
            commandeArticlesEl.appendChild(title);

            const list = document.createElement('div');
            list.className = 'article-list';

            items.forEach(([name, price]) => {
                quantities[name] = { qty: 0, price: price };

                const row = document.createElement('div');
                row.className = 'article-row';
                row.innerHTML =
                    `<span class="article-name">${name}</span>` +
                    `<span class="article-price">${formatEuro(price)}</span>` +
                    `<div class="qty-stepper">` +
                    `<button type="button" class="qty-btn qty-minus" aria-label="Retirer un ${name}">&minus;</button>` +
                    `<span class="qty-value">0</span>` +
                    `<button type="button" class="qty-btn qty-plus" aria-label="Ajouter un ${name}">+</button>` +
                    `</div>`;

                const valueEl = row.querySelector('.qty-value');

                const updateRow = () => {
                    const q = quantities[name].qty;
                    valueEl.textContent = q;
                    row.classList.toggle('selected', q > 0);
                    updateTotal();
                };

                row.querySelector('.qty-plus').addEventListener('click', () => {
                    quantities[name].qty++;
                    updateRow();
                });
                row.querySelector('.qty-minus').addEventListener('click', () => {
                    if (quantities[name].qty > 0) {
                        quantities[name].qty--;
                        updateRow();
                    }
                });

                list.appendChild(row);
            });

            commandeArticlesEl.appendChild(list);
        });

        // Calcul du total
        const totalEl = document.getElementById('commandeTotal');

        function computeTotal() {
            return Object.values(quantities).reduce((sum, item) => sum + item.qty * item.price, 0);
        }

        function updateTotal() {
            if (totalEl) totalEl.textContent = formatEuro(computeTotal());
        }

        // Mode : afficher/masquer l'adresse selon livraison ou click & collect
        const addressField = document.getElementById('addressField');
        const modeInputs = document.querySelectorAll('#commandeMode input[name="mode"]');

        function getSelectedMode() {
            const checked = document.querySelector('#commandeMode input[name="mode"]:checked');
            return checked ? checked.value : 'Livraison à domicile';
        }

        function isDelivery() {
            return getSelectedMode().indexOf('Livraison') !== -1;
        }

        function updateAddressVisibility() {
            if (addressField) addressField.style.display = isDelivery() ? '' : 'none';
        }

        modeInputs.forEach((input) => input.addEventListener('change', updateAddressVisibility));
        updateAddressVisibility();

        // Envoi de la commande par email (mailto)
        const submitBtn = document.getElementById('commandeSubmit');
        const nameInput = document.getElementById('cmdName');
        const phoneInput = document.getElementById('cmdPhone');
        const emailInput = document.getElementById('cmdEmail');
        const addressInput = document.getElementById('cmdAddress');
        const notesInput = document.getElementById('cmdNotes');

        function markError(input, hasError) {
            const field = input.closest('.commande-field');
            if (field) field.classList.toggle('field-error', hasError);
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                const total = computeTotal();

                // Au moins un article
                const selected = Object.keys(quantities).filter((name) => quantities[name].qty > 0);
                if (selected.length === 0) {
                    alert('Veuillez sélectionner au moins un article avant de valider votre commande.');
                    return;
                }

                // Validation des champs obligatoires
                let valid = true;
                const nameOk = nameInput.value.trim() !== '';
                const phoneOk = phoneInput.value.trim() !== '';
                const addressOk = !isDelivery() || addressInput.value.trim() !== '';

                markError(nameInput, !nameOk);
                markError(phoneInput, !phoneOk);
                markError(addressInput, !addressOk);
                valid = nameOk && phoneOk && addressOk;

                if (!valid) {
                    alert('Merci de renseigner votre nom, votre téléphone' +
                        (isDelivery() ? ' et votre adresse de collecte / livraison.' : '.'));
                    return;
                }

                // Construction du récapitulatif
                const mode = getSelectedMode().replace('&amp;', '&');
                let body = 'Bonjour,\n\n';
                body += 'Je souhaite passer une commande via le site Lavabio.\n\n';
                body += 'MODE : ' + mode + '\n\n';
                body += 'ARTICLES :\n';

                selected.forEach((name) => {
                    const item = quantities[name];
                    body += `- ${name} x${item.qty} : ${formatEuro(item.qty * item.price)}\n`;
                });

                body += '\nTOTAL ESTIMÉ : ' + formatEuro(total) + '\n';
                body += '(Paiement à la livraison, en carte ou en espèces)\n\n';
                body += 'MES COORDONNÉES :\n';
                body += '- Nom : ' + nameInput.value.trim() + '\n';
                body += '- Téléphone : ' + phoneInput.value.trim() + '\n';
                if (emailInput.value.trim() !== '') {
                    body += '- Email : ' + emailInput.value.trim() + '\n';
                }
                if (isDelivery()) {
                    body += '- Adresse de collecte / livraison : ' + addressInput.value.trim() + '\n';
                }
                if (notesInput.value.trim() !== '') {
                    body += '\nInformations complémentaires :\n' + notesInput.value.trim() + '\n';
                }
                body += '\nMerci de me recontacter pour confirmer le créneau.\n';

                const subject = 'Commande ' + mode + ' - ' + nameInput.value.trim() +
                    ' (' + formatEuro(total) + ')';

                const mailtoLink = 'mailto:' + PRESSING_EMAIL +
                    '?subject=' + encodeURIComponent(subject) +
                    '&body=' + encodeURIComponent(body);

                window.location.href = mailtoLink;
            });
        }
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