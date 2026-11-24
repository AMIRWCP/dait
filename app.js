(() => {
  'use strict';

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileHeroQuery = window.matchMedia('(max-width: 639px)');
  let reduceMotion = motionQuery.matches;
  document.documentElement.classList.add('js');
  document.documentElement.lang = 'en';
  document.documentElement.dir = 'ltr';

  document.addEventListener('DOMContentLoaded', () => {
    /* Header scroll state and page progress */
    const header = $('#header');
    const progress = $('#progress');
    const toTop = $('#toTop');
    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle('scrolled', y > 24);
      toTop.classList.toggle('show', y > 640);
      const max = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      progress.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

    /* Mobile navigation */
    const navButton = $('#navBtn');
    const drawer = $('#drawer');
    const drawerClose = $('#drawerClose');
    let drawerOpen = false;
    const openDrawer = () => {
      drawerOpen = true;
      drawer.classList.add('open');
      navButton.setAttribute('aria-expanded', 'true');
      document.body.classList.add('lock');
      drawerClose.focus();
    };
    const closeDrawer = () => {
      if (!drawerOpen) return;
      drawerOpen = false;
      drawer.classList.remove('open');
      navButton.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('lock');
    };
    navButton.addEventListener('click', openDrawer);
    drawerClose.addEventListener('click', () => { closeDrawer(); navButton.focus(); });
    $$('#drawer a').forEach(link => link.addEventListener('click', closeDrawer));

    /* Hero image carousel */
    const heroSlides = $$('[data-hero-slide]');
    const heroDots = $$('[data-hero-dot]');
    const heroSlider = $('.hero-slider');
    const heroCaptionTail = $('.chip1 span').lastChild;
    const slideInfo = [
      { course: 'Scallop Course', alt: 'Seared scallops presented under a glass cloche' },
      { course: 'Truffle Risotto', alt: 'Black truffle risotto finished with shaved truffle' },
      { course: 'Duck à l\'Orange', alt: 'Roasted duck breast with blackberry sauce' },
      { course: 'Seared Fish', alt: 'Seared fish served with golden risotto' }
    ];
    let heroIndex = 0;
    let heroTimer = null;
    let sliderPaused = false;
    const renderHeroSlide = index => {
      if (!heroSlides.length) return;
      heroIndex = (index + heroSlides.length) % heroSlides.length;
      heroSlides.forEach((slide, i) => {
        const active = i === heroIndex;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        const mobileFiletAlt = i === 0 && mobileHeroQuery.matches
          ? 'Seared filet mignon with roasted vegetables on a dark plate'
          : slideInfo[i].alt;
        slide.alt = active ? mobileFiletAlt : '';
      });
      heroDots.forEach((dot, i) => {
        const active = i === heroIndex;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-pressed', String(active));
      });
      const activeCourse = heroIndex === 0 && mobileHeroQuery.matches ? 'Filet Mignon' : slideInfo[heroIndex].course;
      if (heroCaptionTail) heroCaptionTail.nodeValue = ` — ${activeCourse}`;
    };
    const stopHeroTimer = () => {
      window.clearInterval(heroTimer);
      heroTimer = null;
    };
    const startHeroTimer = () => {
      stopHeroTimer();
      if (reduceMotion || sliderPaused || document.hidden || heroSlides.length < 2) return;
      heroTimer = window.setInterval(() => renderHeroSlide(heroIndex + 1), 3000);
    };
    $('[data-hero-prev]').addEventListener('click', () => { renderHeroSlide(heroIndex - 1); startHeroTimer(); });
    $('[data-hero-next]').addEventListener('click', () => { renderHeroSlide(heroIndex + 1); startHeroTimer(); });
    heroDots.forEach((dot, index) => dot.addEventListener('click', () => {
      renderHeroSlide(index);
      startHeroTimer();
    }));
    if (mobileHeroQuery.addEventListener) mobileHeroQuery.addEventListener('change', () => renderHeroSlide(heroIndex));
    else mobileHeroQuery.addListener(() => renderHeroSlide(heroIndex));
    heroSlider.addEventListener('mouseenter', () => { sliderPaused = true; stopHeroTimer(); });
    heroSlider.addEventListener('mouseleave', () => { sliderPaused = false; startHeroTimer(); });
    heroSlider.addEventListener('focusin', () => { sliderPaused = true; stopHeroTimer(); });
    heroSlider.addEventListener('focusout', event => {
      if (!heroSlider.contains(event.relatedTarget)) {
        sliderPaused = false;
        startHeroTimer();
      }
    });
    document.addEventListener('visibilitychange', startHeroTimer);
    const updateMotionPreference = event => {
      reduceMotion = event.matches;
      startHeroTimer();
    };
    if (motionQuery.addEventListener) motionQuery.addEventListener('change', updateMotionPreference);
    else motionQuery.addListener(updateMotionPreference);
    renderHeroSlide(0);
    startHeroTimer();

    /* Add an accessible duplicate for the desktop gallery loop */
    const galleryTrack = $('.gallery-track');
    const gallerySource = $('.gallery-set');
    if (galleryTrack && gallerySource) {
      const duplicate = gallerySource.cloneNode(true);
      duplicate.classList.add('gallery-set--duplicate');
      duplicate.setAttribute('aria-hidden', 'true');
      duplicate.inert = true;
      duplicate.querySelectorAll('.rv').forEach(item => item.classList.remove('rv', 'in'));
      duplicate.querySelectorAll('button').forEach(button => {
        button.removeAttribute('data-i');
        button.tabIndex = -1;
      });
      duplicate.querySelectorAll('img').forEach(image => { image.alt = ''; });
      galleryTrack.append(duplicate);
    }

    /* Reveal sections as they enter view */
    const revealItems = $$('.rv');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach(item => item.classList.add('in'));
    } else {
      const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      revealItems.forEach(item => revealObserver.observe(item));
    }

    /* Desktop navigation scroll spy */
    const navLinks = $$('.nav a');
    if ('IntersectionObserver' in window && navLinks.length) {
      const sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const current = `#${entry.target.id}`;
            navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === current));
          }
        });
      }, { rootMargin: '-40% 0px -55% 0px' });
      $$('section[id], footer#contact').forEach(section => sectionObserver.observe(section));
    }

    /* Dialogs and focus management */
    let openDialog = null;
    let lastFocus = null;
    const openModal = (id, opener) => {
      closeDrawer();
      const dialog = document.getElementById(id);
      if (!dialog) return;
      lastFocus = opener || document.activeElement;
      dialog.classList.add('show');
      document.body.classList.add('lock');
      openDialog = dialog;
      const firstControl = dialog.querySelector('[data-autofocus]') || dialog.querySelector('.modal-close');
      if (firstControl) window.setTimeout(() => firstControl.focus(), 80);
    };
    const closeModal = () => {
      if (!openDialog) return;
      openDialog.classList.remove('show');
      document.body.classList.remove('lock');
      openDialog = null;
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
      lastFocus = null;
    };
    document.addEventListener('click', event => {
      const opener = event.target.closest('[data-open]');
      if (opener) {
        event.preventDefault();
        openModal(opener.dataset.open, opener);
        if (opener.dataset.flash) window.setTimeout(() => flashDish(opener.dataset.flash), 280);
        return;
      }
      if (event.target.closest('[data-close]')) {
        closeModal();
        return;
      }
      if (openDialog && event.target === openDialog) closeModal();
    });

    /* Sample menu search and filters */
    const menuItems = [
      { category: 'Starter', name: 'Golden Beet Carpaccio', description: 'Goat-cheese mousse, candied walnuts, aged balsamic.', price: 18 },
      { category: 'Starter', name: 'Seared Scallops', description: 'Cauliflower velouté, brown butter, oscietra caviar.', price: 24 },
      { category: 'Starter', name: 'Foie Gras Torchon', description: 'Toasted brioche, fig compote, port reduction.', price: 26 },
      { category: 'Main', name: 'Wagyu Tenderloin', description: 'A5 wagyu, smoked jus, black garlic and jus gras pearls.', price: 68 },
      { category: 'Main', name: 'Lobster Thermidor', description: 'Butter-poached tail, gruyère gratin, tarragon cream.', price: 54 },
      { category: 'Main', name: 'Herb-Crusted Salmon', description: 'Atlantic salmon, lemon beurre blanc, garden dill.', price: 38 },
      { category: 'Main', name: 'Truffle Risotto', description: 'Carnaroli rice, black truffle, parmigiano, chive oil.', price: 34 },
      { category: 'Main', name: "Duck à l'Orange", description: 'Confit leg, charred orange, grand marnier jus.', price: 46 },
      { category: 'Dessert', name: 'Belgian Chocolate Dome', description: '70% ganache, 24k gold leaf, raspberry coulis.', price: 24 },
      { category: 'Dessert', name: 'Crème Brûlée', description: 'Tahitian vanilla custard, caramelized sugar crust.', price: 16 },
      { category: 'Dessert', name: 'Pistachio Mille-Feuille', description: 'Caramelized puff, pistachio crème mousseline.', price: 19 },
      { category: 'Drink', name: 'Bintch Signature Cocktail', description: 'Aged rum, saffron honey, citrus oils.', price: 21 },
      { category: 'Drink', name: "Sommelier's Wine Pairing", description: 'Five pours curated for the tasting menu.', price: 95 }
    ];
    let menuQuery = '';
    let menuCategory = 'all';
    const menuList = $('#menuList');
    const menuEmpty = $('#menuEmpty');
    const menuSearch = $('#menuSearch');
    const categoryButtons = $$('.chip-btn');
    const renderMenu = () => {
      const query = menuQuery.trim().toLocaleLowerCase('en-US');
      const matches = menuItems.filter(item =>
        (menuCategory === 'all' || item.category === menuCategory) &&
        (!query || `${item.name} ${item.description}`.toLocaleLowerCase('en-US').includes(query)));
      menuEmpty.hidden = matches.length > 0;
      menuList.innerHTML = matches.map(item => `
        <article class="mi">
          <div class="mi-top"><span class="mi-cat">${item.category}</span><span class="mi-price">$${item.price}</span></div>
          <h4>${item.name}</h4><p>${item.description}</p>
        </article>`).join('');
    };
    menuSearch.addEventListener('input', () => { menuQuery = menuSearch.value; renderMenu(); });
    categoryButtons.forEach(button => button.addEventListener('click', () => {
      menuCategory = button.dataset.cat;
      categoryButtons.forEach(item => item.classList.toggle('is-on', item === button));
      renderMenu();
    }));
    let flashTimer = null;
    const flashDish = name => {
      menuQuery = '';
      menuCategory = 'all';
      menuSearch.value = '';
      categoryButtons.forEach(button => button.classList.toggle('is-on', button.dataset.cat === 'all'));
      renderMenu();
      const item = $$('.mi').find(row => $('h4', row).textContent === name);
      if (!item) return;
      item.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
      item.classList.add('is-flash');
      window.clearTimeout(flashTimer);
      flashTimer = window.setTimeout(() => item.classList.remove('is-flash'), 1700);
    };
    renderMenu();

    /* Local-only reservation form preview */
    const form = $('#resForm');
    const success = $('#resSuccess');
    const dateInput = $('#fDate');
    const today = new Date();
    dateInput.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const setInvalid = (input, invalid) => {
      input.closest('.field').classList.toggle('invalid', invalid);
      if (invalid) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    };
    ['fName', 'fPhone', 'fGuests', 'fDate', 'fTime'].forEach(id => {
      const input = document.getElementById(id);
      input.addEventListener('input', () => setInvalid(input, false));
      input.addEventListener('change', () => setInvalid(input, false));
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const name = $('#fName').value.trim();
      const phone = $('#fPhone').value.trim();
      const guests = $('#fGuests').value;
      const date = dateInput.value;
      const time = $('#fTime').value;
      let firstInvalid = null;
      const check = (input, valid) => {
        setInvalid(input, !valid);
        if (!valid && !firstInvalid) firstInvalid = input;
      };
      check($('#fName'), name.length >= 2);
      check($('#fPhone'), /^[+\d][\d\s\-()]{6,}$/.test(phone));
      check($('#fGuests'), Boolean(guests));
      check(dateInput, Boolean(date) && date >= dateInput.min);
      check($('#fTime'), Boolean(time));
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }
      $('#sName').textContent = name;
      $('#sGuests').textContent = guests === '9+' ? 'Private event' : `${guests} ${guests === '1' ? 'Guest' : 'Guests'}`;
      $('#sDate').textContent = new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      });
      $('#sTime').textContent = time;
      form.hidden = true;
      success.hidden = false;
      $('h3', success).focus();
    });
    $('#resAgain').addEventListener('click', () => {
      success.hidden = true;
      form.hidden = false;
      form.reset();
      $$('.field.invalid', form).forEach(field => field.classList.remove('invalid'));
      $$('[aria-invalid="true"]', form).forEach(input => input.removeAttribute('aria-invalid'));
      $('#fName').focus();
    });

    /* Gallery lightbox */
    const galleryItems = [
      { src: '../public/images/restaurant/sommelier-wine-pour.jpg', alt: 'Sommelier pouring red wine into a glass', title: 'Cellar & Pour', caption: 'Wine service in the heart of the cellar' },
      { src: '../public/images/restaurant/candlelit-table.jpg', alt: 'Candlelit table set for evening service', title: 'The Table', caption: 'A candlelit table prepared for dinner' },
      { src: '../public/images/restaurant/chef-torch-dessert.jpg', alt: 'Chef torching a plated dessert', title: 'The Finishing Touch', caption: 'A chef caramelizes a dessert at the pass' },
      { src: '../public/images/restaurant/caviar-spoon.jpg', alt: 'Caviar and herbs served on a porcelain spoon', title: 'Caviar Service', caption: 'A spoon of caviar with delicate garnishes' },
      { src: '../public/images/restaurant/lemon-meringue-tart.jpg', alt: 'Lemon meringue tart topped with edible flowers', title: 'Citrus Tart', caption: 'A lemon tart finished with flowers' },
      { src: '../public/images/restaurant/chocolate-fondant.jpg', alt: 'Chocolate fondant with vanilla ice cream and raspberries', title: 'Chocolate Fondant', caption: 'Warm chocolate with berries and vanilla' }
    ];
    const lightboxStage = $('#lbStage');
    const lightboxTitle = $('#lbTitle');
    const lightboxCaption = $('#lbSub');
    const lightboxCount = $('#lbCount');
    let lightboxIndex = 0;
    const renderLightbox = () => {
      const item = galleryItems[lightboxIndex];
      lightboxStage.innerHTML = `<img src="${item.src}" alt="${item.alt}" decoding="async">`;
      lightboxTitle.textContent = item.title;
      lightboxCaption.textContent = item.caption;
      lightboxCount.textContent = `${lightboxIndex + 1} / ${galleryItems.length}`;
    };
    const openLightbox = index => {
      lightboxIndex = index;
      renderLightbox();
      const opener = document.querySelector(`.gallery-set:not(.gallery-set--duplicate) .g-tile[data-i="${index}"]`);
      openModal('m-light', opener);
    };
    const moveLightbox = step => {
      lightboxIndex = (lightboxIndex + step + galleryItems.length) % galleryItems.length;
      renderLightbox();
    };
    $$('.gallery-set:not(.gallery-set--duplicate) .g-tile').forEach(tile => {
      tile.addEventListener('click', () => openLightbox(Number(tile.dataset.i)));
    });
    $('#lbPrev').addEventListener('click', () => moveLightbox(-1));
    $('#lbNext').addEventListener('click', () => moveLightbox(1));

    /* Keyboard support for dialogs, navigation and gallery */
    document.addEventListener('keydown', event => {
      const lightboxOpen = openDialog?.id === 'm-light';
      if (event.key === 'Escape') {
        if (openDialog) closeModal();
        else if (drawerOpen) { closeDrawer(); navButton.focus(); }
        return;
      }
      if (event.key === 'Tab' && (drawerOpen || openDialog)) {
        const scope = drawerOpen ? drawer : openDialog;
        const focusable = $$('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])', scope)
          .filter(item => item.getClientRects().length && !item.closest('[hidden]'));
        if (focusable.length) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      }
      if (lightboxOpen && event.key === 'ArrowRight') moveLightbox(1);
      if (lightboxOpen && event.key === 'ArrowLeft') moveLightbox(-1);
    });

    $('#year').textContent = new Date().getFullYear();
  });
})();
