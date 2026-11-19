(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const mobileQuery = window.matchMedia('(max-width: 768px)');
  const formatNumber = new Intl.NumberFormat('fa-IR');

  /* ---------------------------------------------------------
     داده‌ی سبد خرید (نمونه)
     بعداً می‌توانی این آرایه را از سرور یا localStorage بخوانی
     --------------------------------------------------------- */
  let cartItems = [
    { id: 1, title: 'پولوشرت آستین کوتاه مردانه', price: 2500000, image: '../img/p1.png' },
    { id: 2, title: 'پولوشرت آستین کوتاه مردانه', price: 2500000, image: '../img/p2.png' },
    { id: 3, title: 'پولوشرت آستین کوتاه مردانه', price: 2500000, image: '../img/p3.png' },
  ];

  /* ---------------------------------------------------------
     المنت‌ها
     --------------------------------------------------------- */
  const overlay = $('.overlay');
  const nav = $('#main-nav');
  const menu = $('.menu');
  const megaItem = $('.menu__item--has-sub');
  const cartPanel = $('#cart-panel');
  const cartList = $('[data-cart-list]');
  const cartFooter = $('[data-cart-footer]');
  const cartTotal = $('[data-cart-total]');
  const cartSummary = $('[data-cart-summary]');
  const cartBadge = $('[data-cart-count]');
  const navToggles = $$('[data-nav-toggle]');
  const cartToggles = $$('[data-cart-toggle]');

  /* ---------------------------------------------------------
     رندر سبد خرید
     --------------------------------------------------------- */
  const escapeHTML = (text) =>
    String(text).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[ch]));

  const itemTemplate = (item) => `
    <li class="cart-item">
      <img class="cart-item__img" src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)}" width="64" height="64">
      <div class="cart-item__body">
        <p class="cart-item__title">${escapeHTML(item.title)}</p>
        <p class="cart-item__price">
          <span class="num">${formatNumber.format(item.price)}</span>
          <span>تومان</span>
        </p>
      </div>
      <button class="icon-btn icon-btn--sm" type="button" data-remove="${item.id}"
              aria-label="حذف ${escapeHTML(item.title)} از سبد خرید">
        <svg class="icon" aria-hidden="true"><use href="#i-remove"/></svg>
      </button>
    </li>`;

  function renderCart() {
    const count = cartItems.length;
    const total = cartItems.reduce((sum, item) => sum + item.price, 0);

    cartList.innerHTML = count
      ? cartItems.map(itemTemplate).join('')
      : '<li class="cart__empty">سبد خرید شما خالی است</li>';

    cartBadge.textContent = formatNumber.format(count);
    cartBadge.hidden = count === 0;
    cartSummary.textContent = `${formatNumber.format(count)} مورد`;
    cartTotal.textContent = formatNumber.format(total);
    cartFooter.hidden = count === 0;
  }

  cartList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove]');
    if (!button) return;
    const id = Number(button.dataset.remove);
    cartItems = cartItems.filter((item) => item.id !== id);
    renderCart();
  });

  /* ---------------------------------------------------------
     پنل‌ها (منوی موبایل / سبد خرید) و پوشش تیره
     --------------------------------------------------------- */
  let openPanel = null;   // 'nav' | 'cart' | null
  let megaOpen = false;   // زیرمنوی محصولات در دسکتاپ

  function syncOverlay() {
    overlay.classList.toggle('is-visible', openPanel !== null || megaOpen);
    // قفل اسکرول فقط وقتی کشوی موبایل باز است (در دسکتاپ پرش صفحه ایجاد می‌کند)
    document.body.classList.toggle('is-locked', openPanel !== null && mobileQuery.matches);
  }

  function setPanel(name) {
    openPanel = name;
    nav.classList.toggle('is-open', name === 'nav');
    cartPanel.classList.toggle('is-open', name === 'cart');
    navToggles.forEach((btn) => btn.setAttribute('aria-expanded', String(name === 'nav')));
    cartToggles.forEach((btn) => btn.setAttribute('aria-expanded', String(name === 'cart')));
    syncOverlay();
  }

  function setMega(value) {
    megaOpen = value;
    syncOverlay();
  }

  // یک listener برای همه‌ی کلیک‌ها.
  // از composedPath استفاده می‌کنیم تا حذف یک آیتم از سبد (که المنتش از DOM پاک می‌شود)
  // باعث بسته‌شدن ناخواسته‌ی پنل نشود.
  document.addEventListener('click', (event) => {
    const path = event.composedPath();
    const hit = (selector) =>
      path.some((node) => node instanceof Element && node.matches(selector));

    if (hit('[data-close]')) return setPanel(null);
    if (hit('[data-nav-toggle]')) return setPanel(openPanel === 'nav' ? null : 'nav');
    if (hit('[data-cart-toggle]')) return setPanel(openPanel === 'cart' ? null : 'cart');

    // کلیک بیرون از پنل باز (شامل کلیک روی overlay)
    if (openPanel && !hit('.main-nav, .cart__panel')) setPanel(null);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    setPanel(null);
    setMega(false);
  });

  /* ---------------------------------------------------------
     زیرمنوی محصولات (دسکتاپ): پوشش تیره هنگام hover / focus
     نمایش خود زیرمنو با CSS انجام می‌شود
     --------------------------------------------------------- */
  megaItem.addEventListener('mouseenter', () => { if (!mobileQuery.matches) setMega(true); });
  megaItem.addEventListener('mouseleave', () => setMega(false));
  megaItem.addEventListener('focusin', () => { if (!mobileQuery.matches) setMega(true); });
  megaItem.addEventListener('focusout', (event) => {
    if (!megaItem.contains(event.relatedTarget)) setMega(false);
  });

  /* ---------------------------------------------------------
     زیرمنوی موبایل: آکاردئون
     --------------------------------------------------------- */
  menu.addEventListener('click', (event) => {
    if (!mobileQuery.matches) return;
    const trigger = event.target.closest('[data-toggle]');
    if (!trigger) return;
    event.preventDefault();
    const isOpen = trigger.parentElement.classList.toggle('is-open');
    trigger.setAttribute('aria-expanded', String(isOpen));
  });

  // با تغییر اندازه‌ی صفحه همه چیز به حالت اولیه برگردد
  mobileQuery.addEventListener('change', () => {
    setPanel(null);
    setMega(false);
  });

  renderCart();
})();
