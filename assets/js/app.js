/* Lógica de la documentación. Los datos del equipo están en datos.js */
(function () {
  "use strict";
  const P = window.PROYECTO || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }
  };

  const AREAS = {
    pm: "Project Manager", hardware: "Lab. Hardware", so: "Lab. Sistemas Operativos",
    desarrollo: "Desarrollo de Software", aplicaciones: "Lab. Aplicaciones",
    io: "Investigación Operativa", seginfo: "Seguridad Informática"
  };

  const ROLES = {
    pm: { titulo: "Project Manager", clase: "a-pm", taller: "Coordina a todo el equipo · Scrum Master",
      tareas: ["Planifica los sprints y actualiza la carta Gantt", "Reporta los avances al auditor de los proyectos", "Mantiene la documentación y el control de cambios"] },
    desarrollo: { titulo: "Desarrollo", clase: "a-desarrollo", taller: "Desarrollo de Software",
      tareas: ["Programa el firmware del ESP32", "Lectura y calibración de sensores", "Publicación MQTT y reconexión automática"] },
    aplicaciones: { titulo: "Aplicaciones", clase: "a-aplicaciones", taller: "Laboratorio de Aplicaciones",
      tareas: ["Diseña el dashboard y la experiencia de usuario", "Gráficos en tiempo real e históricos", "Alertas visuales e identidad del proyecto"] },
    infraestructura: { titulo: "Infraestructura", clase: "a-so", taller: "Lab. de Sistemas Operativos y Lab. de Hardware",
      tareas: ["Instala y administra el servidor Linux y la red", "Broker MQTT, base de datos y backups", "Montaje físico, alimentación y gabinete del nodo"] }
  };

  const NODOS = {
    luz:       { nombre: "Nodo de luz (luxómetro)", lugar: "Aula 1", sensor: "BH1750", x: 120, y: 105 },
    presencia: { nombre: "Nodo de presencia (PIR)", lugar: "Aula 2", sensor: "PIR HC-SR501", x: 330, y: 105 },
    aire:      { nombre: "Nodo de calidad de aire (CO)", lugar: "Laboratorio de Hardware", sensor: "MQ-7", x: 550, y: 105 },
    consumo:   { nombre: "Nodo de consumo eléctrico", lugar: "Sala de Informática", sensor: "ACS712 / SCT-013", x: 775, y: 105 },
    ruido:     { nombre: "Nodo de ruido (dB)", lugar: "Pasillo / SUM", sensor: "KY-037", x: 330, y: 210 },
    suelo:     { nombre: "Nodo de humedad de suelo", lugar: "Patio / huerta", sensor: "Capacitivo v1.2", x: 230, y: 365 },
    red:       { nombre: "Nodo de estado de red (latencia)", lugar: "Sala de servidores", sensor: "Software (ping + RSSI)", x: 500, y: 320 }
  };
  const SRV = { x: 602, y: 319 };

  const COMPONENTES = [
    { img: "esp32-mini", nombre: "ESP32 mini", base: true, uso: "Microcontrolador con WiFi y Bluetooth: lee los sensores y envía los datos.", datos: [["Tensión", "3,3 V (VIN 5 V)"], ["Red", "WiFi 2,4 GHz"], ["ADC", "12 bits"]] },
    { img: "dht22", nombre: "DHT11", base: true, uso: "Mide temperatura y humedad relativa. Lo llevan todos los nodos.", datos: [["Rango", "−40 a 80 °C · 0–100 %"], ["Precisión", "±0,5 °C · ±2 %"], ["Interfaz", "Digital 1 cable"]] },
    { img: "lcd-16x2", nombre: "Display LCD 16x2 I2C", base: true, uso: "Muestra los valores en el propio nodo, sin depender del dashboard.", datos: [["Interfaz", "I2C (2 cables)"], ["Dirección", "0x27 / 0x3F"], ["Tensión", "5 V"]] },
    { img: "bateria-12v", nombre: "Batería 12 V", base: true, uso: "Respaldo de energía: el nodo sigue midiendo si se corta la luz.", datos: [["Tipo", "Plomo-ácido sellada"], ["Capacidad", "1,3 Ah (orientativo)"]] },
    { img: "fuente-lm2596", nombre: "Fuente + regulador LM2596", base: true, uso: "Baja los 12 V a 5 V estables para el ESP32 y los sensores.", datos: [["Entrada", "4,5 – 40 V"], ["Salida", "Ajustable, 5 V"], ["Corriente", "hasta 2 A"]] },
    { img: "placa-perforada", nombre: "Placa perforada", base: true, uso: "Versión definitiva soldada del circuito que se probó en protoboard.", datos: [["Medida", "7 × 9 cm (orientativo)"], ["Extras", "Borneras y headers hembra"]] },
    { img: "bh1750", nombre: "BH1750 (luxómetro)", nodo: "luz", uso: "Mide la iluminación en lux. Sirve para saber si un aula tiene luz suficiente o luces encendidas sin uso.", datos: [["Rango", "1 – 65535 lx"], ["Interfaz", "I2C (0x23)"]] },
    { img: "pir", nombre: "PIR HC-SR501", nodo: "presencia", uso: "Detecta movimiento de personas por infrarrojo. No identifica a nadie.", datos: [["Alcance", "hasta 7 m"], ["Salida", "Digital 3,3 V"]] },
    { img: "mq-gas", nombre: "MQ-7 (monóxido de carbono)", nodo: "aire", uso: "Detecta CO. Necesita precalentamiento y calibración; los valores son orientativos. Alternativa: MQ-135 (calidad de aire general).", datos: [["Rango", "20 – 2000 ppm"], ["Salida", "Analógica"], ["Calentador", "5 V · ~150 mA"]] },
    { img: "sonido", nombre: "KY-037 (sonido)", nodo: "ruido", uso: "Micrófono con salida analógica para estimar el nivel sonoro. Requiere calibrar contra un decibelímetro.", datos: [["Salida", "Analógica + digital"], ["Ajuste", "Potenciómetro"]] },
    { img: "acs712", nombre: "ACS712 (corriente)", nodo: "consumo", uso: "Mide corriente de una carga. Por seguridad, para 220 V usen un sensor no invasivo tipo pinza SCT-013 y nunca intervengan la instalación de la escuela.", datos: [["Versiones", "5 / 20 / 30 A"], ["Salida", "Analógica"]] },
    { img: "humedad-suelo", nombre: "Humedad de suelo capacitivo", nodo: "suelo", uso: "Mide la humedad de la tierra de la huerta. El capacitivo no se corroe como el resistivo.", datos: [["Tensión", "3,3 – 5 V"], ["Salida", "Analógica"]] },
    { img: "red-wifi", nombre: "Monitoreo de red", nodo: "red", uso: "No usa sensor extra: el ESP32 mide la señal WiFi (RSSI) y la latencia (ping) hacia el servidor.", datos: [["Mide", "RSSI dBm · ms"], ["Hardware", "Solo el ESP32"]] }
  ];

  /* ---------------------------------------------------------------- bindings */
  const nodo = NODOS[P.nodoAsignado] || NODOS.aire;
  // "Apellido, Nombre" -> "Apellido"
  const apellidos = (P.integrantes || []).map((m) => String(m.nombre).split(",")[0].trim()).filter(Boolean).join(" · ");
  const valores = Object.assign({}, P, { nodoNombre: nodo.nombre, semanasPorSprint: P.semanasPorSprint || 3, apellidos: apellidos || "A completar" });
  $$("[data-bind]").forEach((el) => { el.textContent = valores[el.dataset.bind] ?? ""; });
  document.title = (P.nombre || "Smart Campus IoT") + " · Documentación";

  /* ---------------------------------------------------------------- navegación */
  const pages = $$("main > section.page");
  const navList = $("#navList");
  function buildNav(filter = "") {
    const f = filter.trim().toLowerCase();
    const groups = new Map();
    pages.forEach((p) => {
      const txt = (p.dataset.num + " " + p.dataset.title + " " + p.textContent).toLowerCase();
      if (f && !txt.includes(f)) return;
      if (!groups.has(p.dataset.group)) groups.set(p.dataset.group, []);
      groups.get(p.dataset.group).push(p);
    });
    navList.innerHTML = groups.size ? [...groups].map(([g, ps], i) =>
      `<div class="nav-group${g === "Guía de uso" ? " nav-guia" : ""}"><button type="button" class="nav-toggle" aria-expanded="true" aria-controls="ng${i}"><span>${g === "Guía de uso" ? '<svg class="book" aria-hidden="true"><use href="#i-book"/></svg>' : ""}${esc(g)}</span><svg class="chev" aria-hidden="true"><use href="#i-chev"/></svg></button>` +
      `<div class="nav-items" id="ng${i}"><div>${ps.map((p) =>
        `<a href="#${p.id}"><span class="n">${esc(p.dataset.num)}</span><span>${esc(p.dataset.title)}</span></a>`).join("")}</div></div></div>`
    ).join("") : `<p class="nav-empty">No hay apartados con “${esc(filter)}”.</p>`;
    // Mientras se busca, todos los grupos con resultados quedan abiertos
    if (!f) collapseGroups();
    markCurrent();
  }
  function setGroup(btn, open) {
    btn.setAttribute("aria-expanded", String(open));
    $("#" + btn.getAttribute("aria-controls")).toggleAttribute("data-closed", !open);
  }
  // Solo queda desplegado el grupo del apartado que se está viendo
  function collapseGroups() {
    const id = currentId();
    $$(".nav-group", navList).forEach((g) => setGroup($(".nav-toggle", g), !!$(`a[href="#${id}"]`, g)));
  }
  navList.addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-toggle");
    if (btn) setGroup(btn, btn.getAttribute("aria-expanded") !== "true");
  });
  function markCurrent() {
    const id = currentId();
    $$("a", navList).forEach((a) => {
      if (a.getAttribute("href") === "#" + id) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }
  function currentId() {
    const h = decodeURIComponent(location.hash.slice(1));
    return pages.some((p) => p.id === h) ? h : "inicio";
  }
  function show() {
    const id = currentId();
    const idx = pages.findIndex((p) => p.id === id);
    pages.forEach((p) => (p.hidden = p.id !== id));
    const page = pages[idx];
    if (!$(".crumbs", page)) {
      const c = document.createElement("div");
      c.className = "crumbs";
      c.innerHTML = `<span>${esc(P.nombre)}</span><span>/</span><span>${esc(page.dataset.group)}</span><span>/</span><span>${esc((page.dataset.num ? page.dataset.num + ". " : "") + page.dataset.title)}</span>`;
      page.prepend(c);
    }
    const prev = pages[idx - 1], next = pages[idx + 1];
    $("#pager").innerHTML =
      (prev ? `<a href="#${prev.id}"><small>← Anterior</small>${esc((prev.dataset.num ? prev.dataset.num + ". " : "") + prev.dataset.title)}</a>` : "") +
      (next ? `<a class="next" href="#${next.id}"><small>Siguiente →</small>${esc((next.dataset.num ? next.dataset.num + ". " : "") + next.dataset.title)}</a>` : "");
    if (!$("#navSearch").value.trim()) collapseGroups();
    markCurrent();
    document.body.classList.remove("nav-open");
    $("#menuBtn").setAttribute("aria-expanded", "false");
    window.scrollTo(0, 0);
    if (id === "gantt") scrollGanttToToday();
    // Reinicia las animaciones de los gráficos cada vez que se entra al apartado
    pages.forEach((p) => p.classList.remove("mg-run"));
    void page.offsetWidth;
    page.classList.add("mg-run");
  }
  window.addEventListener("hashchange", () => { show(); $("#contenido").focus({ preventScroll: true }); });
  $("#navSearch").addEventListener("input", (e) => buildNav(e.target.value));

  $("#menuBtn").addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-open");
    $("#menuBtn").setAttribute("aria-expanded", String(open));
  });
  $("#scrim").addEventListener("click", () => { document.body.classList.remove("nav-open"); $("#menuBtn").setAttribute("aria-expanded", "false"); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") document.body.classList.remove("nav-open"); });

  /* ---------------------------------------------------------------- tema */
  const themeBtn = $("#themeBtn");
  function isDark() {
    const t = document.documentElement.dataset.theme;
    return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function paintThemeIcon() { $("use", themeBtn).setAttribute("href", isDark() ? "#i-sun" : "#i-moon"); }
  themeBtn.addEventListener("click", () => {
    const t = isDark() ? "light" : "dark";
    document.documentElement.dataset.theme = t;
    store.set("sc-theme", t);
    paintThemeIcon();
  });
  paintThemeIcon();

  /* ---------------------------------------------------------------- tablas simples */
  $("#tablaCambios").innerHTML = (P.cambios || []).map((c) =>
    `<tr><td class="mono">${esc(c.version)}</td><td>${esc(c.fecha || "Pendiente")}</td><td>${esc(c.responsable)}</td><td>${esc(c.detalle)}</td></tr>`).join("");

  $("#tablaDocentes").innerHTML = (P.docentes || []).map((d) => `<tr><td>${esc(d.asignatura)}</td><td>${esc(d.nombre)}</td></tr>`).join("");

  const pesos = (n) => "$ " + Number(n || 0).toLocaleString("es-AR");
  let total = 0;
  $("#tablaBOM").innerHTML = (P.bom || []).map((b) => {
    const sub = (b.cant || 0) * (b.unit || 0); total += sub;
    return `<tr><td>${esc(b.item)}</td><td class="num">${esc(b.cant)}</td><td class="num">${b.unit ? pesos(b.unit) : "—"}</td><td class="num">${sub ? pesos(sub) : "—"}</td></tr>`;
  }).join("") + `<tr><td><b>Total por nodo</b></td><td></td><td></td><td class="num"><b>${total ? pesos(total) : "a completar"}</b></td></tr>`;

  const ESTADOS = { ok: ["lvl-bajo", "OK"], falla: ["lvl-alto", "Falla"], pendiente: ["lvl-medio", "Pendiente"] };
  $("#tablaPruebas").innerHTML = (P.pruebas || []).map((t) => {
    const [cls, txt] = ESTADOS[t.estado] || ESTADOS.pendiente;
    return `<tr><td>${esc(t.fecha || "—")}</td><td>${esc(t.prueba)}</td><td>${esc(t.esperado)}</td><td>${esc(t.resultado || "—")}</td><td><span class="lvl ${cls}">${txt}</span></td></tr>`;
  }).join("");

  /* ---------------------------------------------------------------- equipo */
  const iniciales = (n) => {
    const partes = String(n).replace(",", " ").split(/\s+/).filter(Boolean);
    return partes.length ? (partes[0][0] + (partes[1] ? partes[1][0] : "")).toUpperCase() : "?";
  };
  $("#listaIntegrantes").innerHTML = (P.integrantes || []).map((m) => {
    const r = ROLES[m.rol] || ROLES.pm;
    const foto = m.foto ? `<img src="${esc(m.foto)}" alt="" loading="lazy">` : esc(iniciales(m.nombre));
    const gh = m.github ? `<p><a href="https://github.com/${esc(m.github)}" target="_blank" rel="noopener">@${esc(m.github)}</a></p>` : "";
    return `<div class="card member ${r.clase}"><div class="avatar" aria-hidden="true">${foto}</div><div><h3>${esc(m.nombre)}</h3><span class="tag ${r.clase}">${esc(r.titulo)}</span><p>${esc(r.taller)}</p>${gh}</div></div>`;
  }).join("");
  $("#listaRoles").innerHTML = Object.values(ROLES).map((r) =>
    `<div class="card area-card ${r.clase}"><span class="tag ${r.clase}">${esc(r.titulo)}</span><h3>${esc(r.taller)}</h3><ul>${r.tareas.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>`).join("");

  /* ---------------------------------------------------------------- mapa de nodos */
  const ns = "http://www.w3.org/2000/svg";
  const enlaces = $("#enlaces"), nodosMapa = $("#nodosMapa");
  Object.entries(NODOS).forEach(([k, n], i) => {
    const l = document.createElementNS(ns, "path");
    l.setAttribute("d", `M${n.x} ${n.y} L${SRV.x} ${SRV.y}`);
    enlaces.appendChild(l);
    const g = document.createElementNS(ns, "g");
    const mine = k === P.nodoAsignado;
    g.innerHTML = `<circle cx="${n.x}" cy="${n.y}" r="${mine ? 16 : 13}" class="${mine ? "d-accent" : "d-box"}"/>` +
      `<text class="d-title" x="${n.x}" y="${n.y + 4}" text-anchor="middle" font-size="11">N${i + 1}</text>` +
      `<text class="d-small" x="${n.x}" y="${n.y + 30}" text-anchor="middle">${esc(n.nombre.replace(/^Nodo de /, "").replace(/ \(.*\)/, ""))}</text>`;
    nodosMapa.appendChild(g);
  });
  $("#tablaNodos").innerHTML = Object.entries(NODOS).map(([k, n], i) =>
    `<tr${k === P.nodoAsignado ? ' style="font-weight:600"' : ""}><td>N${i + 1} · ${esc(n.nombre)}${k === P.nodoAsignado ? ' <span class="tag a-desarrollo">este equipo</span>' : ""}</td><td>${esc(n.lugar)}</td><td>${esc(n.sensor)}</td><td>ESP32 + DHT22 + LCD</td></tr>`).join("");

  /* ---------------------------------------------------------------- componentes */
  const card = (c) => {
    const mine = c.nodo && c.nodo === P.nodoAsignado;
    return `<article class="card comp${mine ? " destacado" : ""}">
      <figure><img src="assets/img/componentes/${c.img}.jpg" alt="Ilustración: ${esc(c.nombre)}" width="240" height="160" loading="lazy"></figure>
      <div class="body">${mine ? '<span class="badge-asignado">Sensor de este equipo</span>' : ""}
        ${c.nodo ? `<span class="tag a-hardware" style="margin-bottom:6px">${esc(NODOS[c.nodo].nombre.replace(/ \(.*\)/, ""))}</span>` : ""}
        <h3>${esc(c.nombre)}</h3><p>${esc(c.uso)}</p>
        <dl>${c.datos.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join("")}</dl></div></article>`;
  };
  $("#compBase").innerHTML = COMPONENTES.filter((c) => c.base).map(card).join("");
  const esp = COMPONENTES.filter((c) => c.nodo).sort((a, b) => (b.nodo === P.nodoAsignado) - (a.nodo === P.nodoAsignado));
  $("#compEsp").innerHTML = esp.map(card).join("");

  /* ---------------------------------------------------------------- Gantt */
  const DAY = 86400000;
  const d = (s) => new Date(s + "T00:00:00");
  const G0 = d("2026-03-01"), G1 = d("2026-12-01");
  const span = G1 - G0;
  const pct = (date) => Math.max(0, Math.min(100, ((date - G0) / span) * 100));
  const MESES = ["Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov"];

  $("#ganttLegend").innerHTML = Object.entries(AREAS).map(([k, v]) => `<span class="tag a-${k}">${esc(v)}</span>`).join("");

  let rows = `<div class="g-row g-head"><div class="g-label">Tarea</div><div class="g-track">${MESES.map((m) => `<div>${m}</div>`).join("")}</div></div>`;
  // fila de sprints
  const semanas = P.semanasPorSprint || 3;
  let sprints = "", s = d("2026-03-02"), nro = 1;
  while (s < d("2026-11-28")) {
    const e = new Date(s.getTime() + semanas * 7 * DAY - 3 * DAY);
    sprints += `<div class="g-sprint" style="left:${pct(s)}%;width:${pct(e) - pct(s)}%" title="Sprint ${nro}">S${nro}</div>`;
    s = new Date(s.getTime() + semanas * 7 * DAY); nro++;
  }
  rows += `<div class="g-row"><div class="g-label"><span class="txt">Sprints (${semanas} semanas)</span></div><div class="g-track">${sprints}</div></div>`;

  let fila = 0;   // orden de aparición en la animación
  (P.gantt || []).forEach((et) => {
    const ini = et.tareas.map((t) => d(t.inicio)), fin = et.tareas.map((t) => d(t.fin));
    const a = new Date(Math.min(...ini)), b = new Date(Math.max(...fin));
    rows += `<div class="g-row g-stage"><div class="g-label"><span class="txt">${esc(et.etapa)}</span></div><div class="g-track"><div class="g-stagebar" style="--i:${fila++};left:${pct(a)}%;width:${pct(new Date(b.getTime() + DAY)) - pct(a)}%"></div></div></div>`;
    et.tareas.forEach((t) => {
      const area = AREAS[t.area] ? t.area : "pm";
      const rango = `${t.inicio} a ${t.fin}`;
      const marca = t.hito
        ? `<div class="g-hito a-${area}" style="--i:${fila++};left:${pct(d(t.inicio))}%" title="Hito: ${esc(t.nombre)} · ${esc(t.inicio)}"></div>`
        : `<div class="g-bar a-${area}" style="--i:${fila++};left:${pct(d(t.inicio))}%;width:${pct(new Date(d(t.fin).getTime() + DAY)) - pct(d(t.inicio))}%" title="${esc(t.nombre)} · ${esc(rango)}"></div>`;
      rows += `<div class="g-row"><div class="g-label a-${area}"><span class="dot"></span><span class="txt">${t.hito ? "◆ " : ""}${esc(t.nombre)}<span class="sr-only"> (${esc(AREAS[area])}, ${esc(rango)})</span></span></div><div class="g-track">${marca}</div></div>`;
    });
  });

  // overlay: líneas de mes, receso y hoy
  let over = "";
  for (let m = 1; m < 9; m++) over += `<div class="g-month" style="left:${pct(new Date(2026, 2 + m, 1))}%"></div>`;
  (P.receso || []).forEach((r) => {
    over += `<div class="g-receso" style="left:${pct(d(r.inicio))}%;width:${pct(new Date(d(r.fin).getTime() + DAY)) - pct(d(r.inicio))}%" title="${esc(r.nombre)}"></div>`;
  });
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  if (hoy >= G0 && hoy < G1) over += `<div class="g-today" style="left:${pct(hoy)}%"><span>Hoy</span></div>`;
  $("#gantt-chart").innerHTML = `<div class="gantt-inner">${rows}<div class="g-overlay">${over}</div></div>`;

  function scrollGanttToToday() {
    const box = $("#gantt-chart"), t = $(".g-today", box);
    if (!box || !t || box.scrollWidth <= box.clientWidth) return;
    requestAnimationFrame(() => { box.scrollLeft = Math.max(0, t.offsetLeft + $(".g-label", box).offsetWidth - box.clientWidth / 2); });
  }

  /* ---------------------------------------------------------------- Gantt en Google Sheets */
  const sheetUrl = (() => {
    try {
      const u = new URL(P.ganttSheetUrl || "");
      return u.protocol === "https:" && u.hostname === "docs.google.com" ? u.href : "";
    } catch (e) { return ""; }
  })();
  if (sheetUrl) {
    // widget=true y headers=false muestran la hoja limpia, sin el encabezado de Google
    const embed = new URL(sheetUrl);
    if (/\/pubhtml/.test(embed.pathname)) { embed.searchParams.set("widget", "true"); embed.searchParams.set("headers", "false"); }
    $("#sheetFrame").src = embed.href;
    $("#sheetFrame").hidden = false;
    $("#sheetEmpty").hidden = true;
    $("#sheetOpen").href = sheetUrl;
    $("#sheetOpen").hidden = false;
    $("#sheetEstado").className = "status on";
    $("#sheetEstado").textContent = "Planilla conectada";
  } else if (P.ganttSheetUrl) {
    $("#sheetEstado").textContent = "Enlace no válido: debe ser de docs.google.com";
  }

  /* ---------------------------------------------------------------- visor del proyecto */
  const frame = $("#viewerFrame"), empty = $("#viewerEmpty"), input = $("#viewerInput"), open = $("#viewerOpen");
  const validUrl = (u) => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ""; } catch (e) { return ""; } };
  function load(url) {
    const u = validUrl(url);
    if (!u) {
      frame.hidden = true; frame.removeAttribute("src"); empty.hidden = false;
      open.setAttribute("aria-disabled", "true"); open.removeAttribute("href"); open.style.opacity = ".5";
      return;
    }
    input.value = u; frame.src = u; frame.hidden = false; empty.hidden = true;
    open.href = u; open.removeAttribute("aria-disabled"); open.style.opacity = "";
  }
  const oficial = validUrl(P.previewUrl || "");
  load(oficial || store.get("sc-preview-test") || "");
  $("#viewerForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const u = validUrl(input.value.trim());
    if (!oficial) store.set("sc-preview-test", u || null);
    load(u);
  });
  $("#viewerReload").addEventListener("click", () => { if (frame.src) frame.src = frame.src; });
  $$(".seg button").forEach((b) => b.addEventListener("click", () => {
    $$(".seg button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    frame.style.width = b.dataset.w;
    frame.style.maxWidth = "100%";
  }));

  const link = (u, txt) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(txt || u)}</a>`;
  $("#accesoPreview").innerHTML = oficial ? link(oficial) : 'Sin publicar todavía. Completar <code>previewUrl</code> en <code>datos.js</code>.';
  $("#accesoRepo").innerHTML = validUrl(P.repoUrl || "") ? link(P.repoUrl) : 'Sin cargar. Completar <code>repoUrl</code> en <code>datos.js</code>.';
  $("#estadoPublicacion").innerHTML = oficial ? '<span class="status on">Publicado</span>' : '<span class="status off">Sin publicar</span>';

  /* ---------------------------------------------------------------- motion graphics */
  const sinMovimiento = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (sinMovimiento) $$(".mg-packets").forEach((g) => g.remove());

  // Pulso sobre el nodo del equipo en el mapa
  const mio = NODOS[P.nodoAsignado];
  if (mio) {
    const ring = document.createElementNS(ns, "circle");
    ring.setAttribute("cx", mio.x); ring.setAttribute("cy", mio.y); ring.setAttribute("r", 16);
    ring.setAttribute("class", "mg-pulse");
    nodosMapa.prepend(ring);
  }

  // Cada diagrama SVG aparece por partes: las cajas suben, las líneas se dibujan
  $$("figure.diagram svg").forEach((svg) => {
    let i = 0;
    $$("rect.d-box, rect.d-accent, rect.d-dash, circle.d-box, circle.d-accent, text, path.d-line, .d-line path, .resp path, path.mg-line", svg)
      .forEach((el) => {
        if (el.hasAttribute("transform") || el.closest("g[transform], .mg-packets")) return;
        const linea = el.tagName === "path" && !el.classList.contains("d-dash") && !el.closest("#enlaces");
        el.classList.add(linea ? "mg-draw" : "mg-el");
        if (linea) el.setAttribute("pathLength", "1");
        el.style.setProperty("--i", Math.min(i++, 40));
      });
  });
  $$(".flow span").forEach((el, k) => el.style.setProperty("--i", k));
  $$(".g-sprint").forEach((el, k) => el.style.setProperty("--i", k));

  /* ---------------------------------------------------------------- inicio */
  buildNav();
  show();
})();
