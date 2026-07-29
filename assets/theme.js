/**
 * Solaire Theme — theme.js
 * Premium sunglasses / luxury eyewear theme
 * Mobile-first, accessibility-conscious, progressive enhancement
 */
(function () {
  'use strict';

  // ============================================================
  // Core Utilities
  // ============================================================
  var SOLAIRE = window.SOLAIRE || {};

  /**
   * Selector helper
   */
  function qs(selector, context) {
    return (context || document).querySelector(selector);
  }

  function qsa(selector, context) {
    return Array.from((context || document).querySelectorAll(selector));
  }

  /**
   * Debounce utility
   */
  function debounce(fn, delay) {
    var timer;
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(ctx, args);
      }, delay);
    };
  }

  /**
   * Trap focus inside an element for accessibility
   */
  function trapFocus(element) {
    var focusableEls = qsa(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      element
    );
    var firstFocusable = focusableEls[0];
    var lastFocusable = focusableEls[focusableEls.length - 1];

    element.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    });
  }

  // ============================================================
  // Cart Drawer
  // ============================================================
  var CartDrawer = {
    drawer: null,
    overlay: null,
    closeButtons: null,
    toggleButtons: null,
    isOpen: false,

    init: function () {
      this.drawer = qs('#CartDrawer');
      if (!this.drawer) return;

      this.overlay = qs('.cart-drawer__overlay', this.drawer);
      this.closeButtons = qsa('[data-cart-close]');
      this.toggleButtons = qsa('[data-cart-toggle]');

      this.bindEvents();
      trapFocus(this.drawer);
    },

    bindEvents: function () {
      var self = this;

      this.toggleButtons.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          if (self.drawer.getAttribute('aria-hidden') === 'false') {
            self.close();
          } else {
            self.open();
          }
        });
      });

      this.closeButtons.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          self.close();
        });
      });

      if (this.overlay) {
        this.overlay.addEventListener('click', function () {
          self.close();
        });
      }

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && self.drawer.getAttribute('aria-hidden') === 'false') {
          self.close();
        }
      });
    },

    open: function () {
      this.drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      this.isOpen = true;

      // Focus first focusable element
      var firstFocusable = qs('button, a[href]', this.drawer);
      if (firstFocusable) {
        setTimeout(function () {
          firstFocusable.focus();
        }, 100);
      }
    },

    close: function () {
      this.drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      this.isOpen = false;
    }
  };

  // ============================================================
  // Mobile Navigation
  // ============================================================
  var MobileNav = {
    drawer: null,
    overlay: null,
    toggleButtons: null,
    closeButtons: null,

    init: function () {
      this.drawer = qs('#MobileNavDrawer');
      if (!this.drawer) return;

      this.overlay = qs('.mobile-nav-drawer__overlay', this.drawer);
      this.toggleButtons = qsa('[data-mobile-nav-toggle]');
      this.closeButtons = qsa('[data-mobile-nav-close]');

      this.bindEvents();
      trapFocus(this.drawer);
    },

    bindEvents: function () {
      var self = this;

      this.toggleButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var expanded = btn.getAttribute('aria-expanded') === 'true';
          btn.setAttribute('aria-expanded', !expanded);
          if (expanded) {
            self.close();
          } else {
            self.open();
          }
        });
      });

      this.closeButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          self.close();
        });
      });

      if (this.overlay) {
        this.overlay.addEventListener('click', function () {
          self.close();
        });
      }

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && self.drawer.getAttribute('aria-hidden') === 'false') {
          self.close();
        }
      });
    },

    open: function () {
      this.drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      this.toggleButtons.forEach(function (btn) {
        btn.setAttribute('aria-expanded', 'true');
      });

      var firstFocusable = qs('button, a[href]', this.drawer);
      if (firstFocusable) {
        setTimeout(function () {
          firstFocusable.focus();
        }, 100);
      }
    },

    close: function () {
      this.drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      this.toggleButtons.forEach(function (btn) {
        btn.setAttribute('aria-expanded', 'false');
      });
    }
  };

  // ============================================================
  // Search Overlay
  // ============================================================
  var SearchOverlay = {
    overlay: null,
    toggleButtons: null,
    closeButtons: null,
    input: null,

    init: function () {
      this.overlay = qs('#SearchOverlay');
      if (!this.overlay) return;

      this.toggleButtons = qsa('[data-search-toggle]');
      this.closeButtons = qsa('[data-search-close]');
      this.input = qs('.search-overlay__input', this.overlay);

      this.bindEvents();
    },

    bindEvents: function () {
      var self = this;

      this.toggleButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var expanded = btn.getAttribute('aria-expanded') === 'true';
          btn.setAttribute('aria-expanded', !expanded);
          if (expanded) {
            self.close();
          } else {
            self.open();
          }
        });
      });

      this.closeButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          self.close();
        });
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && self.overlay.getAttribute('aria-hidden') === 'false') {
          self.close();
        }
      });
    },

    open: function () {
      this.overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      this.toggleButtons.forEach(function (btn) {
        btn.setAttribute('aria-expanded', 'true');
      });

      if (this.input) {
        setTimeout(function () {
          self.input.focus();
        }, 100);
      }
    },

    close: function () {
      this.overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      this.toggleButtons.forEach(function (btn) {
        btn.setAttribute('aria-expanded', 'false');
      });
    }
  };

  // ============================================================
  // Header Scroll Behavior
  // ============================================================
  var StickyHeader = {
    header: null,
    lastScrollY: 0,
    isHidden: false,

    init: function () {
      this.header = qs('[data-header]');
      if (!this.header) return;

      var stickyStyle = this.header.getAttribute('data-sticky-style');
      if (stickyStyle === 'on_scroll_up') {
        this.bindScroll();
      }
    },

    bindScroll: function () {
      var self = this;

      window.addEventListener(
        'scroll',
        debounce(function () {
          var scrollY = window.scrollY;

          if (scrollY > self.lastScrollY && scrollY > 150 && !self.isHidden) {
            self.header.classList.add('site-header--hidden');
            self.isHidden = true;
          } else if (scrollY < self.lastScrollY && self.isHidden) {
            self.header.classList.remove('site-header--hidden');
            self.isHidden = false;
          }

          self.lastScrollY = scrollY;
        }, 50)
      );
    }
  };

  // ============================================================
  // Announcement Bar Dismiss
  // ============================================================
  var AnnouncementBar = {
    init: function () {
      var self = this;
      var closeButtons = qsa('[data-announcement-close]');

      closeButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var bar = btn.closest('.announcement-bar');
          if (bar) {
            bar.style.display = 'none';
            // Store dismissal in sessionStorage
            try {
              sessionStorage.setItem('solaire_announcement_dismissed', 'true');
            } catch (e) {
              // Storage not available
            }
          }
        });
      });

      // Check if previously dismissed
      try {
        if (sessionStorage.getItem('solaire_announcement_dismissed') === 'true') {
          var bar = qs('.announcement-bar');
          if (bar) bar.style.display = 'none';
        }
      } catch (e) {
        // Storage not available
      }
    }
  };

  // ============================================================
  // Shopify Sections API — Section Loading Support
  // ============================================================
  var ShopifySections = {
    init: function () {
      // Listen for Shopify section events
      document.addEventListener('shopify:section:load', this.onSectionLoad.bind(this));
      document.addEventListener('shopify:section:unload', this.onSectionUnload.bind(this));
      document.addEventListener('shopify:section:select', this.onSectionSelect.bind(this));
      document.addEventListener('shopify:section:deselect', this.onSectionDeselect.bind(this));
      document.addEventListener('shopify:block:select', this.onBlockSelect.bind(this));
      document.addEventListener('shopify:block:deselect', this.onBlockDeselect.bind(this));
    },

    onSectionLoad: function (event) {
      var sectionId = event.detail.sectionId;
      // Re-initialize any section-specific JS here
      console.log('[Solaire] Section loaded:', sectionId);
    },

    onSectionUnload: function (event) {
      var sectionId = event.detail.sectionId;
      console.log('[Solaire] Section unloaded:', sectionId);
    },

    onSectionSelect: function (event) {
      var section = qs('[data-section-id="' + event.detail.sectionId + '"]');
      if (section) {
        section.classList.add('shopify-section--selected');
      }
    },

    onSectionDeselect: function (event) {
      var section = qs('[data-section-id="' + event.detail.sectionId + '"]');
      if (section) {
        section.classList.remove('shopify-section--selected');
      }
    },

    onBlockSelect: function (event) {
      var block = qs('[data-block-id="' + event.detail.blockId + '"]');
      if (block) {
        block.classList.add('shopify-block--selected');
      }
    },

    onBlockDeselect: function (event) {
      var block = qs('[data-block-id="' + event.detail.blockId + '"]');
      if (block) {
        block.classList.remove('shopify-block--selected');
      }
    }
  };

  // ============================================================
  // Hero Banner Carousel
  // ============================================================
  var HeroCarousel = {
    instances: [],

    init: function () {
      var self = this;
      var carousels = qsa('.hero-banner--carousel');

      carousels.forEach(function (el) {
        var instance = self.createInstance(el);
        if (instance) {
          self.instances.push(instance);
        }
      });
    },

    createInstance: function (el) {
      var slides = qsa('.hero-banner__slide', el);
      var dots = qsa('.hero-banner__dot', el);
      var prevBtn = qs('[data-hero-prev]', el);
      var nextBtn = qs('[data-hero-next]', el);
      var pauseBtn = qs('[data-hero-pause]', el);
      var autoplay = el.getAttribute('data-autoplay') === 'true';
      var speed = parseInt(el.getAttribute('data-autoplay-speed'), 10) || 5000;

      if (slides.length < 2) return null;

      var currentIndex = 0;
      var intervalId = null;
      var isPaused = false;

      var instance = {
        el: el,
        slides: slides,
        dots: dots,
        currentIndex: currentIndex,
        goTo: goTo,
        next: next,
        prev: prev,
        pause: pause,
        resume: resume,
        destroy: destroy
      };

      function goTo(index) {
        if (index === currentIndex) return;
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;

        // Deactivate current
        slides[currentIndex].classList.remove('hero-banner__slide--active');
        slides[currentIndex].setAttribute('aria-hidden', 'true');
        if (dots[currentIndex]) {
          dots[currentIndex].classList.remove('hero-banner__dot--active');
          dots[currentIndex].setAttribute('aria-selected', 'false');
        }

        // Activate new
        currentIndex = index;
        slides[currentIndex].classList.add('hero-banner__slide--active');
        slides[currentIndex].setAttribute('aria-hidden', 'false');
        if (dots[currentIndex]) {
          dots[currentIndex].classList.add('hero-banner__dot--active');
          dots[currentIndex].setAttribute('aria-selected', 'true');
        }

        instance.currentIndex = currentIndex;
      }

      function next() {
        goTo(currentIndex + 1);
      }

      function prev() {
        goTo(currentIndex - 1);
      }

      function pause() {
        isPaused = true;
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        if (pauseBtn) {
          pauseBtn.setAttribute('aria-label', pauseBtn.getAttribute('aria-label').replace('Pause', 'Play'));
        }
      }

      function resume() {
        isPaused = false;
        if (autoplay && !intervalId) {
          intervalId = setInterval(next, speed);
        }
        if (pauseBtn) {
          pauseBtn.setAttribute('aria-label', pauseBtn.getAttribute('aria-label').replace('Play', 'Pause'));
        }
      }

      function destroy() {
        if (intervalId) clearInterval(intervalId);
      }

      // Event listeners
      if (prevBtn) prevBtn.addEventListener('click', prev);
      if (nextBtn) nextBtn.addEventListener('click', next);

      if (dots.length) {
        dots.forEach(function (dot, i) {
          dot.addEventListener('click', function () {
            goTo(i);
          });
        });
      }

      if (pauseBtn) {
        pauseBtn.addEventListener('click', function () {
          if (isPaused) {
            resume();
          } else {
            pause();
          }
        });
      }

      // Pause on hover
      el.addEventListener('mouseenter', function () {
        if (autoplay && !isPaused) {
          clearInterval(intervalId);
          intervalId = null;
        }
      });

      el.addEventListener('mouseleave', function () {
        if (autoplay && !isPaused && !intervalId) {
          intervalId = setInterval(next, speed);
        }
      });

      // Touch/swipe support
      var touchStartX = 0;
      var touchEndX = 0;

      el.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      el.addEventListener('touchend', function (e) {
        touchEndX = e.changedTouches[0].screenX;
        var diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
          if (diff > 0) {
            next();
          } else {
            prev();
          }
        }
      }, { passive: true });

      // Keyboard navigation
      el.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          prev();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          next();
        }
      });

      // Autoplay
      if (autoplay) {
        intervalId = setInterval(next, speed);
      }

      return instance;
    }
  };

  // ============================================================
  // Scroll-triggered animations (Intersection Observer)
  // ============================================================
  var ScrollReveal = {
    observer: null,

    init: function () {
      if (!('IntersectionObserver' in window)) return;

      var self = this;
      this.observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-revealed');
              self.observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.15,
          rootMargin: '0px 0px -40px 0px'
        }
      );

      var elements = qsa('[data-reveal]');
      elements.forEach(function (el) {
        self.observer.observe(el);
      });
    }
  };

  // ============================================================
  // Initialize Everything on DOM Ready
  // ============================================================
  function init() {
    CartDrawer.init();
    MobileNav.init();
    SearchOverlay.init();
    StickyHeader.init();
    AnnouncementBar.init();
    ShopifySections.init();
    HeroCarousel.init();
    ScrollReveal.init();

    // Expose for external use
    window.SOLAIRE = SOLAIRE;
    SOLAIRE.cartDrawer = CartDrawer;
    SOLAIRE.mobileNav = MobileNav;
    SOLAIRE.searchOverlay = SearchOverlay;
    SOLAIRE.heroCarousel = HeroCarousel;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
