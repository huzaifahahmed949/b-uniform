// ============================================================
// B-Uniform site scripts
// ============================================================
(function () {
  "use strict";

  const ROOT_PREFIX = document.body.dataset.root || "";
  const INQUIRY_KEY = "buniform_inquiry";

  /* ---------- Sticky header shadow ---------- */
  const header = document.querySelector(".site-header");
  if (header) {
    window.addEventListener("scroll", () => {
      header.classList.toggle("scrolled", window.scrollY > 12);
    });
  }

  /* ---------- Mobile menu toggle ---------- */
  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector(".main-nav");
  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      mainNav.classList.toggle("open");
      menuToggle.textContent = mainNav.classList.contains("open") ? "✕" : "☰";
    });
  }

  /* ---------- Mega menu (tap to open on mobile) ---------- */
  document.querySelectorAll(".has-mega > .nav-mega-trigger").forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      if (window.innerWidth > 800) return;
      e.preventDefault();
      trigger.parentElement.classList.toggle("open");
    });
  });

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in-view"));
  }

  /* ---------- Hero slideshow (if multiple bg slides) ---------- */
  const heroBg = document.querySelectorAll(".hero-bg[data-bg]");
  if (heroBg.length) {
    let idx = 0;
    heroBg.forEach((el, i) => {
      el.style.backgroundImage = `url(${el.dataset.bg})`;
      el.style.opacity = i === 0 ? "1" : "0";
      el.style.position = "absolute";
      el.style.inset = "0";
      el.style.transition = "opacity 1.2s ease";
    });
    if (heroBg.length > 1) {
      setInterval(() => {
        heroBg[idx].style.opacity = "0";
        idx = (idx + 1) % heroBg.length;
        heroBg[idx].style.opacity = "1";
      }, 5000);
    }
  }

  /* ---------- Toast ---------- */
  function showToast(msg) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add("active");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove("active"), 2600);
  }

  /* ---------- Inquiry list (cart-like, localStorage) ---------- */
  function getInquiry() {
    try {
      return JSON.parse(localStorage.getItem(INQUIRY_KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  function setInquiry(list) {
    localStorage.setItem(INQUIRY_KEY, JSON.stringify(list));
    renderInquiryBadge();
    renderDrawer();
  }
  function addToInquiry(item) {
    const list = getInquiry();
    const existing = list.find((p) => p.slug === item.slug && p.size === item.size);
    if (existing) {
      existing.qty += 1;
    } else {
      list.push({ ...item, qty: 1 });
    }
    setInquiry(list);
    showToast(`Added "${item.name}" to your inquiry`);
  }
  function removeFromInquiry(index) {
    const list = getInquiry();
    list.splice(index, 1);
    setInquiry(list);
  }
  function renderInquiryBadge() {
    const badge = document.querySelector(".inquiry-badge");
    if (!badge) return;
    const count = getInquiry().reduce((sum, p) => sum + p.qty, 0);
    badge.textContent = count;
    badge.style.display = count > 0 ? "flex" : "none";
  }
  function renderDrawer() {
    const body = document.querySelector(".drawer-body");
    const foot = document.querySelector(".drawer-foot");
    if (!body) return;
    const list = getInquiry();
    if (!list.length) {
      body.innerHTML = '<div class="drawer-empty">Your inquiry list is empty.<br>Browse our collections and add items you\'d like a quote for.</div>';
      if (foot) foot.style.display = "none";
      return;
    }
    if (foot) foot.style.display = "block";
    body.innerHTML = list
      .map(
        (item, i) => `
      <div class="drawer-item">
        <img src="${ROOT_PREFIX}${item.image}" alt="${item.name}">
        <div class="di-info">
          <h4>${item.name}</h4>
          <span>Size: ${item.size || "Any"} · Qty: ${item.qty}</span>
        </div>
        <button class="drawer-remove" data-remove-index="${i}" aria-label="Remove">&times;</button>
      </div>`
      )
      .join("");
    body.querySelectorAll("[data-remove-index]").forEach((btn) => {
      btn.addEventListener("click", () => removeFromInquiry(Number(btn.dataset.removeIndex)));
    });
  }

  document.addEventListener("click", (e) => {
    const addBtn = e.target.closest("[data-add-inquiry]");
    if (addBtn) {
      e.preventDefault();
      const size = document.querySelector(".size-chip.selected");
      addToInquiry({
        slug: addBtn.dataset.slug,
        name: addBtn.dataset.name,
        image: addBtn.dataset.image,
        size: size ? size.textContent.trim() : addBtn.dataset.defaultSize || "",
      });
    }
  });

  /* ---------- Drawer open/close ---------- */
  const drawer = document.querySelector(".drawer");
  const drawerOverlay = document.querySelector(".drawer-overlay");
  function openDrawer() {
    renderDrawer();
    if (drawer) drawer.classList.add("active");
    if (drawerOverlay) drawerOverlay.classList.add("active");
  }
  function closeDrawer() {
    if (drawer) drawer.classList.remove("active");
    if (drawerOverlay) drawerOverlay.classList.remove("active");
  }
  document.querySelectorAll("[data-open-drawer]").forEach((btn) => btn.addEventListener("click", (e) => { e.preventDefault(); openDrawer(); }));
  document.querySelectorAll("[data-close-drawer]").forEach((btn) => btn.addEventListener("click", closeDrawer));
  if (drawerOverlay) drawerOverlay.addEventListener("click", closeDrawer);
  renderInquiryBadge();

  /* ---------- Product page: color swatch selection ---------- */
  document.querySelectorAll(".color-swatches").forEach((row) => {
    row.querySelectorAll(".swatch").forEach((swatch) => {
      swatch.addEventListener("click", () => {
        row.querySelectorAll(".swatch").forEach((s) => s.classList.remove("selected"));
        swatch.classList.add("selected");
        const label = document.querySelector(".current-color-name");
        if (label) label.textContent = swatch.dataset.name;
      });
    });
  });

  /* ---------- Product page: size tabs + chip selection ---------- */
  document.querySelectorAll(".size-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".size-tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".size-panel").forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.target).classList.add("active");
    });
  });
  document.querySelectorAll(".size-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      chip.closest(".size-panel").querySelectorAll(".size-chip").forEach((c) => c.classList.remove("selected"));
      chip.classList.add("selected");
    });
  });

  /* ---------- Spec accordion ---------- */
  document.querySelectorAll(".spec-head").forEach((head) => {
    head.addEventListener("click", () => {
      head.parentElement.classList.toggle("open");
    });
  });

  /* ---------- Product gallery zoom ---------- */
  const galleryMain = document.querySelector(".gallery-main");
  if (galleryMain) {
    galleryMain.addEventListener("click", () => galleryMain.classList.toggle("zoomed"));
  }

  /* ---------- Collection filter/sort (operates on rendered DOM cards) ---------- */
  const filterSize = document.querySelector("#filter-size");
  const filterColor = document.querySelector("#filter-color");
  const sortSelect = document.querySelector("#sort-select");
  const grid = document.querySelector("[data-product-grid]");
  const resultCount = document.querySelector(".result-count");

  function applyFilters() {
    if (!grid) return;
    const cards = Array.from(grid.children);
    const sizeVal = filterSize ? filterSize.value : "";
    const colorVal = filterColor ? filterColor.value : "";
    let visibleCount = 0;
    cards.forEach((card) => {
      const sizes = (card.dataset.sizes || "").split("|");
      const color = card.dataset.color || "";
      const sizeMatch = !sizeVal || sizes.includes(sizeVal);
      const colorMatch = !colorVal || color === colorVal;
      const show = sizeMatch && colorMatch;
      card.style.display = show ? "" : "none";
      if (show) visibleCount++;
    });
    if (resultCount) resultCount.textContent = `${visibleCount} product${visibleCount === 1 ? "" : "s"}`;

    if (sortSelect && sortSelect.value) {
      const sorted = cards.slice().sort((a, b) => {
        if (sortSelect.value === "name-asc") return a.dataset.name.localeCompare(b.dataset.name);
        if (sortSelect.value === "name-desc") return b.dataset.name.localeCompare(a.dataset.name);
        return 0;
      });
      sorted.forEach((card) => grid.appendChild(card));
    }
  }
  [filterSize, filterColor, sortSelect].forEach((el) => {
    if (el) el.addEventListener("change", applyFilters);
  });
  if (grid) applyFilters();

  /* ---------- Form validation (contact / wholesale / newsletter) ---------- */
  document.querySelectorAll("form[data-validate]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll("[required]").forEach((field) => {
        const errorEl = field.parentElement.querySelector(".form-error");
        let msg = "";
        if (!field.value.trim()) {
          msg = "This field is required.";
        } else if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
          msg = "Enter a valid email address.";
        }
        if (errorEl) errorEl.textContent = msg;
        field.style.borderColor = msg ? "var(--color-burgundy)" : "";
        if (msg) valid = false;
      });
      if (valid) {
        form.style.display = "none";
        const successEl = form.parentElement.querySelector(".form-success");
        if (successEl) successEl.classList.add("active");
        form.reset();
      }
    });
  });

  /* ---------- Copy-to-clipboard buttons ---------- */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    navigator.clipboard.writeText(btn.dataset.copy).then(() => showToast("Copied to clipboard!"));
  });

  /* ---------- Newsletter mini-form ---------- */
  document.querySelectorAll("form[data-newsletter]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      showToast("Thanks for subscribing!");
      form.reset();
    });
  });
})();
