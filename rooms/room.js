// De Seconde Home — trang chi tiết phòng.
// Nguồn ảnh duy nhất là các <figure class="g-item"> trong #grid:
//   data-cat  = nhóm ảnh (xem CATS), data-hero = thứ tự xuất hiện ở dải ảnh đầu trang.
(function(){
  var CATS = {
    bed:'Phòng ngủ', relax:'Thư giãn', balcony:'Ban công', work:'Làm việc',
    util:'Tiện ích', bath:'Phòng tắm', detail:'Chi tiết'
  };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var roomName = document.body.getAttribute('data-room') || '';

  function pad(n){ return n < 10 ? '0' + n : '' + n; }
  function $(id){ return document.getElementById(id); }

  var items = [].slice.call(document.querySelectorAll('#grid .g-item'));
  var photos = items.map(function(el, i){
    var img = el.querySelector('img');
    return {
      i: i, el: el, src: img.getAttribute('src'), alt: img.alt,
      cap: (el.querySelector('figcaption') || {}).textContent || '',
      cat: el.getAttribute('data-cat') || '',
      hero: +el.getAttribute('data-hero') || 0
    };
  });

  /* ---------- Lightbox ---------- */
  var lb = $('lb'), track = $('lb-track'), thumbs = $('lb-thumbs');
  var lbCount = $('lb-count'), lbCap = $('lb-cap'), lbPrev = $('lb-prev'), lbNext = $('lb-next');
  var site = $('site');
  var list = [], cur = 0, isOpen = false, pushed = false, lastFocus = null;

  function loadSlide(k){
    var s = track.children[k];
    if (!s) return;
    var img = s.querySelector('img');
    if (img.getAttribute('src')) return;
    img.onload = img.onerror = function(){ img.classList.add('loaded'); };
    img.src = img.getAttribute('data-src');
  }

  function build(){
    track.innerHTML = ''; thumbs.innerHTML = '';
    list.forEach(function(pi, k){
      var p = photos[pi];
      var s = document.createElement('div');
      s.className = 'lb-slide';
      var img = document.createElement('img');
      img.alt = p.alt; img.decoding = 'async'; img.draggable = false;
      img.setAttribute('data-src', p.src);
      s.appendChild(img); track.appendChild(s);

      var t = document.createElement('button');
      t.type = 'button'; t.className = 'lb-thumb';
      t.setAttribute('aria-label', 'Ảnh ' + (k + 1) + ': ' + p.cap);
      var ti = document.createElement('img');
      ti.src = p.src; ti.alt = ''; ti.loading = 'lazy'; ti.decoding = 'async';
      t.appendChild(ti);
      t.addEventListener('click', function(){ goTo(k, true); });
      thumbs.appendChild(t);
    });
  }

  function update(k){
    cur = k;
    var p = photos[list[k]];
    lbCount.innerHTML = pad(k + 1) + '<small> / ' + pad(list.length) + '</small>';
    lbCap.textContent = p.cap;
    if (CATS[p.cat]){
      var tag = document.createElement('small');
      tag.textContent = CATS[p.cat];
      lbCap.appendChild(tag);
    }
    lbPrev.disabled = k === 0;
    lbNext.disabled = k === list.length - 1;
    [k, k + 1, k - 1, k + 2].forEach(loadSlide);
    [].forEach.call(thumbs.children, function(t, i){ t.setAttribute('aria-current', i === k ? 'true' : 'false'); });
    var at = thumbs.children[k];
    if (at){
      var left = at.offsetLeft - (thumbs.clientWidth - at.offsetWidth) / 2;
      thumbs.scrollTo({left: left, behavior: reduceMotion ? 'auto' : 'smooth'});
    }
  }

  function goTo(k, smooth){
    k = Math.max(0, Math.min(list.length - 1, k));
    track.scrollTo({left: k * track.clientWidth, behavior: smooth && !reduceMotion ? 'smooth' : 'auto'});
    if (!smooth) update(k);
  }

  var scrollRaf = 0;
  track.addEventListener('scroll', function(){
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(function(){
      scrollRaf = 0;
      var k = Math.round(track.scrollLeft / track.clientWidth);
      if (k !== cur && k >= 0 && k < list.length) update(k);
    });
  }, {passive: true});

  function openLB(indices, start){
    list = indices; build();
    lastFocus = document.activeElement;
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('lb-lock');
    if (site) site.inert = true;
    document.body.classList.add('lb-on');
    isOpen = true;
    cur = -1;
    requestAnimationFrame(function(){ goTo(start, false); });
    if (!pushed){ history.pushState({lb: 1}, ''); pushed = true; }
    $('lb-close').focus({preventScroll: true});
  }

  function doClose(){
    if (!isOpen) return;
    isOpen = false; pushed = false;
    lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('lb-lock');
    if (site) site.inert = false;
    document.body.classList.remove('lb-on');
    track.style.transform = ''; track.style.opacity = '';
    setTimeout(function(){ if (!isOpen){ track.innerHTML = ''; thumbs.innerHTML = ''; } }, 320);
    if (lastFocus && lastFocus.focus) lastFocus.focus({preventScroll: true});
  }
  // Nút Back (điện thoại) đóng viewer thay vì rời trang
  function closeLB(){ if (pushed) history.back(); else doClose(); }
  window.addEventListener('popstate', function(){ if (isOpen) doClose(); });

  $('lb-close').addEventListener('click', closeLB);
  lbPrev.addEventListener('click', function(){ goTo(cur - 1, true); });
  lbNext.addEventListener('click', function(){ goTo(cur + 1, true); });
  document.addEventListener('keydown', function(e){
    if (!isOpen) return;
    if (e.key === 'Escape') closeLB();
    else if (e.key === 'ArrowLeft'){ e.preventDefault(); goTo(cur - 1, true); }
    else if (e.key === 'ArrowRight'){ e.preventDefault(); goTo(cur + 1, true); }
    else if (e.key === 'Tab'){
      var f = [].slice.call(lb.querySelectorAll('button:not(:disabled)')).filter(function(b){ return b.offsetParent; });
      if (!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a){ e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z){ e.preventDefault(); a.focus(); }
    }
  });
  window.addEventListener('resize', function(){ if (isOpen) goTo(cur, false); });

  // Vuốt xuống để đóng
  (function(){
    var sx = 0, sy = 0, mode = '';
    track.addEventListener('touchstart', function(e){
      if (e.touches.length !== 1) { mode = 'x'; return; }
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; mode = '';
    }, {passive: true});
    track.addEventListener('touchmove', function(e){
      if (e.touches.length !== 1) return;
      var dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy;
      if (!mode && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) mode = Math.abs(dy) > Math.abs(dx) * 1.3 && dy > 0 ? 'y' : 'x';
      if (mode !== 'y') return;
      track.classList.add('dragging');
      track.style.transform = 'translateY(' + dy + 'px) scale(' + Math.max(.86, 1 - dy / 1600) + ')';
      track.style.opacity = Math.max(.35, 1 - dy / 500);
    }, {passive: true});
    track.addEventListener('touchend', function(e){
      if (mode !== 'y') return;
      var dy = e.changedTouches[0].clientY - sy;
      track.classList.remove('dragging');
      if (dy > 110) closeLB();
      else { track.style.transform = ''; track.style.opacity = ''; }
      mode = '';
    }, {passive: true});
  })();

  function allIndices(){ return photos.map(function(p){ return p.i; }); }

  /* ---------- Gallery grid + filters ---------- */
  var filtersBox = $('filters');
  var activeCat = 'all';

  function layoutGrid(animate){
    var vis = photos.filter(function(p){ return activeCat === 'all' || p.cat === activeCat; });
    photos.forEach(function(p){ p.el.hidden = vis.indexOf(p) < 0; p.el.classList.remove('wide', 'big', 'pop'); });
    vis.forEach(function(p, k){
      var img = p.el.querySelector('img');
      var landscape = img.naturalWidth ? img.naturalWidth > img.naturalHeight : p.el.hasAttribute('data-wide');
      if (landscape) p.el.classList.add('wide');
      else if (vis.length > 4 && k % 6 === 0) p.el.classList.add('big');
      if (animate && !reduceMotion){
        void p.el.offsetWidth;
        p.el.style.animationDelay = Math.min(k, 8) * 0.04 + 's';
        p.el.classList.add('pop');
      }
    });
  }

  if (filtersBox){
    var counts = {all: photos.length};
    photos.forEach(function(p){ counts[p.cat] = (counts[p.cat] || 0) + 1; });
    var keys = ['all'].concat(Object.keys(CATS).filter(function(c){ return counts[c]; }));
    keys.forEach(function(c){
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip';
      b.setAttribute('aria-pressed', c === 'all' ? 'true' : 'false');
      b.textContent = c === 'all' ? 'Tất cả' : CATS[c];
      var n = document.createElement('small'); n.textContent = counts[c]; b.appendChild(n);
      b.addEventListener('click', function(){
        if (activeCat === c) return;
        activeCat = c;
        [].forEach.call(filtersBox.children, function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        layoutGrid(true);
      });
      filtersBox.appendChild(b);
    });
  }
  layoutGrid(false);

  photos.forEach(function(p){
    p.el.querySelector('a').addEventListener('click', function(e){
      e.preventDefault();
      var vis = photos.filter(function(q){ return !q.el.hidden; }).map(function(q){ return q.i; });
      openLB(vis, vis.indexOf(p.i));
    });
    var img = p.el.querySelector('img');
    if (!img.complete) img.addEventListener('load', function(){
      var land = img.naturalWidth > img.naturalHeight;
      if (land !== p.el.classList.contains('wide')) layoutGrid(false);
    });
  });

  /* ---------- Highlights ---------- */
  [].forEach.call(document.querySelectorAll('[data-photo]'), function(b){
    b.addEventListener('click', function(){ openLB(allIndices(), +b.getAttribute('data-photo') - 1); });
  });

  /* ---------- Reel ---------- */
  var reel = $('reel');
  if (reel){
    var heroes = photos.filter(function(p){ return p.hero; }).sort(function(a, b){ return a.hero - b.hero; });
    heroes.forEach(function(p, k){
      var a = document.createElement('a');
      a.className = 'slide'; a.href = p.src;
      a.setAttribute('aria-label', 'Phóng to ảnh: ' + p.cap);
      var img = document.createElement('img');
      img.src = p.src; img.alt = p.alt; img.decoding = 'async';
      if (k > 1) img.loading = 'lazy'; else img.fetchPriority = 'high';
      a.appendChild(img);
      a.insertAdjacentHTML('beforeend', '<span class="slide-no">' + pad(k + 1) + '</span><span class="slide-zoom" aria-hidden="true"><span class="msi">open_in_full</span></span>');
      var cap = document.createElement('span'); cap.className = 'gchip'; cap.textContent = p.cap; a.appendChild(cap);
      a.addEventListener('click', function(e){ e.preventDefault(); openLB(allIndices(), p.i); });
      reel.appendChild(a);
    });

    var all = document.createElement('a');
    all.className = 'slide slide-all'; all.href = '#thu-vien';
    var rest = photos.filter(function(p){ return !p.hero; }).slice(0, 4);
    var mini = '<span class="mini-grid" aria-hidden="true">' + rest.map(function(p){
      return '<img src="' + p.src + '" alt="" loading="lazy" decoding="async">';
    }).join('') + '</span>';
    all.innerHTML = mini + '<span class="row"><span><b>Xem tất cả<br>' + photos.length + ' ảnh</b><small>Lọc theo góc phòng</small></span>' +
      '<span class="round-btn"><span class="msi">arrow_forward</span></span></span>';
    reel.appendChild(all);

    var slides = reel.children, total = heroes.length;
    var rCount = $('reel-count'), rThumb = $('reel-thumb'), rPrev = $('reel-prev'), rNext = $('reel-next');
    function step(){ return slides[0].offsetWidth + parseFloat(getComputedStyle(reel).columnGap || 12); }
    function sync(){
      var max = reel.scrollWidth - reel.clientWidth;
      var ratio = max > 0 ? reel.scrollLeft / max : 0;
      var w = Math.max(0.12, reel.clientWidth / reel.scrollWidth);
      rThumb.style.width = (w * 100) + '%';
      rThumb.style.transform = 'translateX(' + (ratio * (1 / w - 1) * 100) + '%)';
      var k = Math.min(total - 1, Math.round(reel.scrollLeft / step()));
      rCount.innerHTML = pad(k + 1) + '<small>/' + pad(total) + '</small>';
      rPrev.disabled = reel.scrollLeft < 4;
      rNext.disabled = reel.scrollLeft > max - 4;
    }
    var rr = 0;
    reel.addEventListener('scroll', function(){
      if (rr) return;
      rr = requestAnimationFrame(function(){ rr = 0; sync(); });
    }, {passive: true});
    window.addEventListener('resize', sync);
    rPrev.addEventListener('click', function(){ reel.scrollBy({left: -step(), behavior: reduceMotion ? 'auto' : 'smooth'}); });
    rNext.addEventListener('click', function(){ reel.scrollBy({left: step(), behavior: reduceMotion ? 'auto' : 'smooth'}); });
    sync();

    // Kéo bằng chuột trên desktop
    var down = false, startX = 0, startL = 0, dragged = false;
    reel.addEventListener('mousedown', function(e){
      if (e.button !== 0) return;
      down = true; dragged = false; startX = e.pageX; startL = reel.scrollLeft;
      reel.style.scrollSnapType = 'none'; e.preventDefault();
    });
    window.addEventListener('mousemove', function(e){
      if (!down) return;
      var dx = e.pageX - startX;
      if (Math.abs(dx) > 5) dragged = true;
      reel.scrollLeft = startL - dx;
    });
    window.addEventListener('mouseup', function(){
      if (!down) return;
      down = false;
      var l = reel.scrollLeft;
      reel.style.scrollSnapType = '';
      reel.scrollLeft = l;
      var k = Math.round(l / step());
      reel.scrollTo({left: k * step(), behavior: reduceMotion ? 'auto' : 'smooth'});
    });
    reel.addEventListener('click', function(e){ if (dragged){ e.preventDefault(); e.stopImmediatePropagation(); dragged = false; } }, true);
  }

  /* ---------- Sticky booking bar ---------- */
  var bar = $('book-bar'), cta = $('head-cta'), bookSec = $('dat-phong');
  if (bar && cta && 'IntersectionObserver' in window){
    var ctaGone = false, bookIn = false;
    function setBar(){ bar.classList.toggle('show', ctaGone && !bookIn); }
    new IntersectionObserver(function(en){
      ctaGone = !en[0].isIntersecting && en[0].boundingClientRect.top < 0; setBar();
    }).observe(cta);
    if (bookSec) new IntersectionObserver(function(en){ bookIn = en[0].isIntersecting; setBar(); }, {threshold: 0.25}).observe(bookSec);
    document.body.classList.add('has-bar');
  }

  /* ---------- Scroll reveal ---------- */
  var rev = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion){
    var obs = new IntersectionObserver(function(en){
      en.forEach(function(x){ if (x.isIntersecting){ x.target.classList.add('in'); obs.unobserve(x.target); } });
    }, {threshold: 0.08});
    [].forEach.call(rev, function(el){ obs.observe(el); });
  } else {
    [].forEach.call(rev, function(el){ el.classList.add('in'); });
  }

  if (roomName) $('lb-name').textContent = roomName;
})();
