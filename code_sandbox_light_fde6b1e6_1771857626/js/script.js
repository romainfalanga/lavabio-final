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