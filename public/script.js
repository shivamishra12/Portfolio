/* ══════════════════════════════════════════
   script.js — Portfolio Frontend
   Fetches projects from /api/projects
══════════════════════════════════════════ */

/* ════════════════════════
   1. CUSTOM CURSOR
════════════════════════ */
(function() {
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  let mx=-100, my=-100, rx=-100, ry=-100;
  document.addEventListener('mousemove', e => {
    mx=e.clientX; my=e.clientY;
    dot.style.left=mx+'px'; dot.style.top=my+'px';
  });
  (function animRing() {
    rx+=(mx-rx)*0.14; ry+=(my-ry)*0.14;
    ring.style.left=rx+'px'; ring.style.top=ry+'px';
    requestAnimationFrame(animRing);
  })();
  document.addEventListener('mouseleave',()=>{dot.style.opacity=0;ring.style.opacity=0;});
  document.addEventListener('mouseenter',()=>{dot.style.opacity=1;ring.style.opacity=1;});
})();

/* ════════════════════════
   2. PARTICLES
════════════════════════ */
(function() {
  const c=document.getElementById('particle-canvas'), x=c.getContext('2d');
  let W,H,pts;
  function resize(){
    W=c.width=window.innerWidth; H=c.height=window.innerHeight;
    pts=Array.from({length:Math.min(Math.floor(W*H/7000),120)},()=>({
      x:Math.random()*W,y:Math.random()*H,
      vx:(Math.random()-.5)*.28,vy:(Math.random()-.5)*.28,
      r:Math.random()*1.8+.4,
      c:Math.random()>.55?`rgba(247,37,133,${(Math.random()*.55+.2).toFixed(2)})`:
                          `rgba(160,200,255,${(Math.random()*.35+.1).toFixed(2)})`
    }));
  }
  resize(); window.addEventListener('resize',resize);
  function draw(){
    x.clearRect(0,0,W,H);
    pts.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0)p.x=W; if(p.x>W)p.x=0;
      if(p.y<0)p.y=H; if(p.y>H)p.y=0;
      x.beginPath(); x.arc(p.x,p.y,p.r,0,Math.PI*2);
      x.fillStyle=p.c; x.shadowBlur=p.r*5; x.shadowColor=p.c;
      x.fill(); x.shadowBlur=0;
    });
    for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
      const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy);
      if(d<110){
        x.beginPath(); x.moveTo(pts[i].x,pts[i].y); x.lineTo(pts[j].x,pts[j].y);
        x.strokeStyle=`rgba(247,37,133,${(0.07*(1-d/110)).toFixed(3)})`; x.lineWidth=0.5; x.stroke();
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ════════════════════════
   3. GROOT CLICK
════════════════════════ */
(function() {
  const wrap=document.getElementById('grootWrap');
  const img =document.getElementById('grootImg');
  const bbl =document.getElementById('speechBubble');
  let timer;
  wrap.addEventListener('click',()=>{
    bbl.classList.remove('hidden');
    img.style.transition='transform .15s'; img.style.transform='scale(1.05)';
    setTimeout(()=>{img.style.transform='';img.style.transition='';},200);
    clearTimeout(timer); timer=setTimeout(()=>bbl.classList.add('hidden'),3200);
  });
})();

/* ════════════════════════
   4. TYPING ANIMATION
════════════════════════ */
(function() {
  const el=document.getElementById('typedText');
  const titles=['AI Developer','Machine Learning Engineer','Data Science Enthusiast','MLOps Engineer','Deep Learning Practitioner'];
  let ti=0,ci=0,del=false;
  function tick(){
    const w=titles[ti];
    if(!del){el.textContent=w.slice(0,++ci);if(ci===w.length){del=true;setTimeout(tick,2000);return;}}
    else{el.textContent=w.slice(0,--ci);if(ci===0){del=false;ti=(ti+1)%titles.length;}}
    setTimeout(tick,del?38:72);
  }
  tick();
})();

/* ════════════════════════
   5. HERO ENTRANCE
════════════════════════ */
(function() {
  ['#navbar','.hero-pill','.hero-name','.hero-role','.hero-desc','.hero-cta','.hero-metrics','.scroll-indicator','.click-hint','.groot-wrap'].forEach((sel,i)=>{
    const el=document.querySelector(sel);
    if(!el)return;
    el.style.opacity='0'; el.style.transform='translateY(22px)';
    el.style.transition=`opacity .65s ease ${i*.09}s, transform .65s ease ${i*.09}s`;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{el.style.opacity='';el.style.transform='';}));
  });
})();

/* ════════════════════════
   6. SCROLL REVEAL
════════════════════════ */
(function() {
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});
  },{threshold:.12});
  document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(t=>obs.observe(t));
})();

/* ════════════════════════
   7. NAVBAR
════════════════════════ */
(function() {
  const nav=document.getElementById('navbar');
  window.addEventListener('scroll',()=>nav.classList.toggle('scrolled',window.scrollY>50));
  document.querySelectorAll('a[href^="#"]').forEach(l=>l.addEventListener('click',e=>{
    e.preventDefault();
    const t=document.querySelector(l.getAttribute('href'));
    if(t)t.scrollIntoView({behavior:'smooth'});
  }));
})();

/* ════════════════════════
   8. FETCH PROJECTS FROM API
   & render dynamic cards
════════════════════════ */
let cachedProjects = [];
let showAllProjects = false;

function toggleAllProjects() {
  showAllProjects = true;
  renderProjects(cachedProjects);
}

async function loadProjects() {
  // Animate loading dots
  const dots = document.getElementById('loadDots');
  let d = 0;
  const dotAnim = setInterval(() => {
    d = (d + 1) % 4;
    dots.textContent = '.'.repeat(d) || '...';
  }, 400);

  try {
    const res  = await fetch('/api/projects');
    cachedProjects = await res.json();

    clearInterval(dotAnim);
    document.getElementById('projects-loading').style.display = 'none';

    // Update project count in hero
    document.getElementById('projectCount').textContent = cachedProjects.length + '+';

    renderProjects(cachedProjects);
  } catch(err) {
    clearInterval(dotAnim);
    document.getElementById('projects-loading').innerHTML =
      '<div style="text-align:center;padding:40px;color:#ff8a92;font-family:\'Space Mono\',monospace;font-size:0.82rem;">⚠ Could not load projects. Is the server running?<br/><a href="/admin" style="color:#f72585;margin-top:8px;display:inline-block">Go to Admin →</a></div>';
  }
}

function renderProjects(projects) {
  const grid     = document.getElementById('projectsGrid');
  const viewAll  = document.getElementById('viewAllWrap');

  if (!projects.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;font-family:\'Space Mono\',monospace;color:rgba(240,246,255,0.4);font-size:0.82rem;">No projects yet.</div>';
    grid.style.display = 'grid';
    viewAll.style.display = 'none';
    return;
  }

  const pinnedProjects = projects.filter(p => p.is_pinned);
  const initialProjects = pinnedProjects.length > 0 ? pinnedProjects : projects.slice(0, 3);
  const projectsToShow = showAllProjects ? projects : initialProjects;

  grid.innerHTML = projectsToShow.map((p, i) => {
    const tags = Array.isArray(p.tags) ? p.tags : (p.tags||'').split(',').filter(Boolean);
    const img  = p.image_url
      ? `<img src="${p.image_url}" alt="${escHtml(p.title)}" style="width:100%;height:100%;object-fit:cover;"/>`
      : `<span class="pcard-emoji">${p.emoji || '🚀'}</span>`;

    return `
    <div class="project-card reveal" style="--rd:${i*0.07}s" onclick="openModal(${p.id})">
      <div class="pcard-img" style="background:${p.gradient || 'linear-gradient(135deg,#1a1a2e,#16213e)'}">
        ${img}
      </div>
      <div class="pcard-body">
        <h3>${escHtml(p.title)}</h3>
        <p>${escHtml(p.description)}</p>
        <div class="pcard-tags">
          ${tags.slice(0,3).map(t=>`<span>${escHtml(t.trim())}</span>`).join('')}
        </div>
        <button class="btn-card">View Details →</button>
      </div>
    </div>`;
  }).join('');

  grid.style.display = 'grid';

  if (projects.length > initialProjects.length && !showAllProjects) {
    viewAll.style.display = 'block';
  } else {
    viewAll.style.display = 'none';
  }

  // Re-run scroll reveal on new cards
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});
  },{threshold:.1});
  grid.querySelectorAll('.reveal').forEach(t=>obs.observe(t));

  // Card tilt
  grid.querySelectorAll('.project-card').forEach(card=>{
    card.addEventListener('mousemove',e=>{
      const r=card.getBoundingClientRect();
      const nx=(e.clientX-r.left)/r.width-.5;
      const ny=(e.clientY-r.top)/r.height-.5;
      card.style.transform=`translateY(-12px) rotateX(${-ny*10}deg) rotateY(${nx*10}deg)`;
    });
    card.addEventListener('mouseleave',()=>card.style.transform='');
  });
}

/* ════════════════════════
   9. MODAL — project detail
   fetches from API by ID
════════════════════════ */
async function openModal(id) {
  // Find from cache first
  let p = cachedProjects.find(x => x.id === id);
  if (!p) {
    try {
      const res = await fetch(`/api/projects/${id}`);
      p = await res.json();
    } catch(e) { return; }
  }

  const tags = Array.isArray(p.tags) ? p.tags : (p.tags||'').split(',').filter(Boolean);
  const imgHtml = p.image_url
    ? `<img src="${p.image_url}" alt="${escHtml(p.title)}" style="width:100%;border-radius:12px;object-fit:cover;max-height:240px;margin-bottom:20px;"/>`
    : '';

  let galleryHtml = '';
  if (p.gallery_urls) {
    const urls = p.gallery_urls.split(',').filter(Boolean);
    if (urls.length > 0) {
      galleryHtml = `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px;">
        ${urls.map(url => `<img src="${url}" style="width:100%; height:120px; object-fit:cover; border-radius:8px; border:1px solid rgba(255,255,255,0.1);"/>`).join('')}
      </div>`;
    }
  }

  document.getElementById('modalContent').innerHTML = `
    <span style="font-size:3rem;display:block;margin-bottom:14px;">${p.emoji || '🚀'}</span>
    ${imgHtml}
    ${galleryHtml}
    <h2 class="modal-title">${escHtml(p.title)}</h2>
    <p class="modal-desc">${escHtml(p.full_desc || p.description)}</p>
    <div class="modal-tags">${tags.map(t=>`<span>${escHtml(t.trim())}</span>`).join('')}</div>
    <div class="modal-links">
      ${p.github_url   ? `<a href="${p.github_url}"   target="_blank" class="link-gh">⚡ GitHub Repo</a>` : ''}
      ${p.linkedin_url ? `<a href="${p.linkedin_url}" target="_blank" class="link-li">🔗 LinkedIn Post</a>` : ''}
    </div>
    ${p.team ? `<p class="modal-team-h">// Team Members</p><p class="modal-team-p">${escHtml(p.team)}</p>` : ''}
  `;

  document.getElementById('projectModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('projectModal').classList.add('hidden');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => { if(e.key==='Escape') closeModal(); });

/* ════════════════════════
   10. UTILS
   ════════════════════════ */
function escHtml(str) {
  return String(str||'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

document.getElementById('fyear').textContent = new Date().getFullYear();

/* ════════════════════════
   EXTRA FEATURE LOADERS
   ════════════════════════ */

async function loadResume() {
  try {
    const res = await fetch('/api/resume');
    const data = await res.json();
    if (data && data.url) {
      const heroBtn = document.getElementById('resumeBtnHero');
      const aboutBtn = document.getElementById('resumeBtnAbout');
      if (heroBtn) {
        heroBtn.href = data.url;
        heroBtn.setAttribute('download', 'Shivam_Mishra_Resume.pdf');
        heroBtn.style.display = 'inline-block';
      }
      if (aboutBtn) {
        aboutBtn.href = data.url;
        aboutBtn.setAttribute('download', 'Shivam_Mishra_Resume.pdf');
        aboutBtn.style.display = 'inline-block';
      }
    }
  } catch (err) {
    console.error('Error loading resume:', err);
  }
}

async function loadUpcoming() {
  try {
    const res = await fetch('/api/upcoming');
    const projects = await res.json();
    document.getElementById('upcoming-loading').style.display = 'none';
    const grid = document.getElementById('upcomingGrid');
    
    if (!projects.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;font-family:\'Space Mono\',monospace;color:rgba(240,246,255,0.4);font-size:0.82rem;">No upcoming projects planned yet.</div>';
      grid.style.display = 'grid';
      return;
    }
    
    grid.innerHTML = projects.map((p, i) => {
      const dateText = p.expected_date ? new Date(p.expected_date).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'}) : 'To Be Announced';
      const statusClass = 'status-' + p.status;
      const statusLabel = p.status.replace('-', ' ');
      const tags = Array.isArray(p.tech_stack) ? p.tech_stack : (p.tech_stack||'').split(',').filter(Boolean);
      
      return `
        <div class="upcoming-card glass-card reveal" style="--rd:${i*0.07}s">
          <div class="upcoming-header">
            <span class="upcoming-status ${statusClass}">${escHtml(statusLabel)}</span>
            <span class="upcoming-date">📅 Expected: ${escHtml(dateText)}</span>
          </div>
          <h3>${escHtml(p.title)}</h3>
          <p>${escHtml(p.description)}</p>
          <div class="upcoming-tags">
            ${tags.map(t=>`<span>${escHtml(t.trim())}</span>`).join('')}
          </div>
        </div>
      `;
    }).join('');
    grid.style.display = 'grid';
    
    const obs = new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});
    },{threshold:.1});
    grid.querySelectorAll('.reveal').forEach(t=>obs.observe(t));
  } catch (err) {
    document.getElementById('upcoming-loading').innerHTML = '<div style="text-align:center;padding:20px;color:#ff8a92;font-family:\'Space Mono\',monospace;font-size:0.82rem;">⚠ Failed to load upcoming projects.</div>';
  }
}

async function loadActivities() {
  try {
    const res = await fetch('/api/activities');
    const activities = await res.json();
    document.getElementById('activities-loading').style.display = 'none';
    const grid = document.getElementById('activitiesGrid');
    
    if (!activities.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;font-family:\'Space Mono\',monospace;color:rgba(240,246,255,0.4);font-size:0.82rem;">No activities listed yet.</div>';
      grid.style.display = 'grid';
      return;
    }
    
    grid.innerHTML = activities.map((a, i) => {
      const dateText = a.date ? new Date(a.date).toLocaleDateString(undefined, {year: 'numeric', month: 'short'}) : '';
      const imgs = Array.isArray(a.image_urls) ? a.image_urls : (a.image_urls||'').split(',').filter(Boolean);
      const certs = Array.isArray(a.certificates) ? a.certificates : (a.certificates||'').split(',').filter(Boolean);
      
      let imgHtml = '';
      if (imgs.length > 0) {
        imgHtml = `<div class="activity-gallery">
          ${imgs.map(img => `<img src="${img}" alt="${escHtml(a.title)}" class="activity-img" />`).join('')}
        </div>`;
      }
      
      return `
        <div class="activity-card glass-card reveal" style="--rd:${i*0.07}s">
          <div class="activity-meta">
            <span class="activity-category">${escHtml(a.category || 'Event')}</span>
            <span class="activity-date">${escHtml(dateText)}</span>
          </div>
          <h3>${escHtml(a.title)}</h3>
          <p>${escHtml(a.description)}</p>
          ${imgHtml}
          ${certs.length > 0 ? `
            <div class="activity-certs">
              ${certs.map(c => `<span>✓ ${escHtml(c.trim())}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
    grid.style.display = 'grid';
    
    const obs = new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});
    },{threshold:.1});
    grid.querySelectorAll('.reveal').forEach(t=>obs.observe(t));
  } catch (err) {
    document.getElementById('activities-loading').innerHTML = '<div style="text-align:center;padding:20px;color:#ff8a92;font-family:\'Space Mono\',monospace;font-size:0.82rem;">⚠ Failed to load activities.</div>';
  }
}

async function loadCertificates() {
  try {
    const res = await fetch('/api/certificates');
    const certificates = await res.json();
    document.getElementById('certificates-loading').style.display = 'none';
    const grid = document.getElementById('certificatesGrid');
    
    if (!certificates.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;font-family:\'Space Mono\',monospace;color:rgba(240,246,255,0.4);font-size:0.82rem;">No certifications listed yet.</div>';
      grid.style.display = 'grid';
      return;
    }
    
    grid.innerHTML = certificates.map((c, i) => {
      const dateText = c.date ? new Date(c.date).toLocaleDateString(undefined, {year: 'numeric', month: 'short'}) : '';
      const imgHtml = c.image_url ? `<img src="${c.image_url}" alt="${escHtml(c.title)}" class="cert-img"/>` : `<div class="cert-placeholder-icon">🏆</div>`;
      
      return `
        <div class="cert-card glass-card reveal" style="--rd:${i*0.07}s">
          <div class="cert-media-wrap">${imgHtml}</div>
          <div class="cert-body">
            <h3>${escHtml(c.title)}</h3>
            <p class="cert-issuer">${escHtml(c.issuer)} · <span class="cert-date">${escHtml(dateText)}</span></p>
            ${c.credential_url ? `<a href="${c.credential_url}" target="_blank" class="btn-card cert-link" style="margin-top:10px; display:inline-block;">Verify Credential →</a>` : ''}
          </div>
        </div>
      `;
    }).join('');
    grid.style.display = 'grid';
    
    const obs = new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});
    },{threshold:.1});
    grid.querySelectorAll('.reveal').forEach(t=>obs.observe(t));
  } catch (err) {
    document.getElementById('certificates-loading').innerHTML = '<div style="text-align:center;padding:20px;color:#ff8a92;font-family:\'Space Mono\',monospace;font-size:0.82rem;">⚠ Failed to load certifications.</div>';
  }
}

async function loadPartners() {
  try {
    const res = await fetch('/api/partners');
    const partners = await res.json();
    document.getElementById('partners-loading').style.display = 'none';
    const grid = document.getElementById('partnersGrid');
    
    if (!partners.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;font-family:\'Space Mono\',monospace;color:rgba(240,246,255,0.4);font-size:0.82rem;">No collaborators listed yet.</div>';
      grid.style.display = 'grid';
      return;
    }
    
    grid.innerHTML = partners.map((p, i) => {
      const avatarHtml = p.image_url ? `<img src="${p.image_url}" alt="${escHtml(p.name)}" class="partner-avatar" />` : `<div class="partner-avatar-placeholder">${escHtml(p.name[0])}</div>`;
      
      return `
        <div class="partner-card glass-card reveal" style="--rd:${i*0.07}s">
          <div class="partner-header">
            ${avatarHtml}
            <div>
              <h3>${escHtml(p.name)}</h3>
              <p class="partner-role">${escHtml(p.role)}</p>
            </div>
          </div>
          <p class="partner-bio">${escHtml(p.bio)}</p>
          ${p.link ? `<a href="${p.link}" target="_blank" class="partner-link" style="margin-top: auto; display:inline-block; width:fit-content;">Connect ↗</a>` : ''}
        </div>
      `;
    }).join('');
    grid.style.display = 'grid';
    
    const obs = new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});
    },{threshold:.1});
    grid.querySelectorAll('.reveal').forEach(t=>obs.observe(t));
  } catch (err) {
    document.getElementById('partners-loading').innerHTML = '<div style="text-align:center;padding:20px;color:#ff8a92;font-family:\'Space Mono\',monospace;font-size:0.82rem;">⚠ Failed to load collaborators.</div>';
  }
}

function setupContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('c-submitBtn');
    const statusDiv = document.getElementById('c-status');
    
    const name = document.getElementById('c-name').value.trim();
    const email = document.getElementById('c-email').value.trim();
    const message = document.getElementById('c-message').value.trim();
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending Message...';
    statusDiv.style.color = 'var(--white-60)';
    statusDiv.textContent = 'Uploading...';
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });
      
      const data = await response.json();
      if (data.success) {
        statusDiv.style.color = '#7ef5a8';
        statusDiv.textContent = '✅ Message sent! Shivam will get back to you soon.';
        form.reset();
      } else {
        statusDiv.style.color = '#ff8a92';
        statusDiv.textContent = '❌ Failed to send: ' + (data.error || 'Server error.');
      }
    } catch (err) {
      statusDiv.style.color = '#ff8a92';
      statusDiv.textContent = '❌ Connection error. Please try again.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message →';
    }
  });
}

async function loadSkills() {
  try {
    const res = await fetch('/api/skills');
    const skills = await res.json();
    const grid = document.getElementById('skillsGrid');
    if (!grid) return;
    if (!skills.length) {
      grid.innerHTML = '<span style="font-family:\'Space Mono\',monospace;color:rgba(240,246,255,0.4);font-size:0.82rem;">No skills listed.</span>';
      return;
    }
    grid.innerHTML = skills.map(s => `<span class="schip">${escHtml(s.name)}</span>`).join('');
  } catch (err) {
    console.error('Error loading skills:', err);
  }
}

async function loadEducation() {
  try {
    const res = await fetch('/api/education');
    const edu = await res.json();
    const grid = document.getElementById('educationGrid');
    if (!grid) return;
    if (!edu.length) {
      grid.innerHTML = '<div style="font-family:\'Space Mono\',monospace;color:rgba(240,246,255,0.4);font-size:0.82rem;padding:20px 0;">No education records listed.</div>';
      return;
    }
    grid.innerHTML = edu.map((e, idx) => {
      const tags = Array.isArray(e.tags) ? e.tags : (e.tags || '').split(',').filter(Boolean);
      const tagRow = tags.length > 0 
        ? `<p class="edu-detail edu-tag-row">${tags.map(t => `<span class="etag">${escHtml(t.trim())}</span>`).join('')}</p>` 
        : '';
        
      const instLine = e.institution ? `<p class="edu-detail">College: <strong>${escHtml(e.institution)}</strong></p>` : '';
      const dateLine = e.date_range ? `<p class="edu-detail">Year: <strong>${escHtml(e.date_range)}</strong></p>` : '';
      const subtitleLine = e.subtitle ? `<p class="edu-detail">${escHtml(e.subtitle)}</p>` : '';
      
      return `
        <div class="glass-card edu-card reveal" style="--d:${idx * 0.15}s">
          <div class="edu-icon">${escHtml(e.icon || '🎓')}</div>
          <div>
            <h3>${escHtml(e.title)}</h3>
            ${subtitleLine}
            ${instLine}
            ${dateLine}
            ${tagRow}
          </div>
        </div>
      `;
    }).join('');
    
    // Re-run scroll reveal on new cards
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: .12 });
    grid.querySelectorAll('.reveal').forEach(t => obs.observe(t));
  } catch (err) {
    console.error('Error loading education:', err);
  }
}

async function loadBlogs() {
  try {
    const res = await fetch('/api/blogs');
    const blogs = await res.json();
    document.getElementById('blogs-loading').style.display = 'none';
    const grid = document.getElementById('blogsGrid');

    if (!blogs.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;font-family:\'Space Mono\',monospace;color:rgba(240,246,255,0.4);font-size:0.82rem;">No blogs posted yet.</div>';
      grid.style.display = 'grid';
      return;
    }

    grid.innerHTML = blogs.map((b, i) => {
      const platformClass = 'platform-' + b.platform.toLowerCase().replace(/[^a-z0-9]/g, '');
      const dateText = b.created_at ? new Date(b.created_at).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'}) : '';
      
      return `
        <div class="blog-card glass-card reveal" style="--rd:${i*0.07}s">
          <div class="blog-meta">
            <span class="blog-platform ${platformClass}">${escHtml(b.platform)}</span>
            ${dateText ? `<span class="blog-date">📅 ${escHtml(dateText)}</span>` : ''}
          </div>
          <h3>${escHtml(b.title)}</h3>
          <p>${escHtml(b.description)}</p>
          <a href="${escHtml(b.link)}" target="_blank" class="btn-card blog-link">Read Article →</a>
        </div>
      `;
    }).join('');
    grid.style.display = 'grid';

    // Scroll reveal logic
    const obs = new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});
    },{threshold:.1});
    grid.querySelectorAll('.reveal').forEach(t=>obs.observe(t));
  } catch (err) {
    document.getElementById('blogs-loading').innerHTML = '<div style="text-align:center;padding:20px;color:#ff8a92;font-family:\'Space Mono\',monospace;font-size:0.82rem;">⚠ Failed to load articles.</div>';
  }
}

async function loadSocials() {
  try {
    const res = await fetch('/api/socials');
    const socials = await res.json();
    const container = document.getElementById('socialsContainer');
    if (!container) return;

    if (!socials.length) {
      container.innerHTML = '<div style="font-family:\'Space Mono\',monospace;color:rgba(240,246,255,0.4);font-size:0.82rem;width:100%;text-align:center;">No social links available.</div>';
      return;
    }

    container.innerHTML = socials.map(s => {
      const iconSvg = getSocialIcon(s.name);
      return `
        <a href="${escHtml(s.url)}" target="_blank" class="clink">
          ${iconSvg}
          <span>${escHtml(s.name)}</span>
        </a>
      `;
    }).join('');

    // Setup hover effect and micro-animations
    container.querySelectorAll('.clink').forEach(link => {
      const svg = link.querySelector('svg');
      link.addEventListener('mouseenter', () => {
        if (svg) svg.style.transform = 'scale(1.2) rotate(-5deg)';
      });
      link.addEventListener('mouseleave', () => {
        if (svg) svg.style.transform = '';
      });
    });

  } catch (err) {
    console.error('Error loading socials:', err);
    document.getElementById('socialsContainer').innerHTML = '<div style="font-family:\'Space Mono\',monospace;color:#ff8a92;font-size:0.82rem;width:100%;text-align:center;">⚠ Failed to load profiles.</div>';
  }
}

function getSocialIcon(name) {
  const cleanName = name.toLowerCase().trim();
  if (cleanName.includes('github')) {
    return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`;
  }
  if (cleanName.includes('linkedin')) {
    return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`;
  }
  if (cleanName.includes('instagram')) {
    return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`;
  }
  if (cleanName.includes('leetcode')) {
    return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.483 0a1.374 1.374 0 00-.961.411L7.116 5.9a1.375 1.375 0 101.944 1.944l5.406-5.405L22.547 10.5a1.375 1.375 0 101.944-1.944L14.444.411A1.374 1.374 0 0013.483 0zm-5.67 8.358a1.375 1.375 0 00-1.944 0L.411 13.816a1.375 1.375 0 000 1.944l5.458 5.458a1.375 1.375 0 001.944-1.944L2.355 13.8l5.458-5.442zM22.563 11.83l-5.458 5.458a1.375 1.375 0 001.944 1.944l5.458-5.458a1.375 1.375 0 00-1.944-1.944zm-5.458 5.458l-5.458-5.458a1.375 1.375 0 00-1.944 1.944l5.458 5.458a1.375 1.375 0 001.944-1.944z"/></svg>`;
  }
  if (cleanName.includes('geeksforgeeks') || cleanName === 'gfg') {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1m8-18h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1"/></svg>`;
  }
  if (cleanName.includes('email') || cleanName.includes('mail')) {
    return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`;
  }
  if (cleanName.includes('phone') || cleanName.includes('call') || cleanName.includes('tel')) {
    return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>`;
  }
  if (cleanName.includes('twitter') || cleanName === 'x') {
    return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
}

/* ════════════════════════
   KICK OFF
   ════════════════════════ */
loadProjects();
loadSkills();
loadEducation();
loadResume();
loadUpcoming();
loadActivities();
loadCertificates();
loadPartners();
loadBlogs();
loadSocials();
setupContactForm();
