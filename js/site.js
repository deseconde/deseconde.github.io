// Script dùng chung cho mọi trang. Nạp cuối <body>, trước script riêng của trang.

// ---- Lightbox gallery ----
var galleryFolder = null, galleryKey = null, galleryCount = 0, galleryIndex = 0, galleryTitle = '';
var galleryDir = 1, gallerySkips = 0;

function pad(n){ return n < 10 ? '0' + n : '' + n; }

function galleryImgSrc(i){
  return galleryFolder + '/' + galleryKey + '-' + pad(i) + '.webp';
}

function renderGallery(){
  var imgEl = document.getElementById('lightbox-img');
  imgEl.onload = function(){ gallerySkips = 0; };
  imgEl.onerror = function(){ if (++gallerySkips < galleryCount) navGallery(galleryDir); };
  imgEl.classList.remove('loaded');
  imgEl.src = galleryImgSrc(galleryIndex);
  imgEl.alt = galleryTitle + ' ' + galleryIndex;
  document.getElementById('lightbox-title').textContent = galleryTitle;
  document.getElementById('lightbox-counter').textContent = galleryIndex + ' / ' + galleryCount;
}

var galleryOpener = null;
function openGallery(folder, key, title, count, start){
  galleryFolder = folder; galleryKey = key; galleryTitle = title; galleryCount = count; galleryIndex = start || 1;
  galleryDir = 1; gallerySkips = 0;
  galleryOpener = document.activeElement;
  renderGallery();
  document.getElementById('lightbox').classList.add('open');
  document.querySelector('.lightbox-close').focus();
}

function closeGallery(){
  document.getElementById('lightbox').classList.remove('open');
  if (galleryOpener && galleryOpener.focus) galleryOpener.focus();
}

function navGallery(dir){
  galleryDir = dir;
  galleryIndex += dir;
  if (galleryIndex < 1) galleryIndex = galleryCount;
  if (galleryIndex > galleryCount) galleryIndex = 1;
  renderGallery();
}

(function(){
  var lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.addEventListener('click', function(e){ if (e.target === this) closeGallery(); });
  document.addEventListener('keydown', function(e){
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeGallery();
    if (e.key === 'ArrowLeft') navGallery(-1);
    if (e.key === 'ArrowRight') navGallery(1);
  });

  // Vuốt trong lightbox
  var inner = lb.querySelector('.lightbox-inner');
  var sx = 0, sy = 0, active = false;
  inner.addEventListener('touchstart', function(e){
    if (e.touches.length !== 1) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; active = true;
  }, {passive:true});
  inner.addEventListener('touchend', function(e){
    if (!active) return;
    active = false;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    navGallery(dx < 0 ? 1 : -1);
  }, {passive:true});
})();

// ---- Thẻ mở gallery: data-g="thư mục|key|TIÊU ĐỀ|số ảnh|ảnh bắt đầu" ----
(function(){
  function open(el){
    var g = el.getAttribute('data-g').split('|');
    openGallery(g[0], g[1], g[2], +g[3], +g[4] || 1);
  }
  document.querySelectorAll('[data-g]').forEach(function(el){
    if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
    if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
  });
  document.addEventListener('click', function(e){
    var el = e.target.closest('[data-g]');
    if (el && !e.target.closest('a')) open(el);
  });
  document.addEventListener('keydown', function(e){
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var el = e.target.closest && e.target.closest('[data-g]');
    if (el && e.target === el){ e.preventDefault(); open(el); }
  });
})();

// ---- Hero: menu ----
(function(){
  var btn = document.getElementById('menu-btn'), pop = document.getElementById('site-menu');
  if (!btn || !pop) return;
  function set(open){ pop.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
  btn.addEventListener('click', function(e){ e.stopPropagation(); set(pop.hidden); });
  pop.addEventListener('click', function(e){ if (e.target.closest('a')) set(false); });
  document.addEventListener('click', function(e){ if (!pop.hidden && !pop.contains(e.target)) set(false); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !pop.hidden){ set(false); btn.focus(); } });
})();

// ---- Scroll reveal ----
(function(){
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window){
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      });
    }, {threshold:0.12});
    els.forEach(function(el){ obs.observe(el); });
  } else {
    els.forEach(function(el){ el.classList.add('in'); });
  }
})();

// ---- Image load fade-in ----
(function(){
  document.querySelectorAll('img:not([data-nofade])').forEach(function(img){
    img.classList.add('img-fade');
    if (img.complete && img.naturalWidth){
      img.classList.add('loaded');
    } else {
      img.addEventListener('load', function(){ img.classList.add('loaded'); });
      img.addEventListener('error', function(){ img.classList.add('loaded'); });
    }
  });
})();
