/* ==========================================================================
   SAKE YUKI · main.js — entry point (IIFE, no imports, works on file://)
   ========================================================================== */
(function () {
  "use strict";

  var data = window.__BRAND__ || {};
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  var escHTML = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }

  function waLink(phone, message) {
    return "https://wa.me/" + phone + "?text=" + encodeURIComponent(message || "");
  }

  /* ---------------------------------------------------------------------
     MOUNTS — idempotent, hydrate from window.__BRAND__
     --------------------------------------------------------------------- */

  function mountLinks() {
    if (!data.phoneWhatsapp) return;
    var link = waLink(data.phoneWhatsapp, data.whatsappMessage);
    ["navCta", "mobileCta", "heroReservaBtn", "reservaWhatsapp", "contactPhone", "footerWhatsapp"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.setAttribute("href", link);
    });
    var yearEl = document.getElementById("year");
    if (yearEl && data.established) { /* keep static year text, no override needed */ }
  }

  function mountMenu() {
    var mount = $("[data-menu-mount]");
    var tabsMount = $("#cartaTabs");
    if (!mount || !data.menu || mount.children.length > 0) return;

    var tabsHtml = data.menu.map(function (cat, i) {
      return '<button class="carta-tab' + (i === 0 ? " is-active" : "") + '" data-tab="' + cat.id + '">' + escHTML(cat.label) + "</button>";
    }).join("");
    if (tabsMount && tabsMount.children.length === 0) tabsMount.innerHTML = tabsHtml;

    mount.innerHTML = data.menu.map(function (cat) {
      var items = (cat.items || []).map(function (it) {
        var priceHtml = (it.price === null || it.price === undefined)
          ? '<span class="menu-item-price is-pending">Consulta preu</span>'
          : '<span class="menu-item-price">' + Number(it.price).toFixed(2).replace(".", ",") + " €</span>";
        return '<article class="menu-item">' +
          '<div><div class="menu-item-name">' + escHTML(it.name) + '</div>' +
          (it.desc ? '<div class="menu-item-desc">' + escHTML(it.desc) + '</div>' : '') +
          '</div>' + priceHtml + '</article>';
      }).join("");
      return '<div class="menu-category reveal" id="cat-' + cat.id + '" data-category="' + cat.id + '">' +
        '<div class="menu-category-head">' +
        '<span class="icon-badge"><svg class="icon" aria-hidden="true"><use href="#i-' + (cat.icon || "bowl") + '"/></svg></span>' +
        '<h3>' + escHTML(cat.label) + '</h3>' +
        '<span class="count">' + (cat.items ? cat.items.length : 0) + ' plats</span>' +
        '</div><div class="menu-grid">' + items + '</div></div>';
    }).join("");
  }

  function mountGallery() {
    if (!data.gallery) return;
    var rows = [$("#galRow1"), $("#galRow2"), $("#galRow3")];
    rows.forEach(function (row, idx) {
      if (!row || row.children.length > 0) return;
      var set = data.gallery.slice(idx * 2, idx * 2 + 6);
      if (!set.length) set = data.gallery;
      var doubled = set.concat(set).concat(set);
      row.innerHTML = doubled.map(function (g) {
        return '<div class="gallery-card"><svg class="icon" aria-hidden="true"><use href="#i-' + g.icon + '"/></svg><span>' + escHTML(g.label) + '</span></div>';
      }).join("");
    });
  }

  function mountHours() {
    var table = $("#hoursTable");
    if (!table || !data.hours || table.children.length > 0) return;
    var todayIdx = (new Date().getDay() + 6) % 7; // Monday = 0
    table.innerHTML = data.hours.map(function (h, i) {
      return '<tr class="' + (i === todayIdx ? "is-today" : "") + '"><td>' + escHTML(h.day) + '</td><td>' + escHTML(h.time) + '</td></tr>';
    }).join("");
  }

  /* ---------------------------------------------------------------------
     CARTA TABS — smooth-scroll to category, mark active
     --------------------------------------------------------------------- */
  function initCartaTabs() {
    var tabs = $("#cartaTabs");
    if (!tabs) return;
    tabs.addEventListener("click", function (e) {
      var btn = e.target.closest(".carta-tab");
      if (!btn) return;
      $$(".carta-tab", tabs).forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      var target = document.getElementById("cat-" + btn.dataset.tab);
      if (target) {
        var top = target.getBoundingClientRect().top + window.scrollY - 96;
        window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
      }
    });
  }

  /* ---------------------------------------------------------------------
     SPLASH — double safety net (CSS 4.5s handles most of it)
     --------------------------------------------------------------------- */
  function initSplash() {
    var splash = $("#splash");
    if (!splash) return;
    var hide = function () {
      splash.style.opacity = "0";
      splash.style.visibility = "hidden";
      setTimeout(function () { if (splash.parentNode) splash.parentNode.removeChild(splash); }, 400);
    };
    setTimeout(hide, reduced ? 900 : 4600);
  }

  /* ---------------------------------------------------------------------
     NAV — scrolled state, burger, anchor smooth-scroll
     --------------------------------------------------------------------- */
  function initNav() {
    var nav = $("#nav");
    var burger = $("#burger");
    var mobileMenu = $("#mobileMenu");
    if (nav) {
      var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 12); };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
    if (burger && mobileMenu) {
      burger.addEventListener("click", function () {
        var open = !mobileMenu.classList.contains("is-open");
        mobileMenu.classList.toggle("is-open", open);
        burger.classList.toggle("is-open", open);
        burger.setAttribute("aria-expanded", String(open));
      });
      $$("a", mobileMenu).forEach(function (a) {
        a.addEventListener("click", function () {
          mobileMenu.classList.remove("is-open");
          burger.classList.remove("is-open");
          burger.setAttribute("aria-expanded", "false");
        });
      });
    }
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var top = el.getBoundingClientRect().top + window.scrollY - (id === "#inici" ? 0 : 76);
      window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
    });
  }

  /* ---------------------------------------------------------------------
     CURSOR — custom ring, hidden until first mousemove (gotcha A.3)
     --------------------------------------------------------------------- */
  function initCursor() {
    if (!fineHover) return;
    var cursor = $(".cursor");
    var ring = $("#cursorRing");
    var label = $("#cursorLabel");
    if (!cursor || !ring) return;
    var firstMove = false;
    var labels = {
      reservar: "Reservar", whatsapp: "WhatsApp", carta: "Veure", veure: "Veure", inici: "Inici"
    };
    var lastX = window.innerWidth / 2;
    var lastY = window.innerHeight / 2;
    var dotX = 0;
    var dotY = 0;

    function updateCursorPosition(x, y) {
      var dx = x - lastX;
      var dy = y - lastY;
      var targetX = Math.max(-44, Math.min(44, dx * 1.2));
      var targetY = Math.max(-44, Math.min(44, dy * 1.2));
      var smoothing = 0.18;

      dotX += (targetX - dotX) * smoothing;
      dotY += (targetY - dotY) * smoothing;

      ring.style.setProperty("--cursor-dot-x", dotX + "px");
      ring.style.setProperty("--cursor-dot-y", dotY + "px");
      ring.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      ring.style.left = "0";
      ring.style.top = "0";

      lastX = x;
      lastY = y;
    }

    window.addEventListener("mousemove", function (e) {
      updateCursorPosition(e.clientX, e.clientY);
      if (!firstMove) { firstMove = true; cursor.classList.add("is-ready"); }
    });
    $$("[data-cursor], a, button").forEach(function (el) {
      el.addEventListener("mouseover", function (e) {
        if (el.contains(e.relatedTarget)) return;
        var key = el.dataset.cursor;
        ring.classList.toggle("is-active", !!key);
        if (label) label.textContent = labels[key] || "";
      });
      el.addEventListener("mouseout", function (e) {
        if (el.contains(e.relatedTarget)) return;
        ring.classList.remove("is-active");
      });
    });
  }

  /* ---------------------------------------------------------------------
     REVEALS — IntersectionObserver, threshold <=0.05, 6s safety net
     --------------------------------------------------------------------- */
  function initReveals() {
    var targets = $$(".reveal");
    if (!targets.length) return;
    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (t) { t.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px -6% 0px" });
    targets.forEach(function (t) { io.observe(t); });
    setTimeout(function () { targets.forEach(function (t) { t.classList.add("is-visible"); }); }, 6000);
  }

  /* ---------------------------------------------------------------------
     TILT — subtle card tilt, gated by hover capability only (not reduced-motion)
     --------------------------------------------------------------------- */
  function initTilt() {
    if (!fineHover) return;
    $$(".menu-item, .contact-row").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var rx = ((e.clientY - r.top) / r.height - 0.5) * -3;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 3;
        card.style.transform = "perspective(600px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(-2px)";
      });
      card.addEventListener("mouseout", function (e) {
        if (card.contains(e.relatedTarget)) return;
        card.style.transform = "";
      });
    });
  }

  /* ---------------------------------------------------------------------
     BOOT
     --------------------------------------------------------------------- */
  function boot() {
    safe(mountLinks, "mountLinks");
    safe(mountMenu, "mountMenu");
    safe(mountGallery, "mountGallery");
    safe(mountHours, "mountHours");

    safe(initSplash, "initSplash");
    safe(initNav, "initNav");
    safe(initCartaTabs, "initCartaTabs");
    safe(initCursor, "initCursor");
    safe(initReveals, "initReveals");
    safe(initTilt, "initTilt");

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
