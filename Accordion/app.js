(() => {
  'use strict';

  /* ------------------------------------------------------------
     عناصر صفحه
     ------------------------------------------------------------ */
  const dialog   = document.querySelector('#filterDialog');
  const form     = document.querySelector('#filterForm');
  const openBtn  = document.querySelector('[data-filter-open]');
  const badge    = document.querySelector('[data-filter-badge]');
  const resetBtn = document.querySelector('[data-filter-reset]');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // اگر به هر دلیلی انیمیشن اجرا نشد، پنل حداکثر بعد از این مدت بسته می‌شود
  const CLOSE_FALLBACK_MS = 600;

  const EMPTY_STATE = Object.freeze({ colors: [], inStock: false, discounted: false });

  /* ------------------------------------------------------------
     حالت فیلترها (خواندن از فرم / نوشتن در فرم)
     ------------------------------------------------------------ */
  function readState() {
    const data = new FormData(form);
    return {
      colors: data.getAll('color'),
      inStock: data.has('inStock'),
      discounted: data.has('discounted'),
    };
  }

  function writeState(state) {
    form.querySelectorAll('input[name="color"]').forEach((input) => {
      input.checked = state.colors.includes(input.value);
    });
    form.elements.inStock.checked = state.inStock;
    form.elements.discounted.checked = state.discounted;
  }

  function countActive(state) {
    return state.colors.length + Number(state.inStock) + Number(state.discounted);
  }

  // آخرین فیلتری که کاربر «اعمال» کرده است
  let appliedState = readState();

  /* ------------------------------------------------------------
     نمایش اعداد روی دکمه‌ها
     ------------------------------------------------------------ */
  function renderBadge({ animate = false } = {}) {
    const count = countActive(appliedState);

    badge.hidden = count === 0;
    badge.textContent = count.toLocaleString('fa-IR');

    if (animate && count > 0 && !reducedMotion.matches) {
      badge.animate(
        [
          { transform: 'scale(0.6)' },
          { transform: 'scale(1.2)', offset: 0.6 },
          { transform: 'scale(1)' },
        ],
        { duration: 320, easing: 'ease-out' }
      );
    }
  }

  function syncResetButton() {
    resetBtn.disabled = countActive(readState()) === 0;
  }

  /* ------------------------------------------------------------
     باز و بسته کردن پنل
     ------------------------------------------------------------ */
  let closeTimer = 0;

  function openDialog() {
    if (!dialog.open) dialog.showModal();
  }

  function closeDialog() {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;

    dialog.classList.add('is-closing');
    closeTimer = window.setTimeout(finishClose, CLOSE_FALLBACK_MS);
  }

  function finishClose() {
    if (dialog.open) dialog.close();
  }

  // انیمیشن بسته شدن که تمام شد، پنل واقعاً بسته می‌شود
  dialog.addEventListener('animationend', (event) => {
    if (event.target === dialog && event.animationName === 'panel-out') finishClose();
  });

  // به هر روشی که پنل بسته شود (اعمال، ضربدر، Esc، کلیک بیرون) این رویداد اجرا می‌شود
  dialog.addEventListener('close', () => {
    window.clearTimeout(closeTimer);
    dialog.classList.remove('is-closing');

    // تغییراتی که «اعمال» نشده‌اند به حالت قبلی برمی‌گردند
    writeState(appliedState);
    syncResetButton();
  });

  // کلید Esc: به‌جای بستن ناگهانی، انیمیشن بسته شدن اجرا شود
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeDialog();
  });

  // کلیک روی ضربدر یا روی پس‌زمینه‌ی تیره
  // (اگر کاربر داخل پنل کلیک را شروع کرده و بیرون رها کند، پنل بسته نمی‌شود)
  let pointerStartedOnBackdrop = false;

  dialog.addEventListener('pointerdown', (event) => {
    pointerStartedOnBackdrop = event.target === dialog;
  });

  dialog.addEventListener('click', (event) => {
    const clickedBackdrop = event.target === dialog && pointerStartedOnBackdrop;
    const clickedCloseBtn = event.target.closest('[data-filter-close]');

    if (clickedBackdrop || clickedCloseBtn) closeDialog();
  });

  openBtn.addEventListener('click', openDialog);

  /* ------------------------------------------------------------
     اعمال و حذف فیلترها
     ------------------------------------------------------------ */
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    appliedState = readState();
    renderBadge({ animate: true });

    // بقیه‌ی صفحه (مثلاً لیست محصولات) می‌تواند به این رویداد گوش بدهد
    document.dispatchEvent(new CustomEvent('filter:apply', { detail: appliedState }));

    closeDialog();
  });

  resetBtn.addEventListener('click', () => {
    writeState(EMPTY_STATE);
    syncResetButton();
  });

  form.addEventListener('change', syncResetButton);

  /* ------------------------------------------------------------
     آکاردئون
     ------------------------------------------------------------ */
  document.querySelectorAll('[data-accordion]').forEach((accordion) => {
    const trigger = accordion.querySelector('[data-accordion-trigger]');

    // شماره‌ی هر آیتم برای تأخیر پله‌ای انیمیشن (--i در CSS استفاده می‌شود)
    accordion.querySelectorAll('[data-accordion-item]').forEach((item, index) => {
      item.style.setProperty('--i', index);
    });

    trigger.addEventListener('click', () => {
      const willOpen = trigger.getAttribute('aria-expanded') !== 'true';

      trigger.setAttribute('aria-expanded', String(willOpen));
      accordion.classList.toggle('is-open', willOpen);
    });
  });

  /* ------------------------------------------------------------
     شروع
     ------------------------------------------------------------ */
  syncResetButton();
  renderBadge();

  // نمونه‌ی استفاده در بقیه‌ی صفحه:
  // document.addEventListener('filter:apply', (event) => {
  //   console.log(event.detail); // { colors: ['red'], inStock: true, discounted: false }
  // });
})();
