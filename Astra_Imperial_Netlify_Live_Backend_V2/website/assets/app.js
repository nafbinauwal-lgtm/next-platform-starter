(function(){
  const $ = (s)=>document.querySelector(s);
  const cfg = (window.AI_CONFIG||{});
  const hasSupabase = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);

  function toast(msg){
    const t = document.createElement("div");
    t.className = "notice";
    t.style.position="fixed"; t.style.right="18px"; t.style.bottom="18px"; t.style.maxWidth="420px";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(()=>t.remove(), 3500);
  }

  const demoAuth = {
    login(u,p){ if(u==="admin" && p==="Astra2026!"){ localStorage.setItem("ai_demo_authed","1"); return true; } return false; },
    logout(){ localStorage.removeItem("ai_demo_authed"); location.href="portal-login.html"; },
    require(){ if(localStorage.getItem("ai_demo_authed")!=="1"){ location.href="portal-login.html"; } }
  };

  async function ensureSupabase(){
    if(!hasSupabase) return null;
    if(window.supabase) return window.supabase;
    await new Promise((res, rej)=>{
      const s=document.createElement("script");
      s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      s.onload=res; s.onerror=rej;
      document.head.appendChild(s);
    });
    return window.supabase;
  }

  async function sbClient(){
    const supa = await ensureSupabase();
    if(!supa) return null;
    return supa.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  }

  function computeScore(){
    const v = (id)=> (($(id)?.value||"").trim());
    const pick = (name)=> (document.querySelector(`input[name="${name}"]:checked`)?.value||"0");
    const n = (x)=> Number(x||0);
    let score = 0;
    score += n(pick("urgency"));
    score += n(pick("budget"));
    score += n(pick("readiness"));
    score += n(pick("complexity"));
    if(v("#industry").length>=3) score += 10;
    if(v("#brief").length>=80) score += 15;
    if(v("#email").includes("@")) score += 10;
    if(v("#phone").length>=8) score += 5;
    const tier = score>=75 ? "Priority (A)" : score>=50 ? "Standard (B)" : "Review (C)";
    return {score, tier};
  }

  function renderScore(){
    const out = $("#scoreOut");
    if(!out) return;
    const {score,tier} = computeScore();
    out.textContent = `${score}/100 • ${tier}`;
  }

  async function demoSaveSubmission(obj, res){
    const submissions = JSON.parse(localStorage.getItem("ai_demo_submissions")||"[]");
    submissions.unshift({
      id: "AI-" + Math.random().toString(36).slice(2,10).toUpperCase(),
      when: new Date().toISOString(),
      name: obj.name || "(no name)",
      email: obj.email || "",
      service: obj.service || "",
      score: res.score,
      tier: res.tier
    });
    localStorage.setItem("ai_demo_submissions", JSON.stringify(submissions.slice(0,100)));
  }

  async function supaSaveSubmission(obj, res){
    const client = await sbClient();
    if(!client) throw new Error("Supabase not configured");
    const { data: { user } } = await client.auth.getUser();
    const payload = {
      full_name: obj.name || null,
      company: obj.company || null,
      email: obj.email || null,
      phone: obj.phone || null,
      service: obj.service || null,
      industry: obj.industry || null,
      jurisdiction: obj.jurisdiction || null,
      brief: obj.brief || null,
      score: res.score,
      tier: res.tier,
      user_id: user ? user.id : null
    };
    const { error } = await client.from("submissions").insert(payload);
    if(error) throw error;
  }

  async function demoRenderTable(){
    const table = $("#submissionsTable");
    if(!table) return;
    const submissions = JSON.parse(localStorage.getItem("ai_demo_submissions")||"[]");
    table.innerHTML = submissions.map(s=>`
      <tr>
        <td>${s.id}</td>
        <td>${new Date(s.when).toLocaleString()}</td>
        <td>${s.name}</td>
        <td>${s.service}</td>
        <td><span class="pill">${s.score} • ${s.tier}</span></td>
      </tr>
    `).join("") || `<tr><td colspan="5" class="muted">No submissions yet.</td></tr>`;
  }

  async function supaRenderTable(){
    const table = $("#submissionsTable");
    if(!table) return;
    const client = await sbClient();
    if(!client) return demoRenderTable();
    const { data: { user } } = await client.auth.getUser();
    if(user){
      const { data, error } = await client.from("submissions")
        .select("id, created_at, full_name, service, score, tier")
        .eq("user_id", user.id)
        .order("created_at", { ascending:false })
        .limit(50);
      if(error) throw error;
      table.innerHTML = (data||[]).map(s=>`
        <tr>
          <td>${s.id}</td>
          <td>${new Date(s.created_at).toLocaleString()}</td>
          <td>${s.full_name||""}</td>
          <td>${s.service||""}</td>
          <td><span class="pill">${s.score} • ${s.tier}</span></td>
        </tr>
      `).join("") || `<tr><td colspan="5" class="muted">No submissions yet.</td></tr>`;
    }else{
      await demoRenderTable();
    }
  }

  async function handleLogin(e){
    e.preventDefault();
    const u = $("#username").value.trim();
    const p = $("#password").value;

    if(hasSupabase && u.includes("@")){
      try{
        const client = await sbClient();
        const { error } = await client.auth.signInWithPassword({ email:u, password:p });
        if(error) throw error;
        toast("Logged in.");
        location.href="portal-dashboard.html";
        return;
      }catch(err){
        toast("Login failed: " + (err.message||err));
        return;
      }
    }

    if(demoAuth.login(u,p)){
      toast("Access granted (demo).");
      location.href="portal-dashboard.html";
    }else{
      toast("Invalid credentials.");
    }
  }

  async function handleSignup(e){
    e.preventDefault();
    if(!hasSupabase){
      toast("Real accounts require Supabase setup. Site is currently in demo mode.");
      return;
    }
    const email = $("#signupEmail").value.trim();
    const pass = $("#signupPassword").value;
    const client = await sbClient();
    const { error } = await client.auth.signUp({ email, password: pass });
    if(error){ toast("Sign up failed: " + error.message); return; }
    toast("Account created. Check your email if verification is enabled. Then log in.");
  }

  async function handleOnboard(e){
    e.preventDefault();
    const data = new FormData(e.target);
    const obj = {};
    data.forEach((v,k)=>obj[k]=v);
    const res = computeScore();

    try{
      if(hasSupabase){ await supaSaveSubmission(obj,res); }
      else { await demoSaveSubmission(obj,res); }
      toast(`Submitted. Score: ${res.score}/100 (${res.tier}).`);
      e.target.reset();
      renderScore();
    }catch(err){
      toast("Submission failed: " + (err.message||err));
    }
  }

  async function handleLogout(){
    if(hasSupabase){
      try{
        const client = await sbClient();
        await client.auth.signOut();
      }catch(e){}
    }
    demoAuth.logout();
  }

  async function requireAuth(){
    if(hasSupabase){
      const client = await sbClient();
      const { data: { user } } = await client.auth.getUser();
      if(user) return true;
    }
    demoAuth.require();
    return false;
  }

  document.addEventListener("input", ()=>{ if($("#scoreOut")) renderScore(); });

  document.addEventListener("DOMContentLoaded", async ()=>{
    const modeEl = $("#modeIndicator");
    if(modeEl) modeEl.textContent = hasSupabase ? "LIVE (Supabase)" : "DEMO (Local)";
    if($("#scoreOut")) renderScore();

    if(document.body.dataset.page==="login"){
      $("#loginForm")?.addEventListener("submit", handleLogin);
      $("#signupForm")?.addEventListener("submit", handleSignup);
      $("#logoutBtn")?.addEventListener("click", (e)=>{ e.preventDefault(); handleLogout(); });
    }

    if(document.body.dataset.page==="onboarding"){
      $("#onboardForm")?.addEventListener("submit", handleOnboard);
    }

    if(document.body.dataset.page==="dashboard"){
      await requireAuth();
      try{ await supaRenderTable(); } catch(e){ toast("Dashboard error: " + (e.message||e)); await demoRenderTable(); }
      $("#logoutBtn")?.addEventListener("click", (e)=>{ e.preventDefault(); handleLogout(); });
    }
  });

  window.AI_PORTAL = { toast, logout: handleLogout };
})();