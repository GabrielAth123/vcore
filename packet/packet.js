(function () {
  "use strict";

  /* Mobile navigation toggle (same behaviour as the rest of the site) */
  var hamburger = document.getElementById("hamburger-btn");
  var mobileNav = document.getElementById("mobile-nav");

  if (hamburger && mobileNav) {
    hamburger.addEventListener("click", function () {
      var open = hamburger.classList.toggle("active");
      mobileNav.classList.toggle("active", open);
      document.body.classList.toggle("nav-open", open);
      hamburger.setAttribute("aria-expanded", String(open));
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        hamburger.classList.remove("active");
        mobileNav.classList.remove("active");
        document.body.classList.remove("nav-open");
        hamburger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Scroll reveal engine, built for this page.
     Adds .is-visible once an element crosses the viewport threshold,
     then stops observing it — a one-way reveal, not a replaying effect. */
  var revealTargets = document.querySelectorAll(".pk-reveal");

  if (!("IntersectionObserver" in window) || !revealTargets.length) {
    revealTargets.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
    );

    revealTargets.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* Form progress rail — highlights the section currently in view. */
  var railSteps = document.querySelectorAll(".rail-step");
  var formSections = document.querySelectorAll("#questionnaireForm .form-section");

  if (railSteps.length && formSections.length && "IntersectionObserver" in window) {
    var railObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var index = Array.prototype.indexOf.call(formSections, entry.target);
          var step = railSteps[index];
          if (!step) return;
          if (entry.isIntersecting) {
            step.classList.add("is-active");
          } else {
            step.classList.remove("is-active");
          }
        });
      },
      { threshold: 0, rootMargin: "-40% 0px -50% 0px" }
    );

    formSections.forEach(function (section) {
      railObserver.observe(section);
    });
  }

  /* Terms & Liability accordion. */
  var termsToggle = document.getElementById("termsToggle");
  var termsFullWrap = document.getElementById("termsFullWrap");

  if (termsToggle && termsFullWrap) {
    termsToggle.addEventListener("click", function () {
      var isOpen = termsFullWrap.classList.toggle("is-open");
      termsToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      termsToggle.querySelector("span").textContent = isOpen
        ? "Hide full terms"
        : "Read full terms";
    });
  }

  /* Questionnaire submit.
     Sends the request to the same Cloudflare Worker as the homepage contact
     form. The Worker takes name, email and message, so every parcel field is
     packed into the message as labelled lines. The form is only reset after
     the Worker confirms, so a failed send never looks like a success. */
  var form = document.getElementById("questionnaireForm");
  var toast = document.getElementById("questionnaireToast");
  var toastText = document.getElementById("questionnaireToastText");
  var submitBtn = document.getElementById("submitBtn");
  var toastTimer = null;
  var WORKER_URL = "https://contact-form-worker.simsonakos23.workers.dev/";
  var TEXT = {
    sending: "Sending your request...",
    sent: "Request sent. We will reply by email within 24 hours.",
    failed: "Sending failed. Please try again or email contact@vcore.gr"
  };

  function showToast(message, isError) {
    if (!toast) return;
    if (toastText) toastText.textContent = message;
    toast.classList.toggle("is-error", !!isError);
    toast.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.add("hidden");
    }, isError ? 8000 : 6000);
  }

  /* querySelector, not form.elements[name]: form.elements.length is the
     control count, so the "length" field can't be read that way. */
  function field(name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el && el.value ? el.value.trim() : "";
  }

  function buildMessage() {
    var countryEl = form.elements.country;
    var country = countryEl && countryEl.selectedIndex > -1
      ? countryEl.options[countryEl.selectedIndex].text.trim()
      : "";
    var lines = [
      "Parcel forwarding request (vcore.gr/packet)",
      "",
      "Name: " + field("firstName") + " " + field("lastName"),
      "Email: " + field("email"),
      "Phone: " + field("phone"),
      "",
      "Delivery address: " + field("streetName") + " " + field("streetNumber") +
        ", " + field("postalCode") + " " + field("city") + ", " + country,
      "",
      "Weight: " + field("weight"),
      "Dimensions (L x W x H): " + field("length") + " x " + field("width") + " x " + field("height"),
      "Contents: " + field("contents"),
      "Description: " + (field("description") || "-"),
      "Special instructions: " + (field("specialInstructions") || "-"),
      "Preferred date: " + (field("preferredDate") || "-")
    ];
    return lines.join("\n");
  }

  if (form && toast) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      if (!form.reportValidity()) {
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      showToast(TEXT.sending, false);

      try {
        var res = await fetch(WORKER_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: field("firstName") + " " + field("lastName"),
            email: field("email"),
            message: buildMessage()
          })
        });
        var result = await res.json();
        if (result && result.success) {
          showToast(TEXT.sent, false);
          if (typeof gtag === "function") gtag("event", "generate_lead", { form: "parcel_request" });
          form.reset();
        } else {
          showToast(TEXT.failed, true);
        }
      } catch (err) {
        console.error("Parcel form error:", err);
        showToast(TEXT.failed, true);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
})();

/* GSAP-driven motion layer. Everything above already works without JS
   (progressive enhancement) — this only adds motion on top when GSAP
   loaded successfully and the user hasn't asked for reduced motion. */
(function () {
  "use strict";

  if (typeof gsap === "undefined") return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Hero entrance — plays once on load, never re-triggers on scroll. */
  var heroTitle = document.querySelector(".pk-hero h1");
  var heroSub = document.querySelector(".pk-hero-sub");

  if (heroTitle && heroSub && !reduceMotion) {
    gsap.set([heroTitle, heroSub], { opacity: 0, y: 22 });
    gsap.to([heroTitle, heroSub], {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.12,
      delay: 0.1
    });
  }

})();
