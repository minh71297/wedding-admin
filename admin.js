(() => {
  "use strict";
  const cfg = window.WEDDING_CONFIG || {};
  const BUCKET = cfg.BUCKET || "wedding";
  const $ = (s, r = document) => r.querySelector(s);
  const configured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes("YOUR-") && window.supabase;
  const sb = configured ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;

  // ---------- Tiện ích ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.className = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (v === true) n.setAttribute(k, "");
      else if (v !== false && v != null) n.setAttribute(k, v);
    }
    for (const k of kids.flat()) if (k != null) n.append(k instanceof Node ? k : document.createTextNode(k));
    return n;
  };
  const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
  const merge = (base, over) => {
    if (!isObj(over)) return structuredClone(base);
    const out = structuredClone(base);
    for (const k of Object.keys(over)) out[k] = isObj(over[k]) && isObj(base[k]) ? merge(base[k], over[k]) : over[k];
    return out;
  };
  const getP = (o, p) => p.reduce((a, k) => (a == null ? undefined : a[k]), o);
  const setP = (o, p, v) => {
    let a = o;
    for (let i = 0; i < p.length - 1; i++) {
      if (a[p[i]] == null) a[p[i]] = typeof p[i + 1] === "number" ? [] : {};
      a = a[p[i]];
    }
    a[p[p.length - 1]] = v;
  };
  const toast = (msg, err) => {
    const t = $("#toast"); t.textContent = msg; t.classList.toggle("err", !!err); t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), err ? 4500 : 2200);
  };
  const fail = (e) => { console.error(e); toast("Lỗi: " + (e?.message || e), true); };

  // ---------- Cấu trúc các mục chỉnh sửa ----------
  const img = (k, label, hint) => ({ k, label, t: "image", hint });
  const TABS = [
    { id: "general", title: "Thông tin chung", desc: "Tên, ngày cưới và các dòng chữ chính trên thiệp.", fields: [
      { group: "Cặp đôi", fields: [
        { k: "couple.groomName", label: "Tên chú rể (hiển thị to)" },
        { k: "couple.brideName", label: "Tên cô dâu (hiển thị to)" },
      ]},
      { group: "Phần đầu trang", fields: [
        { k: "hero.title", label: "Dòng chữ phía trên tên" },
        { k: "weddingDate", label: "Ngày giờ cưới (dùng để đếm ngược)", t: "datetime-local" },
        img("hero.image", "Ảnh bìa lớn", "Nên dùng ảnh dọc, tỉ lệ 4:5"),
      ]},
      { group: "Lời nhắn", fields: [
        { k: "invite", label: "Lời mời", t: "textarea" },
        { k: "marquee", label: "Dòng chữ chạy", t: "textarea", hint: "Mỗi dòng là một câu, chạy ngang trên dải băng" },
        { k: "thanks", label: "Lời cảm ơn cuối trang", t: "textarea" },
      ]},
    ], tool: "guestLinks" },
    { id: "couple", title: "Cô dâu & chú rể", desc: "Ảnh, giới thiệu, gia đình và số điện thoại liên hệ.", fields: [
      { group: "Chú rể", fields: [
        { k: "groom.fullName", label: "Họ tên đầy đủ" }, img("groom.photo", "Ảnh chú rể", "Ảnh vuông sẽ đẹp nhất"),
        { k: "groom.bio", label: "Giới thiệu ngắn", t: "textarea" },
        { k: "groom.father", label: "Bố" }, { k: "groom.mother", label: "Mẹ" },
        { k: "groom.address", label: "Địa chỉ nhà trai" }, { k: "groom.phone", label: "Số điện thoại liên hệ", t: "tel" },
      ]},
      { group: "Cô dâu", fields: [
        { k: "bride.fullName", label: "Họ tên đầy đủ" }, img("bride.photo", "Ảnh cô dâu", "Ảnh vuông sẽ đẹp nhất"),
        { k: "bride.bio", label: "Giới thiệu ngắn", t: "textarea" },
        { k: "bride.father", label: "Bố" }, { k: "bride.mother", label: "Mẹ" },
        { k: "bride.address", label: "Địa chỉ nhà gái" }, { k: "bride.phone", label: "Số điện thoại liên hệ", t: "tel" },
      ]},
    ]},
    { id: "events", title: "Tiệc & địa điểm", desc: "Các buổi lễ, bản đồ, lịch trình và trang phục gợi ý.", fields: [
      { k: "events", t: "list", label: "Sự kiện", addLabel: "Thêm sự kiện", item: [
        { k: "title", label: "Tên sự kiện", hint: "Ví dụ: Lễ Vu Quy, Lễ Thành Hôn, Tiệc Cưới" },
        { k: "time", label: "Ngày giờ", t: "datetime-local" },
        { k: "lunar", label: "Ngày âm lịch", hint: "Ví dụ: Nhằm ngày 01 tháng 11 năm Bính Ngọ" },
        { k: "place", label: "Tên địa điểm" }, { k: "address", label: "Địa chỉ" },
        { k: "mapLink", label: "Link chỉ đường Google Maps", hint: "Bỏ trống sẽ tự tìm theo địa chỉ" },
        { k: "mapEmbed", label: "Mã nhúng bản đồ", t: "textarea", hint: "Google Maps → Chia sẻ → Nhúng bản đồ → sao chép HTML rồi dán vào đây" },
        img("image", "Ảnh địa điểm (không bắt buộc)"),
      ]},
      { k: "schedule", t: "list", label: "Lịch trình trong ngày", addLabel: "Thêm mốc giờ", item: [
        { k: "time", label: "Giờ", hint: "Ví dụ: 11:00" }, { k: "title", label: "Hoạt động" },
      ]},
      { group: "Trang phục gợi ý", fields: [
        { k: "dressCode.text", label: "Lời nhắn", t: "textarea" },
        { k: "dressCode.colors", label: "Mã màu", hint: "Cách nhau bởi dấu phẩy, ví dụ: #F7C6D0, #FFE3A3" },
      ]},
    ]},
    { id: "story", title: "Câu chuyện", desc: "Các cột mốc tình yêu, hiển thị theo thứ tự từ trên xuống.", fields: [
      { k: "story", t: "list", label: "Cột mốc", addLabel: "Thêm cột mốc", item: [
        { k: "date", label: "Thời gian", hint: "Ví dụ: 2019 hoặc 14/02/2020" },
        { k: "title", label: "Tiêu đề" }, { k: "content", label: "Nội dung", t: "textarea" }, img("image", "Ảnh"),
      ]},
    ]},
    { id: "gallery", title: "Album ảnh", desc: "Tải nhiều ảnh cùng lúc, thêm chú thích và sắp xếp thứ tự.", custom: renderGallery },
    { id: "decor", title: "Sticker & nhạc", desc: "Tải sticker Dudu Bubu của bạn (nên là PNG nền trong suốt hoặc GIF) và nhạc nền.", fields: [
      { group: "Sticker trang trí", fields: [
        img("decor.coverSticker", "Sticker trên bìa thiệp"),
        img("decor.heroSticker", "Sticker góc ảnh bìa"),
        img("decor.dividerSticker", "Sticker giữa trang"),
        img("decor.rsvpSticker", "Sticker ở form xác nhận"),
        img("decor.footerSticker", "Sticker cuối trang"),
      ]},
      { group: "Nhạc nền", fields: [
        { k: "music.url", label: "File nhạc (mp3)", t: "audio", hint: "Nhạc sẽ phát khi khách bấm Mở thiệp" },
        { k: "music.title", label: "Tên bài hát" },
      ]},
    ]},
    { id: "gift", title: "Mừng cưới", desc: "Mã QR và số tài khoản để khách gửi quà mừng.", fields: [
      { k: "gift.enabled", label: "Hiện mục mừng cưới trên trang", t: "checkbox" },
      { k: "gift.note", label: "Lời nhắn", t: "textarea" },
      { group: "Nhà trai", fields: [
        { k: "gift.groom.label", label: "Tiêu đề" }, { k: "gift.groom.bank", label: "Ngân hàng" },
        { k: "gift.groom.account", label: "Số tài khoản" }, { k: "gift.groom.owner", label: "Chủ tài khoản" }, img("gift.groom.qr", "Ảnh mã QR"),
      ]},
      { group: "Nhà gái", fields: [
        { k: "gift.bride.label", label: "Tiêu đề" }, { k: "gift.bride.bank", label: "Ngân hàng" },
        { k: "gift.bride.account", label: "Số tài khoản" }, { k: "gift.bride.owner", label: "Chủ tài khoản" }, img("gift.bride.qr", "Ảnh mã QR"),
      ]},
    ]},
    { id: "rsvps", title: "Khách xác nhận", desc: "Danh sách khách đã phản hồi qua form trên trang cưới.", custom: renderRsvps, noSave: true },
    { id: "wishes", title: "Lời chúc", desc: "Ẩn lời chúc không phù hợp hoặc xoá hẳn.", custom: renderWishes, noSave: true },
    { id: "settings", title: "Form xác nhận", desc: "Bật/tắt form RSVP và hạn xác nhận.", fields: [
      { k: "rsvp.enabled", label: "Hiện form xác nhận tham dự", t: "checkbox" },
      { k: "rsvp.deadline", label: "Dòng nhắc hạn xác nhận" },
    ]},
  ];

  // ---------- Trạng thái ----------
  let data = structuredClone(window.WEDDING_DEFAULTS);
  let dirty = false;
  let current = "general";
  const markDirty = () => { dirty = true; $("#savebar").hidden = false; };
  window.addEventListener("beforeunload", (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

  // ---------- Tải tệp lên ----------
  async function shrink(file) {
    if (!/^image\/(jpeg|webp)$/.test(file.type) || !window.createImageBitmap) return file;
    try {
      const bmp = await createImageBitmap(file);
      const max = 2000, scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
      if (scale === 1 && file.size < 1.5e6) return file;
      const c = document.createElement("canvas");
      c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
      const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.85));
      return blob && blob.size < file.size ? blob : file;
    } catch { return file; }
  }
  async function uploadFile(file, folder) {
    const limit = folder === "audio" ? 15e6 : 10e6;
    if (file.size > limit) throw new Error(`Tệp quá lớn (tối đa ${limit / 1e6} MB)`);
    const body = await shrink(file);
    const ext = body === file ? (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") : "jpg";
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, body, { contentType: body.type || file.type, cacheControl: "31536000", upsert: false });
    if (error) throw error;
    return { path, url: sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
  }

  // ---------- Vẽ các trường nhập ----------
  function fieldEl(f, base) {
    const path = [...base, ...f.k.split(".")];
    const val = getP(data, path);
    const hint = f.hint ? el("span", { class: "hint" }, f.hint) : null;

    if (f.t === "list") return listEl(f, path);
    if (f.t === "checkbox") {
      const box = el("input", { type: "checkbox", onchange: (e) => { setP(data, path, e.target.checked); markDirty(); } });
      box.checked = val !== false;
      return el("label", { class: "check" }, box, f.label);
    }
    if (f.t === "image" || f.t === "audio") return mediaEl(f, path, val, hint);

    const input = f.t === "textarea"
      ? el("textarea", { rows: 3 })
      : el("input", { type: f.t || "text" });
    input.value = val ?? "";
    input.addEventListener("input", () => { setP(data, path, input.value); markDirty(); });
    return el("label", {}, f.label, hint, input);
  }

  function mediaEl(f, path, val, hint) {
    const isAudio = f.t === "audio";
    const thumb = el("div", { class: "media-thumb" });
    const player = isAudio ? el("audio", { controls: true, preload: "none" }) : null;
    const url = el("input", { type: "url", placeholder: "Dán link hoặc bấm tải lên" });
    const fileIn = el("input", { type: "file", accept: isAudio ? "audio/*" : "image/*", hidden: true });
    const show = (u) => {
      url.value = u || "";
      if (isAudio) { player.src = u || ""; player.hidden = !u; }
      else { thumb.style.backgroundImage = u ? `url("${u.replace(/"/g, "%22")}")` : ""; thumb.textContent = u ? "" : "Chưa có ảnh"; }
    };
    const update = (u) => { setP(data, path, u); show(u); markDirty(); };
    url.addEventListener("change", () => update(url.value.trim()));
    const upBtn = el("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: () => fileIn.click() }, isAudio ? "Tải nhạc lên" : "Tải ảnh lên");
    fileIn.addEventListener("change", async () => {
      const file = fileIn.files[0]; if (!file) return;
      upBtn.disabled = true; upBtn.textContent = "Đang tải…";
      try { const r = await uploadFile(file, isAudio ? "audio" : "images"); update(r.url); toast("Đã tải lên. Nhớ bấm Lưu thay đổi."); }
      catch (e) { fail(e); }
      finally { upBtn.disabled = false; upBtn.textContent = isAudio ? "Tải nhạc lên" : "Tải ảnh lên"; fileIn.value = ""; }
    });
    const clr = el("button", { type: "button", class: "btn btn-danger btn-sm", onclick: () => update("") }, "Bỏ");
    show(val);
    const ctrl = el("div", { class: "media-ctrl" }, el("strong", {}, f.label), hint, player, url, el("div", { class: "media-btns" }, upBtn, clr), fileIn);
    return isAudio ? el("div", { class: "media-ctrl" }, ctrl) : el("div", { class: "media" }, thumb, ctrl);
  }

  function listEl(f, path) {
    const wrap = el("div", { class: "card" }, el("h3", {}, f.label));
    const holder = el("div", { style: "display:grid;gap:12px" });
    const draw = () => {
      holder.replaceChildren();
      const arr = getP(data, path) || [];
      arr.forEach((_, i) => {
        const move = (d) => { const a = getP(data, path); const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; markDirty(); draw(); };
        const tools = el("div", { class: "list-tools" },
          el("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: () => move(-1), "aria-label": "Lên trên" }, "↑"),
          el("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: () => move(1), "aria-label": "Xuống dưới" }, "↓"),
          el("button", { type: "button", class: "btn btn-danger btn-sm", onclick: () => { if (!confirm("Xoá mục này?")) return; getP(data, path).splice(i, 1); markDirty(); draw(); } }, "Xoá"));
        const grid = el("div", { class: "grid2" }, f.item.map((it) => fieldEl(it, [...path, i])));
        holder.append(el("div", { class: "list-item" }, tools, grid));
      });
      if (!arr.length) holder.append(el("p", { class: "muted" }, "Chưa có mục nào."));
    };
    draw();
    const add = el("button", { type: "button", class: "btn btn-ghost", onclick: () => {
      const a = getP(data, path) || []; a.push(Object.fromEntries(f.item.map((it) => [it.k, ""]))); setP(data, path, a); markDirty(); draw();
    } }, "+ " + (f.addLabel || "Thêm"));
    wrap.append(holder, el("div", {}, add));
    return wrap;
  }

  function renderFields(fields) {
    const out = [];
    const loose = [];
    const flush = () => { if (loose.length) { out.push(el("div", { class: "card" }, el("div", { class: "grid2" }, loose.splice(0)))); } };
    for (const f of fields) {
      if (f.group) { flush(); out.push(el("div", { class: "card" }, el("h3", {}, f.group), el("div", { class: "grid2" }, f.fields.map((x) => fieldEl(x, []))))); }
      else if (f.t === "list") { flush(); out.push(fieldEl(f, [])); }
      else loose.push(fieldEl(f, []));
    }
    flush();
    return out;
  }

  // ---------- Công cụ tạo link mời theo tên ----------
  function guestLinksTool() {
    const base = (cfg.SITE_URL || "").replace(/\/$/, "");
    const ta = el("textarea", { rows: 4, placeholder: "Mỗi dòng một tên khách, ví dụ:\nAnh Tuấn & chị Lan\nGia đình bác Hoà" });
    const out = el("div", { style: "display:grid;gap:8px" });
    const gen = () => {
      out.replaceChildren();
      ta.value.split("\n").map((s) => s.trim()).filter(Boolean).forEach((name) => {
        const link = `${base}/?to=${encodeURIComponent(name)}`;
        const inp = el("input", { readonly: true, value: link });
        out.append(el("div", { class: "media-btns", style: "align-items:center" }, el("strong", { style: "min-width:140px" }, name), inp,
          el("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: async () => { try { await navigator.clipboard.writeText(link); toast("Đã sao chép link"); } catch { inp.select(); } } }, "Sao chép")));
      });
    };
    return el("div", { class: "card" }, el("h3", {}, "Tạo link mời theo tên khách"),
      el("p", { class: "hint" }, "Khi khách mở link, bìa thiệp sẽ hiện “Thân mời [tên khách]”. Gửi link qua Zalo/Messenger."),
      base.includes("ten-trang-cuoi") ? el("p", { class: "hint" }, "Hãy sửa SITE_URL trong config.js thành link trang cưới thật của bạn.") : null,
      ta, el("div", {}, el("button", { type: "button", class: "btn btn-ghost", onclick: gen }, "Tạo link")), out);
  }

  // ---------- Album ----------
  async function renderGallery(panel) {
    const fileIn = el("input", { type: "file", accept: "image/*", multiple: true, hidden: true });
    const drop = el("div", { class: "dropzone", tabindex: 0, role: "button" }, el("strong", {}, "Kéo thả ảnh vào đây hoặc bấm để chọn"), el("br"), el("span", { class: "hint" }, "Chọn được nhiều ảnh cùng lúc. Ảnh lớn sẽ được tự thu nhỏ."));
    const grid = el("div", { class: "gallery-grid" });
    const status = el("p", { class: "hint", role: "status" });
    panel.append(el("div", { class: "card" }, drop, status, fileIn), grid);
    let items = [];

    const load = async () => {
      const r = await sb.from("gallery").select("*").order("sort_order").order("created_at");
      if (r.error) return fail(r.error);
      items = r.data; draw();
    };
    const draw = () => {
      grid.replaceChildren();
      if (!items.length) grid.append(el("p", { class: "muted" }, "Album đang trống. Tải ảnh đầu tiên lên nhé."));
      items.forEach((it, i) => {
        const cap = el("input", { value: it.caption || "", placeholder: "Chú thích" });
        cap.addEventListener("change", async () => {
          const r = await sb.from("gallery").update({ caption: cap.value }).eq("id", it.id);
          r.error ? fail(r.error) : toast("Đã lưu chú thích");
        });
        const move = async (d) => {
          const j = i + d; if (j < 0 || j >= items.length) return;
          [items[i], items[j]] = [items[j], items[i]];
          const ups = items.map((x, k) => sb.from("gallery").update({ sort_order: k }).eq("id", x.id));
          const res = await Promise.all(ups); const e = res.find((x) => x.error); if (e) fail(e.error);
          draw();
        };
        const del = async () => {
          if (!confirm("Xoá ảnh này khỏi album?")) return;
          const r = await sb.from("gallery").delete().eq("id", it.id);
          if (r.error) return fail(r.error);
          if (it.path) await sb.storage.from(BUCKET).remove([it.path]);
          items.splice(i, 1); draw(); toast("Đã xoá ảnh");
        };
        grid.append(el("div", { class: "g-item" }, el("img", { src: it.url, alt: it.caption || "", loading: "lazy" }),
          el("div", { class: "g-body" }, cap, el("div", { class: "g-tools" },
            el("span", {}, el("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: () => move(-1), "aria-label": "Lên trước" }, "←"), " ",
              el("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: () => move(1), "aria-label": "Ra sau" }, "→")),
            el("button", { type: "button", class: "btn btn-danger btn-sm", onclick: del }, "Xoá")))));
      });
    };
    const handle = async (files) => {
      files = [...files].filter((f) => f.type.startsWith("image/"));
      let order = items.length ? Math.max(...items.map((x) => x.sort_order || 0)) + 1 : 0, done = 0;
      for (const f of files) {
        status.textContent = `Đang tải ${done + 1}/${files.length}…`;
        try {
          const up = await uploadFile(f, "gallery");
          const r = await sb.from("gallery").insert({ url: up.url, path: up.path, sort_order: order++ }).select().single();
          if (r.error) throw r.error;
          items.push(r.data); done++; draw();
        } catch (e) { fail(e); }
      }
      status.textContent = files.length ? `Đã tải lên ${done}/${files.length} ảnh.` : "";
    };
    drop.onclick = () => fileIn.click();
    drop.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileIn.click(); } };
    drop.ondragover = (e) => { e.preventDefault(); drop.classList.add("over"); };
    drop.ondragleave = () => drop.classList.remove("over");
    drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove("over"); handle(e.dataTransfer.files); };
    fileIn.onchange = () => { handle(fileIn.files); fileIn.value = ""; };
    await load();
  }

  // ---------- Khách xác nhận ----------
  async function renderRsvps(panel) {
    const r = await sb.from("rsvps").select("*").order("created_at", { ascending: false });
    if (r.error) return fail(r.error);
    let rows = r.data;
    const sideName = { groom: "Nhà trai", bride: "Nhà gái", both: "Cả hai" };
    const draw = () => {
      panel.querySelectorAll(".rsvp-dyn").forEach((n) => n.remove());
      const yes = rows.filter((x) => x.attending);
      const sum = (arr) => arr.reduce((a, x) => a + (x.guests || 0), 0);
      const stats = el("div", { class: "stats rsvp-dyn", style: "margin-bottom:16px" },
        [["Phản hồi", rows.length], ["Sẽ đến", yes.length], ["Tổng số khách", sum(yes)],
         ["Khách nhà trai", sum(yes.filter((x) => x.side === "groom"))], ["Khách nhà gái", sum(yes.filter((x) => x.side === "bride"))]]
          .map(([l, n]) => el("div", { class: "stat" }, el("b", {}, String(n)), l)));
      const csv = el("button", { type: "button", class: "btn btn-ghost rsvp-dyn", style: "margin-bottom:12px", onclick: () => {
        const head = ["Thời gian", "Tên", "Điện thoại", "Tham dự", "Số người", "Khách của", "Sự kiện", "Lời chúc"];
        const lines = rows.map((x) => [new Date(x.created_at).toLocaleString("vi-VN"), x.name, x.phone, x.attending ? "Có" : "Không", x.guests, sideName[x.side] || x.side, x.event, x.message]
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","));
        const blob = new Blob(["\ufeff" + [head.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
        const a = el("a", { href: URL.createObjectURL(blob), download: "danh-sach-khach.csv" }); document.body.append(a); a.click(); a.remove();
      } }, "Tải danh sách (Excel/CSV)");
      const tbody = el("tbody");
      rows.forEach((x) => tbody.append(el("tr", {},
        el("td", {}, new Date(x.created_at).toLocaleString("vi-VN")),
        el("td", {}, el("strong", {}, x.name)), el("td", {}, x.phone || ""),
        el("td", {}, el("span", { class: "tag " + (x.attending ? "tag-yes" : "tag-no") }, x.attending ? "Sẽ đến" : "Không đến")),
        el("td", {}, String(x.guests)), el("td", {}, sideName[x.side] || x.side || ""), el("td", {}, x.event === "all" ? "Tất cả" : x.event || ""),
        el("td", { style: "max-width:240px" }, x.message || ""),
        el("td", {}, el("button", { type: "button", class: "btn btn-danger btn-sm", onclick: async () => {
          if (!confirm(`Xoá phản hồi của ${x.name}?`)) return;
          const d = await sb.from("rsvps").delete().eq("id", x.id); if (d.error) return fail(d.error);
          rows = rows.filter((y) => y.id !== x.id); draw();
        } }, "Xoá")))));
      const table = el("div", { class: "table-wrap rsvp-dyn" }, el("table", {},
        el("thead", {}, el("tr", {}, ["Thời gian", "Tên", "Điện thoại", "Tham dự", "Số người", "Khách của", "Sự kiện", "Lời chúc", ""].map((h) => el("th", {}, h)))), tbody));
      panel.append(stats, csv, rows.length ? table : el("p", { class: "muted rsvp-dyn" }, "Chưa có khách nào phản hồi."));
    };
    draw();
  }

  // ---------- Lời chúc ----------
  async function renderWishes(panel) {
    const r = await sb.from("wishes").select("*").order("created_at", { ascending: false });
    if (r.error) return fail(r.error);
    const list = el("div", {}); panel.append(list);
    let rows = r.data;
    const draw = () => {
      list.replaceChildren();
      if (!rows.length) list.append(el("p", { class: "muted" }, "Chưa có lời chúc nào."));
      rows.forEach((w) => {
        const toggle = el("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: async () => {
          const u = await sb.from("wishes").update({ hidden: !w.hidden }).eq("id", w.id); if (u.error) return fail(u.error);
          w.hidden = !w.hidden; draw();
        } }, w.hidden ? "Hiện lại" : "Ẩn");
        const del = el("button", { type: "button", class: "btn btn-danger btn-sm", onclick: async () => {
          if (!confirm("Xoá lời chúc này?")) return;
          const d = await sb.from("wishes").delete().eq("id", w.id); if (d.error) return fail(d.error);
          rows = rows.filter((x) => x.id !== w.id); draw();
        } }, "Xoá");
        list.append(el("div", { class: "card wish-row" + (w.hidden ? " is-hidden" : "") },
          el("div", {}, el("strong", {}, w.name), " ", el("span", { class: "hint" }, new Date(w.created_at).toLocaleString("vi-VN") + (w.hidden ? " · đang ẩn" : "")), el("p", {}, w.message)),
          el("div", { class: "media-btns" }, toggle, del)));
      });
    };
    draw();
  }

  // ---------- Điều hướng ----------
  function renderTabs() {
    $("#tabs").replaceChildren(...TABS.map((t) => el("button", { type: "button", "aria-current": t.id === current ? "page" : false, onclick: () => { current = t.id; renderTabs(); renderPanel(); } }, t.title)));
  }
  async function renderPanel() {
    const t = TABS.find((x) => x.id === current);
    const panel = $("#panel");
    panel.replaceChildren(el("div", { class: "panel-head" }, el("h2", {}, t.title), el("p", { class: "muted" }, t.desc)));
    if (t.fields) panel.append(...renderFields(t.fields));
    if (t.tool === "guestLinks") panel.append(guestLinksTool());
    if (t.custom) { try { await t.custom(panel); } catch (e) { fail(e); } }
    window.scrollTo({ top: 0 });
  }

  async function save() {
    const btn = $("#saveBtn"); btn.disabled = true; btn.textContent = "Đang lưu…";
    try {
      const { error } = await sb.from("site_settings").upsert({ id: 1, data, updated_at: new Date().toISOString() });
      if (error) throw error;
      dirty = false; $("#savebar").hidden = true; toast("Đã lưu. Trang cưới đã được cập nhật.");
    } catch (e) { fail(e); }
    finally { btn.disabled = false; btn.textContent = "Lưu thay đổi"; }
  }

  async function startApp() {
    $("#loginView").hidden = true; $("#appView").hidden = false;
    $("#viewSite").href = cfg.SITE_URL || "#";
    const r = await sb.from("site_settings").select("data").eq("id", 1).maybeSingle();
    if (r.error) fail(r.error);
    data = merge(window.WEDDING_DEFAULTS, r.data?.data || {});
    renderTabs(); renderPanel();
  }

  async function init() {
    if (!sb) { $("#setupView").hidden = false; return; }
    $("#saveBtn").onclick = save;
    $("#logoutBtn").onclick = async () => {
      if (dirty && !confirm("Bạn có thay đổi chưa lưu. Vẫn đăng xuất?")) return;
      dirty = false; await sb.auth.signOut(); location.reload();
    };
    $("#loginForm").onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(e.target), msg = $("#loginMsg");
      msg.textContent = "";
      const { error } = await sb.auth.signInWithPassword({ email: f.get("email"), password: f.get("password") });
      if (error) { msg.textContent = "Lỗi: " + error.message; console.error(error); return; }
      startApp();
    };
    const { data: s } = await sb.auth.getSession();
    if (s.session) startApp(); else $("#loginView").hidden = false;
  }
  init();
})();
