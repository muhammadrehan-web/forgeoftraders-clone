/**
 * Calculator runtime for template 2.
 *
 * Owns the program/size/add-on selection state, the fee panel, the sticky
 * purchase bar, the comparison-table handoff and the GA events the calculator
 * emits. Loaded by partials/forge/calculator-scripts.blade.php on the home page
 * and on compare-programs.
 *
 * Beautified from the export's forge-runtime-833589e4deb4.js, which is left on
 * disk but no longer loaded. Edit this file - the short variable names are the
 * minifier's, not a house style, so read a block before changing it.
 */
document.addEventListener("DOMContentLoaded", () => {
  const o = document.querySelector("#calculate-area"),
    p = document.querySelector(".sticky-purchase"),
    f = document.querySelector("#menu-toggle"),
    i = document.querySelector("#mobile-menu"),
    S = document.querySelector("#mobile-program"),
    A = "forge.challenge.v1";
  let y = !1,
    _ = !1,
    b = 0,
    L = !1;
  window.dataLayer = window.dataLayer || [];

  function E() {
    const e = window.current_program,
      t = e?.plans?.[window.current_plan_key];
    return t ? {
      program_id: String(e.id),
      plan_id: String(t.id),
      balance: Number(t.plan_size),
      program_name: e.program_name,
      addons: [...o.querySelectorAll(".addon-toggle-btn.active")].map(n => ({
        id: n.dataset.addonId,
        name: n.querySelector(".addon-name").textContent.trim(),
        percentage: Number(n.dataset.percentage)
      })),
      price: Number(o.querySelector(".program_fee").textContent.replace(/[^\d.]/g, "")),
      currency: "USD"
    } : null
  }

  function s(e, t = {}) {
    if (!window.ForgeConsent?.get().analytics) return;
    const n = E();
    window.dataLayer.push({
      event: e,
      ...t,
      ...n ? {
        currency: n.currency,
        value: n.price,
        price_is_estimate: n.addons.length > 0,
        program_id: n.program_id,
        account_size: n.balance,
        addons: n.addons.map(r => r.name),
        items: [{
          item_id: n.plan_id,
          item_name: n.program_name,
          item_variant: String(n.balance),
          price: n.price,
          quantity: 1
        }]
      } : {}
    })
  }

  function T() {
    const e = E();
    if (y && e) try {
      sessionStorage.setItem(A, JSON.stringify({
        ...e,
        saved_at: Date.now()
      }))
    } catch {}
  }

  function z() {
    let e;
    try {
      e = JSON.parse(sessionStorage.getItem(A))
    } catch {}
    if (e && Date.now() - e.saved_at < 864e5 && Date.now() >= e.saved_at) {
      const t = [...o.querySelectorAll(".program-item")].find(n => n.dataset.program_id === e.program_id);
      if (t) {
        t.click();
        const n = window.current_program.plans.findIndex(r => String(r.id) === e.plan_id && Number(r.plan_size) === e.balance);
        if (n >= 0 && o.querySelectorAll(".fpt__single-account")[n]?.click(), Array.isArray(e.addons))
          for (const r of e.addons) {
            const c = [...o.querySelectorAll(".addon-toggle-btn:not(.disabled)")].find(d => d.dataset.addonId === r.id);
            c && !c.classList.contains("active") && c.click()
          }
      }
    }
    y = !0, q()
  }
  document.addEventListener("forge:ready", z, {
    once: !0
  });

  function h() {
    i.hidden = !0, f.setAttribute("aria-expanded", "false"), l()
  }
  f.addEventListener("click", () => {
    i.hidden = !i.hidden, f.setAttribute("aria-expanded", String(!i.hidden)), l()
  }), i.addEventListener("click", e => {
    e.target.closest("a") && h()
  }), document.addEventListener("click", e => {
    !i.hidden && !e.target.closest(".site-header") && h()
  }), document.addEventListener("keydown", e => {
    e.key === "Escape" && !i.hidden && (h(), f.focus())
  }), S.addEventListener("change", () => {
    o.querySelector('.program-item[data-program_id="' + S.value + '"]').click()
  });

  function q() {
    _ = !1;
    const e = o.querySelector(".program-item.active");
    e && (S.value = e.dataset.program_id);
    const t = e?.querySelector(".program-name")?.textContent || "",
      n = o.querySelector(".selection-program");
    n.textContent !== t && (n.textContent = t);
    const r = [...o.querySelectorAll(".addon-toggle-btn.active")].map(a => a.querySelector(".addon-name").textContent.trim()),
      c = o.querySelector(".selection-addons"),
      d = JSON.stringify(r);
    c.dataset.selection !== d && (c.dataset.selection = d, c.replaceChildren(...r.map(a => {
      const g = document.createElement("li");
      return g.textContent = a, g
    })), c.hidden = !r.length);
    const m = o.querySelector(".fee-label"),
      R = "Program fee";
    m.textContent !== R && (m.textContent = R);
    // Add-ons are quoted against the regular price, the promotion comes off
    // that subtotal, and nothing here is rounded: 29 + 30% = 37.70, less a 50%
    // promo = 18.85.
    //
    // The percentages are summed from the buttons rather than read back out of
    // .program_fee, because the bundle that writes that element rounds it -
    // 37.70 is stored as 38, which made this 19.
    // Quarter-dollar pricing for the plans listed below, and nowhere else.
    //
    //   "nearest" - snap the estimate to the closest $0.25.
    //               TWO Phase 32: 20.80 -> 20.75, 19.20 -> 19.25,
    //               25.60 -> 25.50, 28.80 -> 28.75.
    //               THREE Phase 26: 15.60 -> 15.50, 23.40 -> 23.50.
    //   "up"      - always to the next $0.25.
    //               THREE Phase 99: 64.35 -> 64.50, 59.40 -> 59.50,
    //               79.20 -> 79.25, 89.10 -> 89.25.
    //
    // The direction is per plan because the quoted prices demand it, not
    // because a rule was chosen: 25.60 and 64.35 both sit 10c above a quarter
    // yet are quoted 25.50 and 64.50, so no single rounding can serve both.
    // Anything not listed keeps exact cents (ONE Phase 29 + 30% = 18.85).
    //
    // Keyed to literal prices, so an entry stops applying the moment that plan
    // is repriced in Admin > Program Plans. Update the price here, add the new
    // plan, or drop the entry to return it to exact cents.
    //
    // The add-on share is derived from the rounded total rather than rounded on
    // its own, so "add-ons + fee" always equals the total shown beside it.
    const QUARTER_PRICED = {
      "TWO Phase Program": {
        32: "nearest"
      },
      "THREE Phase Program": {
        26: "nearest",
        99: "up"
      }
    };
    const v = Number(window.current_program?.plans?.[window.current_plan_key]?.retail_price) || 55,
      P = (Number(window.__FORGE_PROMO_PERCENT__) || 50) / 100,
      A = [...o.querySelectorAll(".addon-toggle-btn.active")]
      .reduce((sum, el) => sum + (Number(el.dataset.percentage) || 0), 0) / 100,
      quarterMode = QUARTER_PRICED[window.current_program?.program_name]?.[v],
      // The epsilon keeps a total that already lands on a quarter from being
      // pushed to the next one by float noise (74.25 must stay 74.25).
      Q = e => quarterMode === "up" ? Math.ceil(e * 4 - 1e-9) / 4 : Math.round(e * 4) / 4,
      D = v * (1 - P),
      rawAddons = v * A * (1 - P),
      N = quarterMode && r.length ? Q(D + rawAddons) - D : rawAddons,
      w = D + N,
      u = a => "$" + a.toLocaleString("en-US", {
        minimumFractionDigits: a % 1 ? 2 : 0,
        maximumFractionDigits: 2
      }),
      k = (a, g) => {
        const C = o.querySelector(a);
        C && C.textContent !== g && (C.textContent = g)
      };
    // The struck-through price follows the selection: with add-ons on it shows
    // the regular price plus those add-ons (55 + 30% = 71.50), so the crossed
    // figure and the quoted one describe the same configuration.
    //
    // Derived from the quoted total rather than as v * (1 + A) so the pair
    // always reads as exactly the promo percentage off. They only differ on the
    // quarter-priced plans, where the raw subtotal would be a few cents out -
    // 41.60 struck against a 20.75 quote is not the 50% the badge claims.
    const regularShown = r.length ? (P < 1 ? w / (1 - P) : v * (1 + A)) : v;
    k(".base-regular", u(regularShown)), k(".discounted-fee", u(D));
    // Once add-ons are selected the estimated total takes over the headline
    // figure, so the big number always matches what the visitor configured.
    // .estimated-fee carries .discounted-fee too - that is what keeps the type
    // identical - so query the pair in document order: the plain fee is first,
    // the estimate second.
    const estimateFee = o.querySelector(".estimated-fee"),
      plainFee = o.querySelector(".discounted-fee");
    estimateFee && (k(".estimated-fee", u(w)), estimateFee.hidden = !r.length),
    plainFee && (plainFee.hidden = !!r.length);
    const O = o.querySelector(".offer-addon-estimate");
    // Shows the sum being made, not just the add-on part: discounted fee plus
    // the add-on share, then the total those two make.
    O.hidden = !r.length, k(".offer-addon-estimate", "Add-ons " + u(N) + "+" + u(D) + " \xB7 Estimated total " + u(w));
    const x = o.querySelector("#selection-announcement"),
      I = t + ", " + (o.querySelector(".program_balance")?.textContent || "") + ", " + u(w) + (" with " + (window.__FORGE_PROMO_CODE__ || "START50") + " for your first account") + (r.length ? ", estimated including add-ons" : "");
    x && x.textContent !== I && (x.textContent = I);
    const F = o.querySelector(".program_balance")?.textContent || "";
    p.querySelector(".sticky-purchase-name").textContent = F + " \xB7 " + t, p.querySelector(".sticky-purchase-price").textContent = u(w), p.querySelector(".sticky-estimate").hidden = !r.length, window.current_program?.steps === "0" && o.querySelectorAll(".phase").forEach(a => a.classList.toggle("active", a.dataset.action === "funded")), o.querySelectorAll(".program-item,.fpt__single-account,.addon-toggle-btn,.phase").forEach(a => {
      a.setAttribute("aria-pressed", String(a.classList.contains("active")))
    }), o.querySelectorAll(".addon-info-icon").forEach(a => {
      a.tabIndex = 0, a.setAttribute("aria-label", a.getAttribute("data-bs-original-title") || a.title || "Program rules")
    }), T(), l()
  }
  new MutationObserver(() => {
    _ || (_ = !0, queueMicrotask(q))
  }).observe(o, {
    childList: !0,
    subtree: !0,
    characterData: !0
  });

  function B() {
    const e = o.querySelector(".cta").getBoundingClientRect(),
      t = (document.querySelector(".brand-stage") || document.querySelector("section.hero") || document.querySelector(".page-hero")).getBoundingClientRect(),
      n = window.visualViewport,
      r = n?.height || innerHeight,
      c = n && innerHeight - n.height > 150,
      d = document.querySelector(".site-header").getBoundingClientRect().bottom;
    if (p.hidden = !(t.bottom < d && !(e.top >= d && e.bottom <= r) && i.hidden && !c), y && !L) {
      const m = o.getBoundingClientRect();
      m.top < r * .8 && m.bottom > d && (L = !0, s("view_item", {
        placement: "configurator"
      }))
    }
  }

  function l() {
    b || (b = requestAnimationFrame(() => {
      b = 0, B()
    }))
  }
  addEventListener("scroll", l, {
    passive: !0
  }), addEventListener("resize", () => {
    innerWidth > 1100 && h(), l()
  }), window.visualViewport?.addEventListener("resize", l), document.addEventListener("click", e => {
    const t = e.target.closest(".fpt__single-account");
    t && !e.target.closest(".sa__circle-target") && t.querySelector(".sa__circle-target")?.click()
  }), document.querySelector("#copy-code").addEventListener("click", async () => {
    const e = document.querySelector("#copy-feedback"),
      t = document.querySelector("#copy-code i");
    try {
      await navigator.clipboard.writeText((window.__FORGE_PROMO_CODE__ || "START50")), e.textContent = ("Code " + (window.__FORGE_PROMO_CODE__ || "START50") + " copied"), t.className = "bi bi-check2", s("copy_coupon", {
        coupon: (window.__FORGE_PROMO_CODE__ || "START50")
      }), setTimeout(() => {
        t.className = "bi bi-copy"
      }, 2e3)
    } catch {
      e.textContent = ("Use code " + (window.__FORGE_PROMO_CODE__ || "START50") + " at checkout");
      const n = document.createRange();
      n.selectNodeContents(document.querySelector("#copy-code"));
      const r = getSelection();
      r.removeAllRanges(), r.addRange(n)
    }
  }), document.addEventListener("click", e => {
    if (!y || e.target.closest(".sa__circle-target")) return;
    const t = e.target.closest("a,.program-item,.fpt__single-account,.addon-toggle-btn");
    if (t) {
      if (t.matches('a[href*="app.forgeoftraders.com/checkout"]')) {
        T(), s("begin_checkout", {
          placement: t.dataset.gaEvent || "checkout_link",
          coupon_available: (window.__FORGE_PROMO_CODE__ || "START50")
        });
        return
      }
      t.matches(".program-item,.fpt__single-account") ? s("select_item", {
        control: t.matches(".program-item") ? "program" : "account"
      }) : t.matches(".addon-toggle-btn") ? s("select_addon", {
        addon: t.dataset.addon,
        selected: t.classList.contains("active")
      }) : t.dataset.gaEvent ? s(t.dataset.gaEvent) : t.matches(".monthly-proof-link") && s("view_reward_proof")
    }
  }), q()
});
