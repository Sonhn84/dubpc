/* ============================================================
   APP — UI chung, đăng nhập (Supabase Auth), render & chỉnh sửa
   ============================================================ */
(function (w, d) {
  "use strict";

  var ADMIN = false; // có phải quản trị viên đã đăng nhập?

  /* ---------- TIỆN ÍCH ---------- */
  function $(s, p) { return (p || d).querySelector(s); }
  function $all(s, p) { return Array.prototype.slice.call((p || d).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function el(html) { var t = d.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; }
  function qs(name){ return new URLSearchParams(w.location.search).get(name); }

  /* ============================================================
     1) UI CHUNG
     ============================================================ */
  function commonUI() {
    var today = $("#today"), dt = new Date();
    var days = ["Chủ nhật","Thứ Hai","Thứ Ba","Thứ Tư","Thứ Năm","Thứ Sáu","Thứ Bảy"];
    if (today) today.textContent = days[dt.getDay()] + ", " + dt.getDate() + "/" + (dt.getMonth()+1) + "/" + dt.getFullYear();
    var yr = $("#year"); if (yr) yr.textContent = dt.getFullYear();

    var toggle = $("#navToggle"), nav = $("#nav");
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var open = nav.classList.toggle("open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      $all("a", nav).forEach(function (a) {
        a.addEventListener("click", function () { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); });
      });
    }

    var toTop = $("#toTop");
    var navLinks = $all(".nav a[href^='#']");
    var sections = navLinks.map(function (a) { return $(a.getAttribute("href")); });
    w.addEventListener("scroll", function () {
      runCount();
      if (toTop) toTop.classList.toggle("show", w.scrollY > 480);
      var pos = w.scrollY + 120, idx = -1;
      sections.forEach(function (sec, i) { if (sec && sec.offsetTop <= pos) idx = i; });
      navLinks.forEach(function (a, i) { a.classList.toggle("active", i === idx); });
    }, { passive: true });

    revealInit();
  }

  function revealInit() {
    var reveals = $all(".reveal:not(.in)");
    if ("IntersectionObserver" in w) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { threshold: 0.12 });
      reveals.forEach(function (r) { io.observe(r); });
    } else { reveals.forEach(function (r) { r.classList.add("in"); }); }
  }

  var counted = false;
  function runCount() {
    if (counted) return;
    var s = $(".stats"); if (!s) return;
    if (s.getBoundingClientRect().top < w.innerHeight - 60) {
      counted = true;
      $all(".stat__num").forEach(function (n) {
        var t = parseInt(n.getAttribute("data-count"), 10) || 0, cur = 0, step = Math.max(1, Math.ceil(t / 40));
        var iv = setInterval(function () { cur += step; if (cur >= t) { cur = t; clearInterval(iv); } n.textContent = cur; }, 28);
      });
    }
  }

  /* ============================================================
     2) RENDER DỮ LIỆU
     ============================================================ */
  function memberCard(m) {
    var initials = m.lead ? (m.badge === "Bí thư" ? "BT" : "PBT") : "ĐV";
    var avatar = m.photo
      ? '<div class="person__avatar person__avatar--img" style="background-image:url(' + JSON.stringify(m.photo) + ')"><span class="person__badge">' + esc(m.badge) + '</span></div>'
      : '<div class="person__avatar" data-initials="' + esc(initials) + '"><span class="person__badge">' + esc(m.badge) + '</span></div>';
    return '<article class="person ' + (m.lead ? "person--lead" : "") + ' reveal" data-id="' + esc(m.id) + '">' +
      adminBtn("edit-member", "Sửa") + avatar +
      '<h3 class="person__name">' + esc(m.name) + '</h3>' +
      '<p class="person__role">' + esc(m.position) + '</p>' +
      '<p class="person__desc">' + esc(m.desc) + '</p></article>';
  }

  function newsCard(n) {
    var media = n.image
      ? '<div class="news-card__media news-card__media--img" style="background-image:url(' + JSON.stringify(n.image) + ')"></div>'
      : '<div class="news-card__media" style="--c1:' + esc(n.color) + ';--c2:' + esc(n.color) + '99"><span>' + esc(n.category) + '</span></div>';
    return '<article class="news-card reveal" data-id="' + esc(n.id) + '">' + adminBtn("edit-news", "Sửa") + media +
      '<div class="news-card__body"><span class="news-card__date">' + esc(n.date) + '</span>' +
      '<h3>' + esc(n.title) + '</h3><p>' + esc(n.summary) + '</p>' +
      '<a class="readmore" href="tin-tuc.html?id=' + encodeURIComponent(n.id) + '">Xem chi tiết →</a></div></article>';
  }

  function docRow(doc) {
    var href = doc.url ? esc(doc.url) : "#";
    var tgt = doc.url ? ' target="_blank" rel="noopener"' : "";
    return '<div class="doc-wrap reveal" data-id="' + esc(doc.id) + '">' + adminBtn("edit-doc", "Sửa") +
      '<a class="doc" href="' + href + '"' + tgt + '><span class="doc__icon">📄</span>' +
      '<span class="doc__info"><b>' + esc(doc.title) + '</b><small>' + esc(doc.meta) + (doc.url ? " · Có tệp đính kèm" : "") + '</small></span>' +
      '<span class="doc__tag">' + esc(doc.tag) + '</span></a></div>';
  }

  function adminBtn(action, label) { return '<button class="edit-chip" data-action="' + action + '" type="button">✎ ' + label + '</button>'; }

  function loading(node, label){ if(node) node.innerHTML = '<div class="loading">Đang tải ' + label + '…</div>'; }

  async function renderAll() {
    var mc = $("#membersGrid"), nc = $("#newsGrid"), dc = $("#docsGrid"), art = $("#article");
    if (mc) loading(mc, "danh sách đảng viên");
    if (nc) loading(nc, "tin tức");
    if (dc) loading(dc, "văn bản");

    try {
      var jobs = [];
      if (mc) jobs.push(API.getMembers().then(function (list) { mc.innerHTML = list.map(memberCard).join(""); }));
      if (nc) jobs.push(API.getNews().then(function (list) {
        var lim = nc.getAttribute("data-limit"); if (lim) list = list.slice(0, parseInt(lim, 10));
        nc.innerHTML = list.length ? list.map(newsCard).join("") : '<p class="empty">Chưa có tin bài.</p>';
      }));
      if (dc) jobs.push(API.getDocuments().then(function (list) {
        dc.innerHTML = list.length ? list.map(docRow).join("") : '<p class="empty">Chưa có văn bản.</p>';
      }));
      if (art) jobs.push(renderArticle(art));
      await Promise.all(jobs);
    } catch (e) {
      console.error(e);
      [mc, nc, dc].forEach(function (n) { if (n) n.innerHTML = '<p class="empty">Lỗi tải dữ liệu. Kiểm tra cấu hình Supabase.</p>'; });
    }

    syncAdminButtons();
    revealInit();
  }

  async function renderArticle(container) {
    var id = qs("id"), sec = $("#articleSection");
    if (!id) { if (sec) sec.hidden = true; return; }
    if (sec) sec.hidden = false;
    loading(container, "bài viết");
    var n = await API.getNewsById(id);
    if (!n) { container.innerHTML = "<p class='empty'>Không tìm thấy tin bài.</p>"; return; }
    var hero = n.image ? '<div class="article__hero" style="background-image:url(' + JSON.stringify(n.image) + ')"></div>'
      : '<div class="article__hero" style="background:linear-gradient(135deg,' + esc(n.color) + ',' + esc(n.color) + 'aa)"><span>' + esc(n.category) + '</span></div>';
    container.innerHTML = hero +
      '<span class="news-card__date">' + esc(n.date) + ' · ' + esc(n.category) + '</span>' +
      '<h1 class="article__title">' + esc(n.title) + '</h1>' +
      '<p class="article__lead">' + esc(n.summary) + '</p>' +
      '<div class="article__body">' + esc(n.body).split("\n").map(function (p) { return "<p>" + p + "</p>"; }).join("") + '</div>' +
      (ADMIN ? '<button class="btn btn--gold" data-action="edit-news" data-id="' + esc(n.id) + '" style="margin-top:20px">✎ Sửa tin này</button>' : "");
  }

  /* ============================================================
     3) ĐĂNG NHẬP & THANH ADMIN
     ============================================================ */
  function buildAdminBar() {
    if ($("#adminBar")) return;
    var bar = el('<div id="adminBar" class="admin-bar"><span class="admin-bar__dot"></span>' +
      '<b>Chế độ Quản trị</b><span class="admin-bar__hint">Bấm “✎ Sửa” trên từng mục để chỉnh sửa.</span>' +
      '<span class="admin-bar__spacer"></span>' +
      '<button id="adminAddNews" class="abtn">+ Tin bài</button>' +
      '<button id="adminAddDoc" class="abtn">+ Văn bản</button>' +
      '<button id="adminLogout" class="abtn abtn--ghost">Đăng xuất</button></div>');
    d.body.appendChild(bar);
    d.body.classList.add("has-admin-bar");
    $("#adminLogout").onclick = async function () { await API.auth.signOut(); location.reload(); };
    $("#adminAddNews").onclick = function () { openNewsModal(null); };
    $("#adminAddDoc").onclick = function () { openDocModal(null); };
  }

  function syncAdminButtons() { d.body.classList.toggle("admin-on", ADMIN); }

  function openLogin() {
    var note = API.configured
      ? "Tài khoản do quản trị hệ thống cấp trong Supabase."
      : "⚠ Website chưa kết nối Supabase. Hãy cập nhật assets/js/config.js trước.";
    modal('<h3>Đăng nhập Quản trị</h3>' +
      '<p class="modal__note">' + note + '</p>' +
      '<div class="field"><label>Email</label><input id="lgUser" type="email" autocomplete="username" placeholder="admin@chibo.gov.vn"></div>' +
      '<div class="field"><label>Mật khẩu</label><input id="lgPass" type="password" autocomplete="current-password" placeholder="••••••"></div>' +
      '<p class="form-status" id="lgErr" style="color:#b01217"></p>' +
      '<div class="modal__actions"><button class="btn btn--ghost-dark" data-close>Hủy</button><button class="btn btn--gold" id="lgGo">Đăng nhập</button></div>');
    setTimeout(function () { var u=$("#lgUser"); if(u) u.focus(); }, 50);
    async function attempt() {
      $("#lgErr").textContent = "Đang đăng nhập…";
      try {
        await API.auth.signIn($("#lgUser").value.trim(), $("#lgPass").value);
        location.reload();
      } catch (e) {
        $("#lgErr").textContent = (e && e.message) ? ("Lỗi: " + e.message) : "Sai email hoặc mật khẩu.";
      }
    }
    $("#lgGo").onclick = attempt;
    $("#lgPass").addEventListener("keydown", function (e) { if (e.key === "Enter") attempt(); });
  }

  /* ============================================================
     4) MODAL & FORM
     ============================================================ */
  function modal(inner) {
    closeModal();
    var ov = el('<div class="modal-ov" id="modalOv"><div class="modal" role="dialog" aria-modal="true">' +
      '<button class="modal__x" data-close aria-label="Đóng">×</button>' + inner + '</div></div>');
    d.body.appendChild(ov);
    ov.addEventListener("click", function (e) { if (e.target === ov || e.target.hasAttribute("data-close")) closeModal(); });
    d.addEventListener("keydown", escClose);
    return ov;
  }
  function escClose(e) { if (e.key === "Escape") closeModal(); }
  function closeModal() { var m = $("#modalOv"); if (m) m.remove(); d.removeEventListener("keydown", escClose); }

  function imageField(label, current, onPick, hint) {
    var wrap = el('<div class="field"><label>' + label + '</label>' +
      '<div class="img-pick"><div class="img-pick__prev"></div>' +
      '<label class="img-pick__btn">Chọn ảnh<input type="file" accept="image/*" hidden></label>' +
      '<button type="button" class="img-pick__clear">Xóa ảnh</button>' +
      '<span class="img-pick__status"></span></div>' +
      (hint ? '<small class="hint">' + hint + '</small>' : '') + '</div>');
    var prev = $(".img-pick__prev", wrap), status = $(".img-pick__status", wrap);
    var data = current || "";
    function paint() { prev.style.backgroundImage = data ? "url(" + JSON.stringify(data) + ")" : ""; prev.classList.toggle("empty", !data); }
    paint();
    $("input[type=file]", wrap).addEventListener("change", async function (e) {
      var f = e.target.files[0]; if (!f) return;
      status.textContent = "Đang tải ảnh lên…";
      try { var url = await API.uploadImage(f); data = url; paint(); onPick(data); status.textContent = "✓ Đã tải lên"; }
      catch (err) { status.textContent = "Lỗi tải ảnh: " + (err.message || ""); }
    });
    $(".img-pick__clear", wrap).onclick = function () { data = ""; paint(); onPick(""); status.textContent = ""; };
    return wrap;
  }

  // ----- Sửa đảng viên -----
  async function openMemberModal(id) {
    var members = await API.getMembers();
    var m = members.find(function (x) { return x.id === id; }); if (!m) return;
    var draft = { photo: m.photo };
    var ov = modal('<h3>Chỉnh sửa thông tin đảng viên</h3>' +
      '<div class="field"><label>Họ và tên</label><input id="fName" value="' + esc(m.name) + '"></div>' +
      '<div class="field"><label>Chức danh / vị trí</label><input id="fPos" value="' + esc(m.position) + '"></div>' +
      '<div class="field"><label>Chức vụ trong Chi bộ (nhãn)</label><input id="fBadge" value="' + esc(m.badge) + '"></div>' +
      '<div class="field"><label>Mô tả công việc</label><textarea id="fDesc" rows="3">' + esc(m.desc) + '</textarea></div>' +
      '<div id="imgSlot"></div>' +
      '<div class="modal__actions"><button class="btn btn--ghost-dark" data-close>Hủy</button><button class="btn btn--gold" id="fSave">Lưu</button></div>');
    $("#imgSlot", ov).appendChild(imageField("Ảnh chân dung", m.photo, function (url) { draft.photo = url; }, "Ảnh tự thu nhỏ & lưu trên máy chủ. Nên dùng ảnh dọc."));
    $("#fSave").onclick = async function () {
      var btn = this; btn.disabled = true; btn.textContent = "Đang lưu…";
      try {
        await API.updateMember(id, { name: $("#fName").value.trim(), position: $("#fPos").value.trim(),
          badge: $("#fBadge").value.trim(), desc: $("#fDesc").value.trim(), photo: draft.photo });
        closeModal(); await renderAll();
      } catch (e) { alert("Lỗi lưu: " + (e.message||"")); btn.disabled = false; btn.textContent = "Lưu"; }
    };
  }

  // ----- Thêm / sửa tin bài -----
  async function openNewsModal(id) {
    var n = id ? await API.getNewsById(id) : { title:"", date:"", category:"TIN TỨC", color:"#b01217", summary:"", body:"", image:"" };
    if (!n) return;
    var draft = { image: n.image || "" };
    var ov = modal('<h3>' + (id ? "Chỉnh sửa tin bài" : "Thêm tin bài mới") + '</h3>' +
      '<div class="field"><label>Tiêu đề</label><input id="fTitle" value="' + esc(n.title) + '"></div>' +
      '<div class="grid-2-mini">' +
        '<div class="field"><label>Thời gian</label><input id="fDate" value="' + esc(n.date) + '" placeholder="Tháng 6/2026"></div>' +
        '<div class="field"><label>Chuyên mục</label><input id="fCat" value="' + esc(n.category) + '"></div>' +
      '</div>' +
      '<div class="field"><label>Màu nhãn</label><input id="fColor" type="color" value="' + esc(n.color || "#b01217") + '" style="height:44px"></div>' +
      '<div class="field"><label>Tóm tắt</label><textarea id="fSum" rows="2">' + esc(n.summary) + '</textarea></div>' +
      '<div class="field"><label>Nội dung chi tiết</label><textarea id="fBody" rows="5">' + esc(n.body) + '</textarea></div>' +
      '<div id="imgSlot"></div>' +
      '<div class="modal__actions">' + (id ? '<button class="btn btn--danger" id="fDel">Xóa</button>' : '') +
        '<span style="flex:1"></span><button class="btn btn--ghost-dark" data-close>Hủy</button><button class="btn btn--gold" id="fSave">Lưu</button></div>');
    $("#imgSlot", ov).appendChild(imageField("Ảnh minh họa", n.image, function (url) { draft.image = url; }, "Để trống sẽ dùng nhãn màu."));
    $("#fSave").onclick = async function () {
      var data = { title:$("#fTitle").value.trim(), date:$("#fDate").value.trim(), category:$("#fCat").value.trim(),
        color:$("#fColor").value, summary:$("#fSum").value.trim(), body:$("#fBody").value.trim(), image:draft.image };
      if (!data.title) { alert("Vui lòng nhập tiêu đề."); return; }
      this.disabled = true; this.textContent = "Đang lưu…";
      try { if (id) await API.updateNews(id, data); else await API.addNews(data); closeModal(); await renderAll(); }
      catch (e) { alert("Lỗi lưu: " + (e.message||"")); this.disabled = false; this.textContent = "Lưu"; }
    };
    var del = $("#fDel"); if (del) del.onclick = async function () {
      if (confirm("Xóa tin bài này?")) { try { await API.removeNews(id); closeModal(); await renderAll(); } catch(e){ alert("Lỗi: "+(e.message||"")); } } };
  }

  // ----- Thêm / sửa văn bản -----
  async function openDocModal(id) {
    var doc = { title:"", meta:"", tag:"Văn bản", url:"" };
    if (id) { var list = await API.getDocuments(); doc = list.find(function(x){return x.id===id;}) || doc; }
    modal('<h3>' + (id ? "Chỉnh sửa văn bản" : "Thêm văn bản / tài liệu họp") + '</h3>' +
      '<div class="field"><label>Tên văn bản</label><input id="dTitle" value="' + esc(doc.title) + '"></div>' +
      '<div class="grid-2-mini">' +
        '<div class="field"><label>Mô tả ngắn</label><input id="dMeta" value="' + esc(doc.meta) + '"></div>' +
        '<div class="field"><label>Loại (nhãn)</label><input id="dTag" value="' + esc(doc.tag) + '"></div>' +
      '</div>' +
      '<div class="field"><label>Đường dẫn tệp (URL)</label><input id="dUrl" value="' + esc(doc.url) + '" placeholder="https://... liên kết tệp"></div>' +
      '<small class="hint">Tải tệp lên Google Drive/SharePoint của cơ quan rồi dán liên kết vào đây.</small>' +
      '<div class="modal__actions">' + (id ? '<button class="btn btn--danger" id="dDel">Xóa</button>' : '') +
        '<span style="flex:1"></span><button class="btn btn--ghost-dark" data-close>Hủy</button><button class="btn btn--gold" id="dSave">Lưu</button></div>');
    $("#dSave").onclick = async function () {
      var data = { title:$("#dTitle").value.trim(), meta:$("#dMeta").value.trim(), tag:$("#dTag").value.trim(), url:$("#dUrl").value.trim() };
      if (!data.title) { alert("Vui lòng nhập tên văn bản."); return; }
      this.disabled = true; this.textContent = "Đang lưu…";
      try { if (id) await API.updateDoc(id, data); else await API.addDoc(data); closeModal(); await renderAll(); }
      catch (e) { alert("Lỗi lưu: " + (e.message||"")); this.disabled = false; this.textContent = "Lưu"; }
    };
    var del = $("#dDel"); if (del) del.onclick = async function () {
      if (confirm("Xóa văn bản này?")) { try { await API.removeDoc(id); closeModal(); await renderAll(); } catch(e){ alert("Lỗi: "+(e.message||"")); } } };
  }

  /* ============================================================
     5) SỰ KIỆN
     ============================================================ */
  function wireEvents() {
    $all("[data-login]").forEach(function (b) { b.onclick = function (e) { e.preventDefault(); openLogin(); }; });
    d.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-action]"); if (!btn || !ADMIN) return;
      e.preventDefault();
      var holder = btn.closest("[data-id]");
      var id = btn.getAttribute("data-id") || (holder && holder.getAttribute("data-id"));
      var action = btn.getAttribute("data-action");
      if (action === "edit-member") openMemberModal(id);
      else if (action === "edit-news") openNewsModal(id);
      else if (action === "edit-doc") openDocModal(id);
    });
  }

  /* ============================================================
     KHỞI ĐỘNG
     ============================================================ */
  d.addEventListener("DOMContentLoaded", async function () {
    commonUI();
    wireEvents();
    try { var user = await API.auth.getUser(); ADMIN = !!user; } catch (e) { ADMIN = false; }
    await renderAll();
    if (ADMIN) { buildAdminBar(); syncAdminButtons(); }
  });

})(window, document);
