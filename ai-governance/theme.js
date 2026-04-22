document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. Inject Premium Dark Mode Toggle
    // ==========================================
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'darkModeToggle';
    toggleBtn.title = "Toggle Light/Dark Mode";
    
    const sidebarInner = document.querySelector('#sidebar > div');
    if (sidebarInner) {
        sidebarInner.appendChild(toggleBtn);
    }

    const body = document.body;

    const updateThemeIcon = () => {
        if (body.classList.contains('dark-mode')) {
            toggleBtn.innerHTML = '<i class="fas fa-sun"></i> <span>Light Mode</span>';
        } else {
            toggleBtn.innerHTML = '<i class="fas fa-moon"></i> <span>Dark Mode</span>';
        }
    };

    // Load saved theme preference
    if (localStorage.getItem('dashboard_theme') === 'dark') {
        body.classList.add('dark-mode');
    }
    updateThemeIcon();

    // Theme toggle with smooth transition
    toggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        
        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('dashboard_theme', 'dark');
        } else {
            localStorage.setItem('dashboard_theme', 'light');
        }
        updateThemeIcon();
    });

    // ==========================================
    // 2. Enhanced Sidebar Navigation
    // ==========================================
    const navLinks = document.querySelectorAll('#sidebar nav a');
    
    // Set first link as active on load
    if (navLinks.length > 0) {
        navLinks[0].classList.add('active-nav-item');
    }

    // Add active state on click
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            navLinks.forEach(l => l.classList.remove('active-nav-item'));
            this.classList.add('active-nav-item');
            
            // Smooth scroll to section
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });

        // Highlight active section on scroll
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(2px)';
        });

        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });

    // ==========================================
    // 3. Smooth Scroll Active State
    // ==========================================
    const observerOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active-nav-item');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active-nav-item');
                    }
                });
            }
        });
    }, observerOptions);

    // Observe all sections
    const sections = document.querySelectorAll('section[id]');
    sections.forEach(section => observer.observe(section));

    // ==========================================
    // 4. Mobile Menu Enhancement
    // ==========================================
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            const isOpen = !sidebar.classList.contains('-translate-x-full');
            sidebar.classList.toggle('-translate-x-full');
            overlay.classList.toggle('hidden');
            
            // Animate menu button
            mobileMenuBtn.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
            if (mobileMenuBtn) mobileMenuBtn.style.transform = 'rotate(0deg)';
        });
    }

    // Close menu on link click
    document.querySelectorAll('#sidebar nav a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 768) {
                sidebar.classList.add('-translate-x-full');
                overlay.classList.add('hidden');
                if (mobileMenuBtn) mobileMenuBtn.style.transform = 'rotate(0deg)';
            }
        });
    });

    // ==========================================
    // 5. Add Ripple Effect to Buttons
    // ==========================================
    const buttons = document.querySelectorAll('button, a[href^="#"]');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');

            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Add ripple styles dynamically
    const style = document.createElement('style');
    style.textContent = `
        button, a { position: relative; overflow: hidden; }
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out;
            pointer-events: none;
        }
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});