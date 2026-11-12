// ===== Cursor comet trail =====
(function () {
  var c = document.getElementById('trail');
  if (!c) {
    console.warn('Trail: <canvas id="trail"> not found in index.html');
    return;
  }

  var x = c.getContext('2d'), ps = [], W, H, last = null;

  function size() {
    var d = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth;
    H = innerHeight;
    c.width = W * d;
    c.height = H * d;
    x.setTransform(d, 0, 0, d, 0, 0);
  }
  size();
  addEventListener('resize', size);

  function add(px, py) {
    ps.push({
      x: px,
      y: py,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: 2.5 + Math.random() * 2.5,
      life: 1,
      decay: 0.065 + Math.random() * 0.03
    });
    if (ps.length > 120) ps.shift();
  }

  addEventListener('pointermove', function (e) {
    if (last) {
      var dx = e.clientX - last.x, dy = e.clientY - last.y;
      var steps = Math.min(24, Math.ceil(Math.hypot(dx, dy) / 3.5));
      for (var i = 1; i <= steps; i++) {
        add(last.x + dx * i / steps, last.y + dy * i / steps);
      }
    } else {
      add(e.clientX, e.clientY);
    }
    last = { x: e.clientX, y: e.clientY };
  }, { passive: true });

  document.addEventListener('mouseleave', function () {
    last = null;
  });

  (function loop() {
    x.clearRect(0, 0, W, H);
    if (ps.length > 0) {
      x.globalCompositeOperation = 'lighter';
      for (var i = ps.length - 1; i >= 0; i--) {
        var p = ps[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) {
          ps.splice(i, 1);
          continue;
        }
        // Larger outer glow
        x.beginPath();
        x.arc(p.x, p.y, p.r * 2.8 * p.life, 0, 6.283);
        x.fillStyle = 'rgba(25, 227, 208, ' + (p.life * 0.25) + ')';
        x.fill();

        // Bright inner core
        x.beginPath();
        x.arc(p.x, p.y, p.r * p.life, 0, 6.283);
        x.fillStyle = 'rgba(25, 227, 208, ' + (p.life * 0.9) + ')';
        x.fill();
      }
    }
    requestAnimationFrame(loop);
  })();
})();


// ===== Nav highlight on scroll =====
(function () {
  var links = [].slice.call(document.querySelectorAll('#pills a'));
  var secs = links.map(function (a) {
    return document.querySelector(a.getAttribute('href'));
  });
  function upd() {
    var y = scrollY + 140, cur = 0;
    secs.forEach(function (s, i) {
      if (s && s.offsetTop <= y) cur = i;
    });
    links.forEach(function (a, i) {
      a.classList.toggle('on', i === cur);
    });
  }
  addEventListener('scroll', upd, { passive: true });
  upd();
})();


// ===== Combined Certificates & Activities =====
(function () {
  var items = [
    { type: 'Certificate', title: 'GEN-AI Virtual Internship', issuer: 'AWS Academy', year: '2025' },
    { type: 'Certificate', title: 'Data Analytics Job Simulation', issuer: 'Deloitte', year: '2026' },
    { type: 'Certificate', title: 'Business Analytics with Excel', issuer: 'Microsoft', year: '2026' },
    { type: 'Activity', title: 'Smart India Hackathon', issuer: 'Participant', year: '' },
    { type: 'Activity', title: 'College Hackathons', issuer: 'Techno Main Salt Lake', year: '' },
    { type: 'Activity', title: 'Technical Events', issuer: 'Participant', year: '' }
  ];

  var certIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M8.5 13.5 7 22l5-3 5 3-1.5-8.5"/></svg>';
  var actIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>';

  function esc(t) {
    var d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }

  var el = document.getElementById('credentials-grid');
  if (!el) return;

  el.innerHTML = items.map(function (c) {
    var ico = c.type === 'Certificate' ? certIcon : actIcon;
    return '<article class="card cert">' +
      '<div class="cert-ico">' + ico + '</div>' +
      '<div>' +
      '<span class="cert-type">' + esc(c.type) + '</span>' +
      '<h3>' + esc(c.title) + '</h3>' +
      '<p>' + esc(c.issuer) + '</p>' +
      (c.year ? '<small>' + esc(c.year) + '</small>' : '') +
      '</div></article>';
  }).join('');
})();


// ===== Contact form =====
(function () {
  var form = document.getElementById('form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var note = document.getElementById('note');
    note.textContent = 'Sending...';
    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('f-name').value,
        email: document.getElementById('f-email').value,
        subject: document.getElementById('f-subject').value,
        message: document.getElementById('f-msg').value
      })
    }).then(function (r) {
      return r.json().then(function (d) {
        return { ok: r.ok, d: d };
      });
    })
      .then(function (res) {
        note.textContent = res.ok ? 'Message sent. Thank you!' : (res.d.error || 'Something went wrong.');
        if (res.ok) e.target.reset();
      })
      .catch(function () {
        note.textContent = 'Could not reach the server. Is it running?';
      });
  });
})();


// ===== Load projects from the backend =====
(function () {
  var grid = document.getElementById('projgrid');
  if (!grid) return;
  function esc(t) {
    var d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }
  fetch('/api/projects').then(function (r) {
    return r.json();
  }).then(function (list) {
    grid.innerHTML = list.map(function (p) {
      var pts = (p.points || []).map(function (x) {
        return '<li>' + esc(x) + '</li>';
      }).join('');
      return '<article class="card pc">' +
        '<div class="shot">' + (p.image ? '<img src="' + esc(p.image) + '" alt="' + esc(p.title) + ' screenshot">' : 'screenshot') + '</div>' +
        '<div class="in"><h3>' + esc(p.title) + '</h3>' +
        '<div class="tags">' + p.tags.map(function (t) {
          return '<span>' + esc(t) + '</span>';
        }).join('') + '</div>' +
        '<div class="more"><div><p>' + esc(p.description) + '</p>' +
        (pts ? '<ul>' + pts + '</ul>' : '') +
        '<div class="links">' +
        (p.demo ? '<a class="demo" href="' + esc(p.demo) + '" target="_blank" rel="noopener">Live demo ↗</a>' : '') +
        (p.link ? '<a href="' + esc(p.link) + '" target="_blank" rel="noopener">GitHub →</a>' : '') +
        '</div></div></div></div></article>';
    }).join('');
  }).catch(function () {
    grid.innerHTML = '<p class="lede">Could not load projects. Start the server with npm start.</p>';
  });
})();