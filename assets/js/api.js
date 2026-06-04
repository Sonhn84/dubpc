/* ============================================================
   API — lớp kết nối Supabase (Database + Auth + Storage)
   Có dữ liệu mẫu dự phòng khi chưa cấu hình.
   ============================================================ */
(function (w) {
  "use strict";

  var cfg = w.APP_CONFIG || {};
  var configured = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
    cfg.SUPABASE_URL.indexOf("YOUR_") === -1 && cfg.SUPABASE_ANON_KEY.indexOf("YOUR_") === -1);

  var sb = null;
  if (configured && w.supabase && w.supabase.createClient) {
    sb = w.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  }

  /* ---------- DỮ LIỆU MẪU (khi chưa cấu hình) ---------- */
  var DEFAULTS = {
    members: [
      { id: "m1", name: "Đồng chí Bí thư Chi bộ", position: "Trưởng Ban Pháp chế HĐND tỉnh", badge: "Bí thư", desc: "Phụ trách chung, lãnh đạo toàn diện công tác Đảng và chuyên môn của Chi bộ.", lead: true, photo: "" },
      { id: "m2", name: "Đồng chí Phó Bí thư Chi bộ", position: "Phó Trưởng Ban Pháp chế HĐND tỉnh", badge: "Phó Bí thư", desc: "Giúp Bí thư điều hành, phụ trách công tác xây dựng Đảng và kiểm tra, giám sát.", lead: true, photo: "" },
      { id: "m3", name: "Đồng chí Đảng viên", position: "Phó Chánh Văn phòng Đoàn ĐBQH và HĐND tỉnh", badge: "Đảng viên", desc: "Tham mưu công tác tổng hợp, phối hợp phục vụ hoạt động của Ban.", lead: false, photo: "" },
      { id: "m4", name: "Đồng chí Đảng viên", position: "Chuyên viên Phòng Công tác Hội đồng", badge: "Đảng viên", desc: "Tham mưu phục vụ hoạt động thẩm tra, giám sát của HĐND tỉnh.", lead: false, photo: "" },
      { id: "m5", name: "Đồng chí Đảng viên", position: "Chuyên viên Phòng Tổng hợp, Thông tin Dân nguyện", badge: "Đảng viên", desc: "Tham mưu công tác tổng hợp và xử lý đơn thư, dân nguyện.", lead: false, photo: "" },
      { id: "m6", name: "Đồng chí Đảng viên", position: "Ủy viên chuyên trách Ban Pháp chế", badge: "Đảng viên", desc: "Trực tiếp thực hiện nhiệm vụ chuyên môn của Ban Pháp chế.", lead: false, photo: "" }
    ],
    news: [
      { id: "n1", title: "Sinh hoạt Chi bộ định kỳ chuyên đề quý II", date: "Tháng 6/2026", category: "SINH HOẠT", color: "#b01217", summary: "Chi bộ tổ chức sinh hoạt chuyên đề về nâng cao chất lượng công tác giám sát của HĐND tỉnh.", body: "Trong buổi sinh hoạt chuyên đề quý II/2026, Chi bộ Ban Pháp chế đã tập trung thảo luận các giải pháp nâng cao chất lượng, hiệu quả công tác thẩm tra, giám sát của HĐND tỉnh.", image: "" },
      { id: "n2", title: "Học tập, quán triệt nghị quyết của Đảng", date: "Tháng 5/2026", category: "HỌC TẬP", color: "#c9962b", summary: "Đảng viên Chi bộ tham gia học tập, quán triệt các nghị quyết, chỉ thị mới của Trung ương và Tỉnh ủy.", body: "Toàn thể đảng viên Chi bộ nghiêm túc tham gia hội nghị học tập, quán triệt các nghị quyết, chỉ thị mới.", image: "" },
      { id: "n3", title: "Tham mưu giám sát chuyên đề lĩnh vực tư pháp", date: "Tháng 4/2026", category: "GIÁM SÁT", color: "#155e3b", summary: "Ban Pháp chế hoàn thành tham mưu chương trình giám sát chuyên đề trình Thường trực HĐND tỉnh.", body: "Ban Pháp chế đã hoàn thành tham mưu xây dựng kế hoạch và đề cương giám sát chuyên đề lĩnh vực tư pháp.", image: "" }
    ],
    documents: [
      { id: "d1", title: "Quy chế làm việc của Chi bộ Ban Pháp chế", meta: "Tài liệu nội bộ", tag: "Quy chế", url: "" },
      { id: "d2", title: "Nghị quyết sinh hoạt Chi bộ định kỳ", meta: "Cập nhật hằng tháng", tag: "Nghị quyết", url: "" },
      { id: "d3", title: "Báo cáo tổng kết công tác Đảng năm", meta: "Báo cáo thường niên", tag: "Báo cáo", url: "" },
      { id: "d4", title: "Kế hoạch học tập và làm theo Bác", meta: "Theo chuyên đề năm", tag: "Kế hoạch", url: "" }
    ]
  };

  /* ---------- ÁNH XẠ DÒNG ↔ ĐỐI TƯỢNG ---------- */
  function memberFrom(r){ return { id:r.id, name:r.name, position:r.position, badge:r.badge, desc:r.description||"", lead:!!r.is_lead, photo:r.photo_url||"" }; }
  function memberTo(p){ var o={}; if("name"in p)o.name=p.name; if("position"in p)o.position=p.position; if("badge"in p)o.badge=p.badge; if("desc"in p)o.description=p.desc; if("lead"in p)o.is_lead=p.lead; if("photo"in p)o.photo_url=p.photo; return o; }
  function newsFrom(r){ return { id:r.id, title:r.title, date:r.date_label||"", category:r.category||"", color:r.color||"#b01217", summary:r.summary||"", body:r.body||"", image:r.image_url||"" }; }
  function newsTo(p){ return { title:p.title, date_label:p.date, category:p.category, color:p.color, summary:p.summary, body:p.body, image_url:p.image }; }
  function docFrom(r){ return { id:r.id, title:r.title, meta:r.meta||"", tag:r.tag||"", url:r.url||"" }; }
  function docTo(p){ return { title:p.title, meta:p.meta, tag:p.tag, url:p.url }; }

  function check(res){ if(res.error){ console.error(res.error); throw res.error; } return res.data; }

  /* ---------- THU NHỎ ẢNH → BLOB ---------- */
  function resizeToBlob(file, maxW){
    return new Promise(function(resolve,reject){
      var fr=new FileReader();
      fr.onload=function(){ var img=new Image();
        img.onload=function(){
          var scale=Math.min(1,maxW/img.width);
          var cw=Math.round(img.width*scale), ch=Math.round(img.height*scale);
          var c=document.createElement("canvas"); c.width=cw; c.height=ch;
          c.getContext("2d").drawImage(img,0,0,cw,ch);
          c.toBlob(function(b){ resolve(b); }, "image/jpeg", 0.82);
        };
        img.onerror=reject; img.src=fr.result;
      };
      fr.onerror=reject; fr.readAsDataURL(file);
    });
  }

  /* ============================================================
     API CÔNG KHAI
     ============================================================ */
  var API = {
    configured: configured,
    ready: !!sb,

    // ---- ĐỌC DỮ LIỆU ----
    getMembers: async function(){
      if(!sb) return DEFAULTS.members.slice();
      var data = check(await sb.from("members").select("*").order("sort",{ascending:true}));
      return (data||[]).map(memberFrom);
    },
    getNews: async function(){
      if(!sb) return DEFAULTS.news.slice();
      var data = check(await sb.from("news").select("*").order("created_at",{ascending:false}));
      return (data||[]).map(newsFrom);
    },
    getNewsById: async function(id){
      if(!sb) return DEFAULTS.news.find(function(n){return n.id===id;});
      var data = check(await sb.from("news").select("*").eq("id",id).maybeSingle());
      return data?newsFrom(data):null;
    },
    getDocuments: async function(){
      if(!sb) return DEFAULTS.documents.slice();
      var data = check(await sb.from("documents").select("*").order("created_at",{ascending:false}));
      return (data||[]).map(docFrom);
    },

    // ---- GHI DỮ LIỆU (cần đăng nhập) ----
    updateMember: async function(id,patch){ check(await sb.from("members").update(memberTo(patch)).eq("id",id)); },
    addNews: async function(obj){ check(await sb.from("news").insert(newsTo(obj))); },
    updateNews: async function(id,obj){ check(await sb.from("news").update(newsTo(obj)).eq("id",id)); },
    removeNews: async function(id){ check(await sb.from("news").delete().eq("id",id)); },
    addDoc: async function(obj){ check(await sb.from("documents").insert(docTo(obj))); },
    updateDoc: async function(id,obj){ check(await sb.from("documents").update(docTo(obj)).eq("id",id)); },
    removeDoc: async function(id){ check(await sb.from("documents").delete().eq("id",id)); },

    // ---- ẢNH (Storage) ----
    uploadImage: async function(file){
      if(!sb) throw new Error("Chưa cấu hình Supabase.");
      var blob = await resizeToBlob(file, 1000);
      var path = "img_"+Date.now()+"_"+Math.random().toString(36).slice(2)+".jpg";
      var up = await sb.storage.from("media").upload(path, blob, { contentType:"image/jpeg", upsert:false });
      if(up.error) throw up.error;
      return sb.storage.from("media").getPublicUrl(path).data.publicUrl;
    },

    // ---- XÁC THỰC ----
    auth: {
      getUser: async function(){ if(!sb) return null; var r=await sb.auth.getSession(); return (r.data && r.data.session) ? r.data.session.user : null; },
      signIn: async function(email,password){
        if(!sb) throw new Error("Website chưa được cấu hình Supabase. Vui lòng cập nhật assets/js/config.js.");
        var r=await sb.auth.signInWithPassword({ email:email, password:password });
        if(r.error) throw r.error; return r.data.user;
      },
      signOut: async function(){ if(sb) await sb.auth.signOut(); }
    }
  };

  w.API = API;
})(window);
