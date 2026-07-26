/* ============================================================
   SWEET EVENTS — interacción + conversión WhatsApp + chat IA
   ============================================================ */
(function () {
  "use strict";
  var CFG = window.SWEET_CONFIG || { whatsapp: "34650968800", phones: {}, chatApi: "" };

  /* ---------- WhatsApp helpers ---------- */

  function waUrl(message) {
    return "https://wa.me/" + CFG.whatsapp + "?text=" + encodeURIComponent(message);
  }

  // Mensaje por defecto de la página (definido en <body data-wa-msg="...">)
  var pageMsg = document.body.getAttribute("data-wa-msg") ||
    "Hola Sweet Events, me gustaría pedir información y disponibilidad.";

  // Cualquier elemento con [data-wa] abre WhatsApp con el mensaje de la página
  // o con su propio data-wa (si tiene texto).
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-wa]");
    if (!el) return;
    e.preventDefault();
    var msg = el.getAttribute("data-wa") || pageMsg;
    if (msg === "") msg = pageMsg;
    window.open(waUrl(msg), "_blank", "noopener");
    track("whatsapp_click", { location: el.getAttribute("data-wa-loc") || "generic" });
  });

  function track(name, params) {
    if (typeof window.gtag === "function") window.gtag("event", name, params || {});
  }

  /* ---------- Formulario → WhatsApp ---------- */

  document.querySelectorAll("form[data-wa-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var parts = ["Hola Sweet Events 👋"];
      if (d.get("servicio")) parts.push("Servicio: " + d.get("servicio"));
      if (d.get("nombre")) parts.push("Nombre: " + d.get("nombre"));
      if (d.get("fecha")) parts.push("Fecha prevista: " + d.get("fecha"));
      if (d.get("lugar")) parts.push("Lugar: " + d.get("lugar"));
      if (d.get("detalle")) parts.push("Detalles: " + d.get("detalle"));
      parts.push("¿Me podéis pasar información y disponibilidad?");
      window.open(waUrl(parts.join("\n")), "_blank", "noopener");
      track("wa_form_submit", { service: String(d.get("servicio") || "") });
    });
  });

  /* ---------- Nav ---------- */

  var nav = document.querySelector(".nav");
  var burger = document.querySelector(".burger");
  var links = document.querySelector(".nav-links");

  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (burger && links) {
    burger.addEventListener("click", function () {
      burger.classList.toggle("open");
      links.classList.toggle("open");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        burger.classList.remove("open");
        links.classList.remove("open");
      });
    });
  }

  /* ---------- Hero: capa cinematográfica + slideshow con indicadores ---------- */

  document.querySelectorAll(".hero").forEach(function (hero) {
    // Capas decorativas (grano, marco, scroll hint) sin tocar el HTML
    ["grain", "frame"].forEach(function (cls) {
      var d = document.createElement("div");
      d.className = cls;
      hero.appendChild(d);
    });
    var hint = document.createElement("div");
    hint.className = "scroll-hint";
    hint.textContent = "scroll";
    hero.appendChild(hint);

    var media = hero.querySelector(".hero-media");
    if (!media) return;
    var imgs = media.querySelectorAll("img");
    if (!imgs.length) return;
    imgs[0].classList.add("active");
    if (imgs.length < 2) return;

    // UI: contador 01/0N + puntos de progreso
    var ui = document.createElement("div");
    ui.className = "hero-ui";
    var count = document.createElement("span");
    count.className = "count";
    var dots = document.createElement("div");
    dots.className = "hero-dots";
    var dotBtns = [];
    imgs.forEach(function (_, idx) {
      var b = document.createElement("button");
      b.setAttribute("aria-label", "Imagen " + (idx + 1));
      b.addEventListener("click", function () { show(idx, true); });
      dots.appendChild(b);
      dotBtns.push(b);
    });
    ui.appendChild(count);
    ui.appendChild(dots);
    hero.appendChild(ui);

    var i = 0, timer = null;
    function paint() {
      dotBtns.forEach(function (b, idx) {
        b.classList.remove("on");
        if (idx === i) { void b.offsetWidth; b.classList.add("on"); }
      });
      count.innerHTML = "<b>0" + (i + 1) + "</b> / 0" + imgs.length;
    }
    function show(idx, manual) {
      imgs[i].classList.remove("active");
      i = idx % imgs.length;
      imgs[i].classList.add("active");
      paint();
      if (manual) restart();
    }
    function restart() {
      clearInterval(timer);
      timer = setInterval(function () { show(i + 1); }, 5200);
    }
    paint();
    restart();
  });

  /* ---------- Reveal on scroll ---------- */

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* ---------- Asistente (chat) ---------- */

  var panel = document.getElementById("chatPanel");
  var chatBtn = document.getElementById("chatFab");
  if (panel && chatBtn) {
    var log = panel.querySelector(".chat-log");
    var input = panel.querySelector(".chat-input input");
    var history = [];

    function openChat() {
      panel.classList.add("open");
      if (!log.children.length) {
        botSay("¡Hola! 👋 Soy Paula Cubo, tu asistente de Sweet Events. Puedo contarte cómo trabajamos, precios orientativos y disponibilidad.\n\n¿Qué te interesa?");
      }
    }
    chatBtn.addEventListener("click", function () {
      if (panel.classList.contains("open")) { panel.classList.remove("open"); } else { openChat(); }
    });

    // Apertura automática (una vez por sesión, pasados unos segundos)
    try {
      if (!sessionStorage.getItem("se_chat_seen")) {
        setTimeout(function () {
          sessionStorage.setItem("se_chat_seen", "1");
          openChat();
        }, 3500);
      }
    } catch (e) { /* navegación privada sin sessionStorage: no auto-abrimos */ }
    panel.querySelector(".chat-close").addEventListener("click", function () {
      panel.classList.remove("open");
    });

    panel.querySelectorAll(".chip").forEach(function (chip) {
      chip.addEventListener("click", function () { send(chip.textContent.trim()); });
    });

    panel.querySelector(".chat-input").addEventListener("submit", function (e) {
      e.preventDefault();
      if (input.value.trim()) send(input.value.trim());
    });

    function el(cls, text) {
      var m = document.createElement("div");
      m.className = "msg " + cls;
      m.textContent = text;
      log.appendChild(m);
      log.scrollTop = log.scrollHeight;
      return m;
    }
    function botSay(t) { el("bot", t); }

    function send(text) {
      el("user", text);
      input.value = "";
      history.push({ role: "user", content: text });
      if (CFG.chatApi) { askAI(); } else { askLocal(text); }
      track("chat_message", {});
    }

    function askAI() {
      var typing = el("bot typing", "Escribiendo…");
      fetch(CFG.chatApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-12), page: document.title }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          typing.remove();
          var reply = data.reply || "Ahora mismo no puedo responder. Escríbenos por WhatsApp y te atendemos al momento 😊";
          botSay(reply);
          history.push({ role: "assistant", content: reply });
        })
        .catch(function () {
          typing.remove();
          botSay("Ha habido un problema de conexión. Mejor hablamos por WhatsApp 👇");
          addWaHandoff("Hola, estaba usando el chat de la web y quiero más información.");
        });
    }

    /* Modo guiado (sin API): responde a los temas clave y deriva a WhatsApp */
    function askLocal(text) {
      var t = text.toLowerCase();
      var answer, wa;
      if (/boda|casar|novi/.test(t)) {
        answer = "En bodas somos un equipo de 4 profesionales (foto y vídeo) y trabajamos en toda Cataluña desde 1996. Reportaje natural, sin poses forzadas: gestos, luz y momentos reales.\n\nCuéntanos la fecha y el lugar por WhatsApp y te preparamos propuesta y disponibilidad en el día.";
        wa = "Hola Sweet Events, me caso y quiero información de fotografía/vídeo de boda. Fecha: __ Lugar: __";
      } else if (/fotomat/.test(t)) {
        answer = "Nuestro fotomatón incluye transporte, montaje, atrezzo, copias ilimitadas y galería digital para los invitados. Es el complemento estrella de bodas y eventos.\n\nDinos fecha y población por WhatsApp y te confirmamos disponibilidad y precio cerrado.";
        wa = "Hola Sweet Events, quiero información del fotomatón. Fecha: __ Población: __";
      } else if (/embaraz|newborn|bebé|bebe|premam/.test(t)) {
        answer = "Las sesiones de embarazo se hacen idealmente entre la semana 28 y 34, en estudio (Manresa o Vilanova), exterior o en casa. También hacemos newborn en los primeros 15 días del bebé.\n\nEscríbenos por WhatsApp y buscamos el mejor momento para ti.";
        wa = "Hola Sweet Events, quiero información de la sesión de embarazo/newborn.";
      } else if (/empresa|corporat|producto|marca|video/.test(t)) {
        answer = "Trabajamos fotografía y vídeo para empresas: producto, eventos corporativos, imagen de marca y contenido para web y redes. Hemos trabajado con Tous, Charles Heidsieck, Macsa ID o Consergra.\n\nCuéntanos tu proyecto por WhatsApp o llámanos al 938 738 476.";
        wa = "Hola Sweet Events, soy una empresa y quiero presupuesto para un proyecto de foto/vídeo.";
      } else if (/precio|tarifa|cuánto|cuanto|coste|presupuesto/.test(t)) {
        answer = "Cada proyecto es distinto y hacemos presupuesto cerrado sin sorpresas. Para darte un precio exacto necesitamos fecha, lugar y tipo de servicio.\n\nPor WhatsApp te respondemos normalmente en menos de 1 hora en horario de estudio.";
        wa = "Hola Sweet Events, quiero un presupuesto. Servicio: __ Fecha: __ Lugar: __";
      } else if (/hola|buenas|hey/.test(t)) {
        answer = "¡Hola! ¿Sobre qué servicio quieres información? Bodas, fotomatón, embarazo/newborn, empresas…";
      } else {
        answer = "¡Buena pregunta! Para responderte con detalle, lo mejor es que hables directamente con el equipo: por WhatsApp contestamos muy rápido.";
        wa = "Hola Sweet Events, tengo una consulta: " + text;
      }
      botSay(answer);
      if (wa) addWaHandoff(wa);
    }

    function addWaHandoff(msg) {
      var btn = document.createElement("button");
      btn.className = "chip";
      btn.style.alignSelf = "flex-start";
      btn.style.background = "#25d366";
      btn.style.color = "#fff";
      btn.style.borderColor = "transparent";
      btn.textContent = "Continuar por WhatsApp →";
      btn.addEventListener("click", function () {
        window.open(waUrl(msg), "_blank", "noopener");
        track("chat_wa_handoff", {});
      });
      log.appendChild(btn);
      log.scrollTop = log.scrollHeight;
    }
  }

  /* ---------- Año en el footer ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
