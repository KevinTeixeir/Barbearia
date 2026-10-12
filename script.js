(function () {
  // Fontes do Google carregam sem travar a página; a barra de carregamento cobre a espera.
  var fontsDone = false, fontsCb = null;
  (function () {
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Hanken+Grotesk:wght@400;500;600;700&display=swap";
    function done() { fontsDone = true; if (fontsCb) fontsCb(); }
    l.onload = function () {
      if (document.fonts && document.fonts.load) {
        Promise.all([document.fonts.load('800 1em "Big Shoulders Display"'), document.fonts.load('400 1em "Hanken Grotesk"')]).then(done, done);
      } else { done(); }
    };
    l.onerror = done;
    document.head.appendChild(l);
  })();

  // ---- Configuração da barbearia (troque aqui) ----
  var CONFIG = {
    name: "Barbearia Navalha",
    whatsapp: "5522988187355",           // DDI + DDD + número, só dígitos
    address: "Rua Exemplo, 123 · Centro",
    openMin: 9 * 60,                      // abre às 9h
    closeMin: 17 * 60,                    // fecha às 17h
    stepMin: 30,                          // intervalo entre horários na grade
    durationMin: 60,                      // duração de cada corte
    closedDays: [0],                      // 0 = domingo
    openDaysShown: 6
  };
  var SERVICES = [
    { id: "maquina", name: "Máquina", desc: "Corte na máquina, com acabamento nas laterais e nuca.", price: 30 },
    { id: "maq-tes", name: "Máquina e tesoura", desc: "Laterais na máquina e topo na tesoura, no tamanho que você pedir.", price: 40 },
    { id: "completo", name: "Máquina, tesoura e barba", desc: "O corte completo com barba aparada na navalha e toalha quente.", price: 55 },
    { id: "pezinho", name: "Pezinho", desc: "Só o contorno e o acabamento do corte, para manter o visual em dia.", price: 15 }
  ];
  // Cada barbeiro tem agenda própria: horário de trabalho e dias de folga independentes.
  var BARBERS = [
    { id: "rafael", name: "Rafael", role: "Degradê e barba", openMin: 9 * 60, closeMin: 17 * 60, closedDays: [0] },
    { id: "diego", name: "Diego", role: "Tesoura e cortes clássicos", openMin: 9 * 60, closeMin: 17 * 60, closedDays: [0] }
  ];
  var PAYMENTS = ["Pix", "Dinheiro", "Cartão de débito", "Cartão de crédito"];
  var STORE_KEY = "barbearia-navalha-reservas-v2";

  document.getElementById("brand-name").textContent = CONFIG.name;
  document.getElementById("addr").textContent = CONFIG.address;

  var $ = function (id) { return document.getElementById(id); };
  var state = { barber: null, date: null, time: null, service: null, pay: null };
  var memory = {};

  function loadBookings() {
    try { var raw = localStorage.getItem(STORE_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
    return memory;
  }
  function saveBookings(b) {
    memory = b;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(b)); } catch (e) {}
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function fmt(min) { return pad(Math.floor(min / 60)) + ":" + pad(min % 60); }
  function keyOf(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function money(v) { return "R$ " + v.toFixed(2).replace(".", ","); }
  function dateFromKey(k) { var p = k.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function longDate(k) {
    var d = dateFromKey(k);
    return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
  }

  function barberById(id) { return BARBERS.filter(function (b) { return b.id === id; })[0] || null; }
  function barber() { return barberById(state.barber); }
  function allStarts(b) {
    b = b || barber();
    var out = [];
    if (!b) return out;
    for (var t = b.openMin; t + CONFIG.durationMin <= b.closeMin; t += CONFIG.stepMin) out.push(t);
    return out;
  }
  function isTaken(dateKey, t, bid) {
    var perBarber = loadBookings()[bid || state.barber] || {};
    var list = perBarber[dateKey] || [];
    for (var i = 0; i < list.length; i++) {
      var b = list[i];
      if (t < b + CONFIG.durationMin && b < t + CONFIG.durationMin) return true;
    }
    return false;
  }
  function isPast(dateKey, t) {
    var now = new Date();
    if (dateKey !== keyOf(now)) return false;
    return t <= now.getHours() * 60 + now.getMinutes();
  }
  function isFree(dateKey, t, bid) { return !isTaken(dateKey, t, bid) && !isPast(dateKey, t); }

  function buildDays() {
    var out = [], d = new Date(), bb = barber();
    if (!bb) return out;
    d.setHours(0, 0, 0, 0);
    for (var guard = 0; out.length < CONFIG.openDaysShown && guard < 30; guard++) {
      if (bb.closedDays.indexOf(d.getDay()) === -1) {
        var k = keyOf(d);
        var any = allStarts().some(function (t) { return isFree(k, t); });
        if (any || k !== keyOf(new Date())) out.push(k);
      }
      d.setDate(d.getDate() + 1);
    }
    return out;
  }
  var days = [];

  function renderDays() {
    var box = $("days");
    box.textContent = "";
    days.forEach(function (k) {
      var d = dateFromKey(k);
      var b = document.createElement("button");
      b.type = "button"; b.className = "day"; b.dataset.date = k;
      b.setAttribute("aria-pressed", String(state.date === k));
      var s = document.createElement("small");
      s.textContent = k === keyOf(new Date()) ? "Hoje" : d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
      var n = document.createElement("strong");
      n.textContent = pad(d.getDate()) + "/" + pad(d.getMonth() + 1);
      b.appendChild(s); b.appendChild(n);
      box.appendChild(b);
    });
  }

  function renderSlots() {
    var box = $("slots");
    box.textContent = "";
    if (!barber() || !state.date) {
      var em = document.createElement("p");
      em.className = "empty";
      em.textContent = barber() ? "Sem horários livres nos próximos dias para este barbeiro." : "Escolha um barbeiro no passo 1 para ver os horários dele.";
      box.appendChild(em);
      return;
    }
    allStarts().forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "slot"; b.dataset.time = String(t);
      b.textContent = fmt(t);
      var free = isFree(state.date, t);
      b.disabled = !free;
      var sel = state.time === t && free;
      b.setAttribute("aria-pressed", String(sel));
      b.setAttribute("aria-label", fmt(t) + (free ? "" : ", indisponível"));
      box.appendChild(b);
    });
    var hint = $("slot-hint");
    if (state.time != null && isFree(state.date, state.time)) {
      hint.textContent = "";
      var b1 = document.createElement("b");
      b1.textContent = "Seu corte: " + fmt(state.time) + " às " + fmt(state.time + CONFIG.durationMin) + ".";
      hint.appendChild(b1);
      hint.appendChild(document.createTextNode(" Os horários dentro dessa hora ficam indisponíveis para outros clientes."));
    } else {
      hint.textContent = "Cada atendimento dura 1 hora. Ao reservar, os horários dentro dessa hora ficam indisponíveis para outros clientes.";
    }
  }

  function renderServices() {
    var box = $("services");
    box.textContent = "";
    SERVICES.forEach(function (s) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "svc"; b.dataset.id = s.id;
      b.setAttribute("aria-pressed", String(state.service === s.id));
      var h = document.createElement("h3"); h.textContent = s.name;
      var p = document.createElement("p"); p.textContent = s.desc;
      var row = document.createElement("div"); row.className = "row";
      var pr = document.createElement("span"); pr.className = "price"; pr.textContent = money(s.price);
      var du = document.createElement("span"); du.className = "dur"; du.textContent = "1 hora";
      row.appendChild(pr); row.appendChild(du);
      b.appendChild(h); b.appendChild(p); b.appendChild(row);
      box.appendChild(b);
    });
  }

  function svc() { return SERVICES.filter(function (s) { return s.id === state.service; })[0] || null; }
  function ready() { return barber() && state.date &&state.time != null && isFree(state.date, state.time) && svc(); }

  function renderBar() {
    var sum = $("sum"), s = svc();
    sum.textContent = "";
    var b = document.createElement("b"), sp = document.createElement("span");
    var hasTime = state.time != null && isFree(state.date, state.time);
    var bn = barber() ? barber().name : null;
    if (hasTime) {
      b.textContent = longDate(state.date) + " · " + fmt(state.time) + " · " + bn;
      sp.textContent = s ? s.name + " · " + money(s.price) : "Falta escolher o serviço.";
    } else {
      b.textContent = bn ? "Barbeiro: " + bn : "Nenhum horário escolhido";
      sp.textContent = s ? s.name + " · " + money(s.price) : "Selecione barbeiro, dia, horário e serviço.";
    }
    sum.appendChild(b); sum.appendChild(sp);
    $("confirm").disabled = !ready();
  }
  function nextFree(b) {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    for (var i = 0; i < 21; i++) {
      if (b.closedDays.indexOf(d.getDay()) === -1) {
        var k = keyOf(d), starts = allStarts(b);
        for (var j = 0; j < starts.length; j++) {
          if (isFree(k, starts[j], b.id)) return { key: k, t: starts[j] };
        }
      }
      d.setDate(d.getDate() + 1);
    }
    return null;
  }

  function renderBarbers() {
    var box = $("barbers");
    box.textContent = "";
    BARBERS.forEach(function (b) {
      var el = document.createElement("button");
      el.type = "button"; el.className = "barber"; el.dataset.id = b.id;
      el.setAttribute("aria-pressed", String(state.barber === b.id));
      var av = document.createElement("span"); av.className = "avatar"; av.setAttribute("aria-hidden", "true"); av.textContent = b.name.charAt(0);
      var info = document.createElement("span"); info.className = "info";
      var nm = document.createElement("span"); nm.className = "name"; nm.textContent = b.name;
      var ro = document.createElement("span"); ro.className = "role"; ro.textContent = b.role;
      var nx = document.createElement("span"); nx.className = "next";
      var nf = nextFree(b);
      if (nf) {
        var when = nf.key === keyOf(new Date()) ? "hoje" : dateFromKey(nf.key).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).replace(".", "");
        nx.textContent = "Próximo livre: " + when + " às " + fmt(nf.t);
      } else {
        nx.textContent = "Sem horários nos próximos dias";
      }
      info.appendChild(nm); info.appendChild(ro); info.appendChild(nx);
      el.appendChild(av); el.appendChild(info);
      box.appendChild(el);
    });
  }
  $("barbers").addEventListener("click", function (e) {
    var b = e.target.closest(".barber"); if (!b) return;
    state.barber = b.dataset.id; state.time = null;
    days = buildDays(); state.date = days[0] || null;
    renderBarbers(); renderDays(); renderSlots(); renderBar();
  });

  // ---- cancelamento ----
  var MINE_KEY = "barbearia-navalha-minhas-v1";
  var memMine = [];
  var mineConfirm = null, mineNotice = null, lastBooking = null;

  function loadMine() {
    try { var raw = localStorage.getItem(MINE_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
    return memMine;
  }
  function saveMine(list) {
    memMine = list;
    try { localStorage.setItem(MINE_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function bookingEnded(b) {
    return dateFromKey(b.date).getTime() + (b.time + CONFIG.durationMin) * 60000 < Date.now();
  }
  // Remove o agendamento da lista do cliente e libera o horário na agenda do barbeiro.
  function cancelBooking(id) {
    var found = null;
    var list = loadMine().filter(function (b) { if (b.id === id) { found = b; return false; } return true; });
    if (!found) return null;
    saveMine(list);
    var all = loadBookings();
    var arr = (all[found.barber] || {})[found.date] || [];
    var idx = arr.indexOf(found.time);
    if (idx > -1) { arr.splice(idx, 1); saveBookings(all); }
    return found;
  }
  function cancelLink(b) {
    var br = barberById(b.barber);
    var msg = "Olá! Preciso *cancelar* meu agendamento na " + CONFIG.name + ".\n\n" +
      "*Nome:* " + b.name + "\n" +
      "*Barbeiro:* " + (br ? br.name : "") + "\n" +
      "*Data:* " + longDate(b.date) + "\n" +
      "*Horário:* " + fmt(b.time) + " às " + fmt(b.time + CONFIG.durationMin) + "\n\n" +
      "Obrigado!";
    return "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(msg);
  }
  function smallBtn(label, act, id, cls) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "small " + (cls || ""); b.dataset.act = act; b.dataset.id = id; b.textContent = label;
    return b;
  }
  function renderMine() {
    var list = loadMine().filter(function (b) { return !bookingEnded(b); });
    var ul = $("mine-list");
    ul.textContent = "";
    list.forEach(function (b) {
      var br = barberById(b.barber);
      var li = document.createElement("li"); li.className = "mine-item";
      var what = document.createElement("div"); what.className = "what";
      var t = document.createElement("b"); t.textContent = longDate(b.date) + " · " + fmt(b.time);
      var d = document.createElement("span"); d.textContent = (br ? br.name : "") + " · " + b.service + " · " + money(b.price);
      what.appendChild(t); what.appendChild(d);
      var btns = document.createElement("div"); btns.className = "btns";
      if (mineConfirm === b.id) {
        btns.appendChild(smallBtn("Sim, cancelar", "yes", b.id, "danger solid"));
        btns.appendChild(smallBtn("Manter", "no", b.id, ""));
      } else {
        btns.appendChild(smallBtn("Cancelar", "ask", b.id, "danger"));
      }
      li.appendChild(what); li.appendChild(btns);
      ul.appendChild(li);
    });
    var note = $("mine-note");
    note.textContent = "";
    if (mineNotice) {
      note.appendChild(document.createTextNode("Horário liberado. Se você já tinha enviado a mensagem, "));
      var a = document.createElement("a");
      a.href = mineNotice; a.target = "_blank"; a.rel = "noopener"; a.textContent = "avise a barbearia no WhatsApp";
      note.appendChild(a);
      note.appendChild(document.createTextNode("."));
      note.hidden = false;
    } else {
      note.hidden = true;
    }
    $("mine").hidden = list.length === 0 && !mineNotice;
  }
  $("mine-list").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-act]"); if (!b) return;
    var act = b.dataset.act;
    if (act === "ask") mineConfirm = b.dataset.id;
    else if (act === "no") mineConfirm = null;
    else if (act === "yes") {
      var f = cancelBooking(b.dataset.id);
      mineConfirm = null;
      if (f) mineNotice = cancelLink(f);
      renderSlots(); renderBarbers(); renderBar();
    }
    renderMine();
  });

  // cancelar pela página de agradecimento
  $("t-cancel").addEventListener("click", function () {
    $("t-cancel-row").hidden = true; $("t-confirm").hidden = false;
  });
  $("t-no").addEventListener("click", function () {
    $("t-confirm").hidden = true; $("t-cancel-row").hidden = false;
    $("t-note").textContent = "Tudo certo. Use o botão abaixo para abrir o WhatsApp e enviar seus dados.";
  });
  $("t-yes").addEventListener("click", function () {
    var f = lastBooking ? cancelBooking(lastBooking.id) : null;
    lastBooking = null;
    $("t-confirm").hidden = true; $("t-cancel-row").hidden = true; $("t-link").hidden = true;
    $("t-note").textContent = "Agendamento cancelado. O horário voltou a ficar livre.";
    if (f) { var n = $("t-notify"); n.href = cancelLink(f); n.hidden = false; }
    renderMine();
  });

  function renderAll() { renderBarbers(); renderDays(); renderSlots(); renderServices(); renderBar(); renderMine(); }

  $("days").addEventListener("click", function (e) {
    var b = e.target.closest(".day"); if (!b) return;
    state.date = b.dataset.date; state.time = null;
    renderDays(); renderSlots(); renderBar();
  });
  $("slots").addEventListener("click", function (e) {
    var b = e.target.closest(".slot"); if (!b || b.disabled) return;
    state.time = +b.dataset.time;
    renderSlots(); renderBar();
  });
  $("services").addEventListener("click", function (e) {
    var b = e.target.closest(".svc"); if (!b) return;
    state.service = b.dataset.id;
    renderServices(); renderBar();
  });

  // ---- popup ----
  var lastFocus = null;
  function renderPays() {
    var box = $("pays");
    box.textContent = "";
    PAYMENTS.forEach(function (p) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "pay"; b.textContent = p; b.dataset.pay = p;
      b.setAttribute("aria-pressed", String(state.pay === p));
      box.appendChild(b);
    });
  }
  function openModal() {
    if (!ready()) return;
    lastFocus = document.activeElement;
    var s = svc();
    $("m-recap").textContent = "Com " + barber().name + " · " + longDate(state.date) + ", " + fmt(state.time) + " às " + fmt(state.time + CONFIG.durationMin) + " · " + s.name + " · " + money(s.price);
    $("err-name").textContent = ""; $("err-pay").textContent = "";
    renderPays();
    $("scrim").hidden = false;
    setTimeout(function () { $("f-name").focus(); }, 30);
  }
  function closeModal() {
    $("scrim").hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $("confirm").addEventListener("click", openModal);
  $("m-cancel").addEventListener("click", closeModal);
  $("scrim").addEventListener("click", function (e) { if (e.target === $("scrim")) closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("scrim").hidden) closeModal(); });
  $("pays").addEventListener("click", function (e) {
    var b = e.target.closest(".pay"); if (!b) return;
    state.pay = b.dataset.pay; $("err-pay").textContent = "";
    renderPays();
  });

  // ---- finalizar ----
  function buildLink(name, s) {
    var msg = "Olá! Acabei de agendar pelo site da " + CONFIG.name + ".\n\n" +
      "*Nome:* " + name + "\n" +
      "*Barbeiro:* " + barber().name + "\n" +
      "*Data:* " + longDate(state.date) + "\n" +
      "*Horário:* " + fmt(state.time) + " às " + fmt(state.time + CONFIG.durationMin) + "\n" +
      "*Serviço:* " + s.name + "\n" +
      "*Valor:* " + money(s.price) + "\n" +
      "*Pagamento:* " + state.pay + "\n\n" +
      "Pode confirmar meu horário?";
    return "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(msg);
  }

  $("form").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("f-name").value.trim();
    var bad = false;
    if (name.length < 2) { $("err-name").textContent = "Digite seu nome para a reserva."; bad = true; } else $("err-name").textContent = "";
    if (!state.pay) { $("err-pay").textContent = "Escolha como você vai pagar."; bad = true; } else $("err-pay").textContent = "";
    if (bad || !ready()) return;

    var s = svc();
    var all = loadBookings();
    var mine = all[state.barber] = all[state.barber] || {};
    (mine[state.date] = mine[state.date] || []).push(state.time);
    saveBookings(all);
    lastBooking = { id: String(Date.now()), barber: state.barber, date: state.date, time: state.time, service: s.name, price: s.price, name: name, pay: state.pay };
    var myList = loadMine(); myList.push(lastBooking); saveMine(myList);
    mineNotice = null; mineConfirm = null;

    var url = buildLink(name, s);
    $("t-name").textContent = name.split(/\s+/)[0];
    var tk = $("ticket"); tk.textContent = "";
    [["Barbeiro", barber().name], ["Data", longDate(state.date)], ["Horário", fmt(state.time) + " às " + fmt(state.time + CONFIG.durationMin)],
     ["Serviço", s.name], ["Valor", money(s.price)], ["Pagamento", state.pay]].forEach(function (r) {
      var row = document.createElement("div"), dt = document.createElement("dt"), dd = document.createElement("dd");
      dt.textContent = r[0]; dd.textContent = r[1]; row.appendChild(dt); row.appendChild(dd); tk.appendChild(row);
    });
    $("t-link").href = url;
    $("t-link").hidden = false; $("t-cancel-row").hidden = false;
    $("t-confirm").hidden = true; $("t-notify").hidden = true;

    $("scrim").hidden = true;
    $("app-main").hidden = true;
    $("thanks").hidden = false;
    window.scrollTo(0, 0);

    $("t-note").textContent = "Falta só um passo: toque no botão abaixo para abrir o WhatsApp com todos os dados do agendamento já escritos e envie para a barbearia.";
  });

  $("t-back").addEventListener("click", function () {
    $("thanks").hidden = true; $("app-main").hidden = false;
    state.barber = null; state.time = null; state.service = null; state.pay = null; $("f-name").value = "";
    days = []; state.date = null;
    renderAll();
    window.scrollTo(0, 0);
  });

  // Barra de carregamento: some quando a página e as fontes terminam de carregar (ou após 12 s).
  var loader = $("loader"), loaderOn = true;
  function hideLoader() { if (loaderOn) { loaderOn = false; loader.hidden = true; } }
  var pageLoaded = document.readyState === "complete";
  function checkLoaded() { if (pageLoaded && fontsDone) hideLoader(); }
  fontsCb = checkLoaded;
  if (!pageLoaded) window.addEventListener("load", function () { pageLoaded = true; checkLoaded(); });
  checkLoaded();
  setTimeout(hideLoader, 12000);

  renderAll();
})();