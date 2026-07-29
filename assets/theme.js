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
  // Product Page — Image Gallery
  // ============================================================
  var ProductGallery = {
    init: function () {
      var self = this;
      var galleries = qsa('.main-product');

      galleries.forEach(function (el) {
        self.initInstance(el);
      });
    },

    initInstance: function (container) {
      var primaryMedia = qs('.main-product__primary-media', container);
      var featuredImage = qs('.main-product__featured-image, .image-zoom__main', container);
      var zoomContainer = qs('.image-zoom', container);
      var thumbnails = qsa('[data-thumbnail]', container);
      var dots = qsa('[data-dot]', container);
      var variantSelect = qs('[data-variant-select]', container);
      var swatchInputs = qsa('.variant-swatches__input', container);
      var optionSelects = qsa('[data-option-select]', container);
      var optionLabels = qsa('[data-option-label]', container);

      // --- Thumbnail Click ---
      thumbnails.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var mediaId = btn.getAttribute('data-media-id');
          var mediaPosition = parseInt(btn.getAttribute('data-media-position'), 10);
          self.switchMedia(container, mediaId, mediaPosition);
        });
      });

      // --- Dot Click ---
      dots.forEach(function (dot) {
        dot.addEventListener('click', function () {
          var mediaId = dot.getAttribute('data-media-id');
          var idx = dots.indexOf(dot);
          self.switchMedia(container, mediaId, idx + 1);
        });
      });

      // --- Variant Swatch Input Change ---
      swatchInputs.forEach(function (input) {
        input.addEventListener('change', function () {
          self.onVariantChange(container);
        });
      });

      // --- Option Select Change ---
      optionSelects.forEach(function (select) {
        select.addEventListener('change', function () {
          var optionIndex = parseInt(select.getAttribute('data-option-index'), 10);
          var value = select.value;

          // Update the option label display
          if (optionLabels && optionLabels.length > optionIndex) {
            optionLabels[optionIndex].textContent = value;
          }

          // Update swatch selection if present
          var swatchInput = qs(
            '.variant-swatches__input[value="' + CSS.escape(value) + '"]',
            container
          );
          if (swatchInput && !swatchInput.checked) {
            swatchInput.checked = true;
            self.updateSwatchStates(container, swatchInput);
          }

          self.onVariantChange(container);
        });
      });

      // --- Touch Swipe for Mobile Gallery ---
      self.initMobileSwipe(container);
    },

    switchMedia: function (container, mediaId, position) {
      var featuredImage = qs('.main-product__featured-image, .image-zoom__main', container);
      var zoomContainer = qs('.image-zoom', container);
      var variantSelect = qs('[data-variant-select]', container);

      // Update thumbnails
      var thumbnails = qsa('[data-thumbnail]', container);
      thumbnails.forEach(function (btn) {
        var isActive = btn.getAttribute('data-media-id') === mediaId;
        btn.classList.toggle('main-product__thumbnail--active', isActive);
        if (isActive) {
          btn.setAttribute('aria-current', 'true');
        } else {
          btn.removeAttribute('aria-current');
        }
      });

      // Update dots
      var dots = qsa('[data-dot]', container);
      dots.forEach(function (dot, i) {
        var isActive = i + 1 === position || dot.getAttribute('data-media-id') === mediaId;
        dot.classList.toggle('main-product__dot--active', isActive);
        if (isActive) {
          dot.setAttribute('aria-current', 'true');
        } else {
          dot.removeAttribute('aria-current');
        }
      });

      // Update the featured image
      var selectedOption = variantSelect ? variantSelect.options[variantSelect.selectedIndex] : null;
      if (selectedOption) {
        var newImageSrc = selectedOption.getAttribute('data-image');
        var newMediaId = selectedOption.getAttribute('data-media-id');
        if (newImageSrc && featuredImage) {
          featuredImage.src = newImageSrc;
          featuredImage.srcset = featuredImage.getAttribute('srcset') || newImageSrc;
        }
        // Update zoom lens image
        if (zoomContainer) {
          var lensImg = qs('.image-zoom__lens-image', zoomContainer);
          if (lensImg && newImageSrc) {
            lensImg.src = newImageSrc;
          }
        }
      }
    },

    onVariantChange: function (container) {
      var variantSelect = qs('[data-variant-select]', container);
      if (!variantSelect) return;

      // Find matching variant from current selections
      var swatchInputs = qsa('.variant-swatches__input:checked', container);
      var optionSelects = qsa('[data-option-select]', container);

      var selectedOptions = [];
      swatchInputs.forEach(function (input) {
        selectedOptions.push(input.value);
      });
      optionSelects.forEach(function (select) {
        var idx = parseInt(select.getAttribute('data-option-index'), 10);
        if (selectedOptions.length <= idx) {
          selectedOptions.push(select.value);
        } else {
          selectedOptions[idx] = select.value;
        }
      });

      if (selectedOptions.length === 0) return;

      // Find matching option in the variant select
      var options = variantSelect.options;
      for (var i = 0; i < options.length; i++) {
        var opt = options[i];
        if (!opt.disabled && opt.text.indexOf(selectedOptions.join(' / ')) === 0) {
          if (variantSelect.selectedIndex !== i) {
            variantSelect.selectedIndex = i;
            variantSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
          break;
        }
      }

      // Update UI: price, image, available state
      self.updateProductUI(container);
    },

    updateProductUI: function (container) {
      var variantSelect = qs('[data-variant-select]', container);
      if (!variantSelect || variantSelect.selectedIndex < 0) return;

      var selectedOption = variantSelect.options[variantSelect.selectedIndex];
      var isAvailable = selectedOption.getAttribute('data-available') === 'true';
      var newPrice = selectedOption.getAttribute('data-price');
      var newComparePrice = selectedOption.getAttribute('data-compare-price');
      var newSku = selectedOption.getAttribute('data-sku');
      var newImageSrc = selectedOption.getAttribute('data-image');
      var newMediaId = selectedOption.getAttribute('data-media-id');

      // Update price
      var priceEl = qs('.main-product__price .price', container);
      if (priceEl && newPrice) {
        // Shopify handles this via AJAX; simplified for now
        // In a real theme, this would use the Shopify API
      }

      // Update SKU
      var skuEl = qs('[data-sku]', container);
      if (skuEl && newSku) {
        skuEl.textContent = newSku;
      }

      // Update ATC button
      var atcBtn = qs('[data-add-to-cart]', container);
      var atcText = qs('[data-atc-text]', container);
      var atcPrice = qs('[data-atc-price]', container);
      var productIdInput = qs('[data-product-id-input]', container);

      if (atcBtn) {
        if (isAvailable) {
          atcBtn.disabled = false;
          atcBtn.classList.remove('btn--accent--disabled');
        } else {
          atcBtn.disabled = true;
        }
      }

      if (productIdInput) {
        productIdInput.value = selectedOption.value;
      }

      // Update swatch states (disabled/unavailable)
      this.updateSwatchDisabledStates(container, variantSelect);
    },

    updateSwatchStates: function (container, activeInput) {
      var swatchLabels = qsa('.variant-swatches__label', container);
      swatchLabels.forEach(function (label) {
        var input = qs('.variant-swatches__input', label);
        if (input) {
          label.classList.toggle('variant-swatches__label--selected', input.checked);
        }
      });
    },

    updateSwatchDisabledStates: function (container, variantSelect) {
      if (!variantSelect) return;

      var swatchInputs = qsa('.variant-swatches__input', container);
      var availableValues = {};
      for (var i = 0; i < variantSelect.options.length; i++) {
        if (variantSelect.options[i].getAttribute('data-available') === 'true') {
          // Extract option values from the variant title
          var values = variantSelect.options[i].text.split(' / ');
          values.forEach(function (v, idx) {
            v = v.trim();
            if (availableValues[idx]) {
              availableValues[idx].push(v);
            } else {
              availableValues[idx] = [v];
            }
          });
        }
      }

      swatchInputs.forEach(function (input) {
        var label = input.closest('.variant-swatches__label');
        if (label) {
          var optionIndex = parseInt(
            (label.closest('[data-option-index]') || {}).getAttribute('data-option-index') || '0',
            10
          );
          var value = input.value.trim();
          var avail = availableValues[optionIndex] || [];
          var isAvail = avail.indexOf(value) !== -1;

          if (!isAvail && !input.checked) {
            label.classList.add('variant-swatches__label--disabled');
            input.disabled = true;
          } else {
            label.classList.remove('variant-swatches__label--disabled');
            input.disabled = false;
          }
        }
      });
    },

    initMobileSwipe: function (container) {
      var startX = 0;
      var endX = 0;
      var gallery = qs('.main-product__gallery', container);

      if (!gallery) return;

      gallery.addEventListener('touchstart', function (e) {
        startX = e.changedTouches[0].screenX;
      }, { passive: true });

      gallery.addEventListener('touchend', function (e) {
        endX = e.changedTouches[0].screenX;
        var diff = startX - endX;

        if (Math.abs(diff) > 50 && window.innerWidth < 768) {
          var dots = qsa('[data-dot]', container);
          var activeDot = qs('.main-product__dot--active', container);
          var currentIndex = dots.indexOf(activeDot);

          if (diff > 0 && currentIndex < dots.length - 1) {
            // Swipe left — next
            var nextDot = dots[currentIndex + 1];
            nextDot.click();
          } else if (diff < 0 && currentIndex > 0) {
            // Swipe right — previous
            var prevDot = dots[currentIndex - 1];
            prevDot.click();
          }
        }
      }, { passive: true });
    }
  };

  // ============================================================
  // Image Zoom
  // ============================================================
  var ImageZoom = {
    init: function () {
      var self = this;
      var zoomContainers = qsa('.image-zoom[data-zoom-enabled="true"]');

      zoomContainers.forEach(function (el) {
        self.initInstance(el);
      });
    },

    initInstance: function (zoomEl) {
      var lens = qs('.image-zoom__lens', zoomEl);
      var lensImg = qs('.image-zoom__lens-image', lens);
      var mainImg = qs('.image-zoom__main', zoomEl);

      if (!lens || !mainImg) return;

      // Skip on touch devices
      if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

      zoomEl.addEventListener('mouseenter', function () {
        zoomEl.classList.add('image-zoom--active');
      });

      zoomEl.addEventListener('mouseleave', function () {
        zoomEl.classList.remove('image-zoom--active');
      });

      zoomEl.addEventListener('mousemove', function (e) {
        var rect = zoomEl.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        // Lens position
        var lensW = lens.offsetWidth / 2;
        var lensH = lens.offsetHeight / 2;
        lens.style.left = x + 'px';
        lens.style.top = y + 'px';

        // Lens image position (4x zoom)
        if (lensImg) {
          var imgW = mainImg.naturalWidth || mainImg.offsetWidth;
          var imgH = mainImg.naturalHeight || mainImg.offsetHeight;
          var scaleX = imgW / rect.width;
          var scaleY = imgH / rect.height;

          lensImg.style.left = '-' + (x * scaleX * 4 - lensW) + 'px';
          lensImg.style.top = '-' + (y * scaleY * 4 - lensH) + 'px';
        }
      });
    }
  };

  // ============================================================
  // Quantity Selector
  // ============================================================
  var QuantitySelector = {
    init: function () {
      var self = this;
      var containers = qsa('.main-product__quantity-controls');

      containers.forEach(function (el) {
        var decreaseBtn = qs('[data-quantity-decrease]', el);
        var increaseBtn = qs('[data-quantity-increase]', el);
        var input = qs('[data-quantity-input]', el);

        if (decreaseBtn) {
          decreaseBtn.addEventListener('click', function () {
            var val = parseInt(input.value, 10) || 1;
            if (val > 1) {
              input.value = val - 1;
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });
        }

        if (increaseBtn) {
          increaseBtn.addEventListener('click', function () {
            var val = parseInt(input.value, 10) || 0;
            var max = parseInt(input.getAttribute('max'), 10) || 999;
            if (val < max) {
              input.value = val + 1;
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });
        }
      });
    }
  };

  // ============================================================
  // Product Accordions
  // ============================================================
  var ProductAccordions = {
    init: function () {
      var self = this;
      var toggles = qsa('[data-accordion-toggle]');

      toggles.forEach(function (toggle) {
        toggle.addEventListener('click', function () {
          var contentId = toggle.getAttribute('aria-controls');
          var content = document.getElementById(contentId);
          var isExpanded = toggle.getAttribute('aria-expanded') === 'true';

          toggle.setAttribute('aria-expanded', !isExpanded);

          if (content) {
            if (isExpanded) {
              content.setAttribute('hidden', '');
            } else {
              content.removeAttribute('hidden');
            }
          }
        });
      });
    }
  };

  // ============================================================
  // Add to Cart Handler
  // ============================================================
  var AddToCart = {
    init: function () {
      var self = this;
      var forms = qsa('.main-product__form');

      forms.forEach(function (form) {
        form.addEventListener('submit', function (e) {
          var atcBtn = qs('[data-add-to-cart]', form.closest('.main-product'));
          if (atcBtn && !atcBtn.disabled) {
            atcBtn.classList.add('main-product__atc--loading');
            // Let the form submit normally — Shopify handles the AJAX
            // The spinner provides visual feedback during submission
          }
        });
      });
    }
  };

  // ============================================================
  // Sticky Product Details
  // ============================================================
  var StickyDetails = {
    init: function () {
      var self = this;
      var details = qsa('[data-product-details]');

      details.forEach(function (el) {
        var container = el.closest('.main-product');
        if (!container) return;

        var isSticky = container.getAttribute('data-sticky-details') === 'true';
        if (isSticky && window.innerWidth >= 768) {
          el.classList.add('main-product__details--sticky');
        }

        // Re-check on resize
        window.addEventListener('resize', function () {
          if (isSticky && window.innerWidth >= 768) {
            el.classList.add('main-product__details--sticky');
          } else {
            el.classList.remove('main-product__details--sticky');
          }
        });
      });
    }
  };

  // ============================================================
  // Copy Link (Share)
  // ============================================================
  var CopyLink = {
    init: function () {
      var self = this;
      var buttons = qsa('[data-copy-link]');

      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var url = window.location.href;
          navigator.clipboard.writeText(url).then(function () {
            var message = qs('[data-copied-message]', btn.closest('.main-product__share'));
            if (message) {
              message.removeAttribute('hidden');
              setTimeout(function () {
                message.setAttribute('hidden', '');
              }, 2000);
            }
          }).catch(function () {
            // Fallback
            var textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);

            var message = qs('[data-copied-message]', btn.closest('.main-product__share'));
            if (message) {
              message.removeAttribute('hidden');
              setTimeout(function () {
                message.setAttribute('hidden', '');
              }, 2000);
            }
          });
        });
      });
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
    ProductGallery.init();
    ImageZoom.init();
    QuantitySelector.init();
    ProductAccordions.init();
    AddToCart.init();
    StickyDetails.init();
    CopyLink.init();

    // Expose for external use
    window.SOLAIRE = SOLAIRE;
    SOLAIRE.cartDrawer = CartDrawer;
    SOLAIRE.mobileNav = MobileNav;
    SOLAIRE.searchOverlay = SearchOverlay;
    SOLAIRE.heroCarousel = HeroCarousel;
    SOLAIRE.productGallery = ProductGallery;
    SOLAIRE.imageZoom = ImageZoom;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
