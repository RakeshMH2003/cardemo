'use strict';

/* ============================================================
   DRIVEEASE — app.js  (Production Ready — All Bugs Fixed)
   Fixes:
   - Vendor can now add unlimited vehicles (image/state reset fixed)
   - upImgs, imgCounter, insDoc properly reset after each vehicle submission
   - licFront/licBack properly scoped and reset
   - All JS errors resolved
   - Booking details fully shown after booking
   - Hover popup only on booking cards
   ============================================================ */

/* ── LOCALSTORAGE STORE ── */
var Store = {
  get: function(k) {
    try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; }
    catch(e) { return null; }
  },
  set: function(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {}
  },
  del: function(k) { localStorage.removeItem(k); }
};

/* ── SEED DATA ── */
var SEED_V = [
  { id:'v1', name:'Toyota Camry',     type:'sedan',    price:2200, seats:5, status:'approved', vendorId:'vendor1', vendorName:'SpeedRent Co.',    desc:'Comfortable full-size sedan, perfect for business trips and long drives. Features automatic transmission, advanced safety systems, and a spacious boot.', images:['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&h=400&fit=crop'], trending:true,  rating:4.8, bookings:142, insurance:true },
  { id:'v2', name:'Honda CR-V',       type:'suv',      price:3000, seats:7, status:'approved', vendorId:'vendor2', vendorName:'TopDrive Rentals',  desc:'Versatile 7-seater SUV great for family road trips. Equipped with all-wheel drive, panoramic sunroof, and advanced driver assistance features.', images:['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&h=400&fit=crop'], trending:true,  rating:4.9, bookings:198, insurance:true },
  { id:'v3', name:'Hyundai i20',      type:'hatchback',price:1200, seats:5, status:'approved', vendorId:'vendor1', vendorName:'SpeedRent Co.',    desc:'Fuel-efficient city hatchback, easy to drive and park. Ideal for urban commutes and weekend getaways with excellent fuel economy.', images:['https://images.unsplash.com/photo-1552519507-0f70e2690ed0?w=600&h=400&fit=crop'], trending:false, rating:4.5, bookings:87,  insurance:true },
  { id:'v4', name:'BMW 5 Series',     type:'luxury',   price:6500, seats:5, status:'approved', vendorId:'vendor3', vendorName:'Luxury Wheels',    desc:'Premium luxury sedan with top-class interiors and performance. Features leather upholstery, advanced infotainment, and a powerful turbocharged engine.', images:['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&h=400&fit=crop'], trending:true,  rating:5.0, bookings:234, insurance:true },
  { id:'v5', name:'Tata Nexon',       type:'suv',      price:1800, seats:5, status:'approved', vendorId:'vendor2', vendorName:'TopDrive Rentals',  desc:'Compact SUV with stellar safety ratings and a feature-packed cabin. India\'s safest SUV with 5-star NCAP rating.', images:['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&h=400&fit=crop'], trending:false, rating:4.6, bookings:65,  insurance:true },
  { id:'v6', name:'Mercedes E-Class', type:'luxury',   price:8000, seats:5, status:'pending',  vendorId:'vendor3', vendorName:'Luxury Wheels',    desc:'Business class luxury with advanced tech features including MBUX infotainment, Burmester sound system, and adaptive air suspension.', images:['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&h=400&fit=crop'], trending:false, rating:4.9, bookings:0,   insurance:true }
];
var SEED_VND = [
  { id:'vendor1', name:'SpeedRent Co.',    email:'speed@rent.com',    password:'123456', status:'approved', joinedAt:'2024-01-10T10:00:00' },
  { id:'vendor2', name:'TopDrive Rentals', email:'top@drive.com',     password:'123456', status:'approved', joinedAt:'2024-02-15T10:00:00' },
  { id:'vendor3', name:'Luxury Wheels',    email:'luxury@wheels.com', password:'123456', status:'pending',  joinedAt:'2024-03-20T10:00:00' }
];
var SEED_U = [
  { id:'user1', name:'Arjun Kumar', email:'arjun@example.com', password:'123456', phone:'+91 98765 43210', city:'Chennai', licenseUploaded:false, joinedAt:'2024-01-05T10:00:00' },
  { id:'user2', name:'Sneha Mehta', email:'sneha@example.com', password:'123456', phone:'+91 91234 56789', city:'Mumbai',  licenseUploaded:false, joinedAt:'2024-02-01T10:00:00' }
];
var SEED_B = [
  { id:'b1', userId:'user1', userName:'Arjun Kumar', userEmail:'arjun@example.com', userPhone:'+91 98765 43210', userCity:'Chennai', vehicleId:'v1', vehicleName:'Toyota Camry',  vehicleType:'sedan', vehiclePrice:2200, vendorId:'vendor1', startDate:'2025-04-01', endDate:'2025-04-03', days:2, total:4400,  status:'confirmed', bookedAt:'2025-03-28T09:00:00', pickupLocation:'MG Road, Bengaluru', returnLocation:'Same as pickup' },
  { id:'b2', userId:'user2', userName:'Sneha Mehta', userEmail:'sneha@example.com', userPhone:'+91 91234 56789', userCity:'Mumbai',  vehicleId:'v4', vehicleName:'BMW 5 Series', vehicleType:'luxury', vehiclePrice:6500, vendorId:'vendor3', startDate:'2025-04-05', endDate:'2025-04-07', days:2, total:13000, status:'confirmed', bookedAt:'2025-03-27T14:30:00', pickupLocation:'Airport, Bengaluru', returnLocation:'Hotel Taj, MG Road' }
];

function initStore() {
  if (!Store.get('vehicles')) Store.set('vehicles', SEED_V);
  if (!Store.get('vendors'))  Store.set('vendors',  SEED_VND);
  if (!Store.get('users'))    Store.set('users',    SEED_U);
  if (!Store.get('bookings')) Store.set('bookings', SEED_B);
  if (!Store.get('messages')) Store.set('messages', []);
}

/* ── APP STATE ── */
var CU = null;   // current user object
var CR = null;   // current role: 'user' | 'vendor' | 'admin'
var BT = null;   // booking target vehicle
var licFront = null, licBack = null, insDoc = null, upImgs = [];
var typeFilter = '', imgCounter = 0, adminVehicleFilter = 'all';

/* ── HELPERS ── */
function filterKey(arr, k, v) {
  return (arr || []).filter(function(i) { return i[k] === v; });
}
function sortByFn(arr, fn) {
  return [].concat(arr || []).sort(fn);
}
function searchArr(arr, keys, q) {
  return (arr || []).filter(function(i) {
    return keys.some(function(k) {
      return (i[k] || '').toLowerCase().indexOf(q.toLowerCase()) !== -1;
    });
  });
}

/* ── MODAL HELPERS ── */
function modalShow(id) {
  var el = document.getElementById(id);
  if (!el) return;
  var inst = bootstrap.Modal.getInstance(el);
  if (!inst) inst = new bootstrap.Modal(el);
  inst.show();
}
function modalHide(id) {
  var el = document.getElementById(id);
  if (!el) return;
  var inst = bootstrap.Modal.getInstance(el);
  if (inst) inst.hide();
}

/* ── DOCUMENT READY ── */
$(function() {
  initStore();
  restoreSession();
  initParticles();

  $(window).on('scroll', function() {
    $('#navbar').toggleClass('scrolled', $(this).scrollTop() > 40);
  });

  setTimeout(function() {
    $('#loader').addClass('hidden');
    animateCounters();
    renderTrending();
  }, 1600);

  $(document).on('input change', '#bkStart, #bkEnd, #bkPickup, #bkReturn', updateBkSum);

  ['signupModal','signinModal','vendorSignupModal','vendorSigninModal'].forEach(function(id) {
    $('#' + id).on('hidden.bs.modal', function() {
      $(this).find('.de-alert').addClass('d-none').text('');
    });
  });

  $(document).on('click', function(e) {
    if (!$(e.target).closest('#navbar, #mobileNav').length) closeMobileNav();
  });

  /* File input triggers */
  $('#licFrontBox').on('click', function() { document.getElementById('licFront').click(); });
  $('#licBackBox').on('click',  function() { document.getElementById('licBack').click(); });
  $('#insBox').on('click',      function() { document.getElementById('carIns').click(); });
  $('#imgUpBox').on('click',    function() { document.getElementById('vImgs').click(); });

  /* File change handlers */
  $('#licFront').on('change', function() { handleLicUpload(this, 'front'); });
  $('#licBack').on('change',  function() { handleLicUpload(this, 'back'); });
  $('#carIns').on('change',   function() { handleInsuranceUpload(this); });
  $('#vImgs').on('change',    function() { handleVehicleImages(this); });

  /* Set hero date min */
  var today = new Date().toISOString().split('T')[0];
  $('#heroPickup, #heroReturn').attr('min', today);
});

/* ── HERO PARTICLES ── */
function initParticles() {
  var container = document.getElementById('heroParticles');
  if (!container) return;
  for (var i = 0; i < 20; i++) {
    (function() {
      var p = document.createElement('div');
      p.className = 'particle';
      var left  = Math.random() * 100;
      var size  = Math.random() * 3 + 1;
      var dur   = Math.random() * 8 + 5;
      var delay = Math.random() * 6;
      p.style.cssText = 'left:' + left + '%;bottom:0;width:' + size + 'px;height:' + size + 'px;animation-duration:' + dur + 's;animation-delay:' + delay + 's;opacity:0';
      container.appendChild(p);
    })();
  }
}

/* ── COUNTER ANIMATION ── */
function animateCounters() {
  [{id:'cnt1',target:500,suffix:'+'},{id:'cnt2',target:12000,suffix:'+'},{id:'cnt3',target:98,suffix:'%'}].forEach(function(c) {
    var node = document.getElementById(c.id);
    if (!node) return;
    var cur = 0, step = c.target / 60;
    var iv = setInterval(function() {
      cur = Math.min(cur + step, c.target);
      node.textContent = Math.floor(cur) + (cur >= c.target ? c.suffix : '');
      if (cur >= c.target) clearInterval(iv);
    }, 20);
  });
}

/* ── PAGE NAVIGATION ── */
function showPage(id) {
  $('.page').removeClass('active');
  $('#page-' + id).addClass('active');
  $('html,body').animate({ scrollTop: 0 }, 300);
  closeMobileNav();
  if (id === 'vehicles')         renderPublicVehicles();
  if (id === 'user-dashboard')   loadUserDash();
  if (id === 'admin-dashboard')  loadAdminDash();
  if (id === 'vendor-dashboard') loadVendorDash();
  if (id === 'home')             renderTrending();
}

function goCat(type) {
  typeFilter = type;
  showPage('vehicles');
}

function toggleNav()      { $('#mobileNav').toggleClass('open'); }
function closeMobileNav() { $('#mobileNav').removeClass('open'); }

/* ── MODAL OPENERS ── */
function openSignUp()       { modalShow('signupModal'); }
function openSignIn()       { modalShow('signinModal'); }
function openVendorSignIn() { modalShow('vendorSigninModal'); }
function switchModal(hideId, showId) {
  modalHide(hideId);
  document.getElementById(hideId).addEventListener('hidden.bs.modal', function handler() {
    this.removeEventListener('hidden.bs.modal', handler);
    modalShow(showId);
  });
}

/* ── TOAST ── */
function showToast(msg, type) {
  type = type || 'inf';
  var toastEl = document.getElementById('liveToast');
  $(toastEl).removeClass('ok err inf').addClass(type);
  var icons = { ok:'fa-check-circle', err:'fa-times-circle', inf:'fa-info-circle' };
  $('#toastBody').html('<i class="fas ' + (icons[type] || icons.inf) + '"></i> ' + msg);
  new bootstrap.Toast(toastEl, { delay: 3800 }).show();
}

/* ── AUTH: SIGN UP ── */
function signUp() {
  var name  = $.trim($('#suName').val());
  var email = $.trim($('#suEmail').val()).toLowerCase();
  var pass  = $('#suPass').val();
  if (!name || !email || !pass)         { showModalError('suError', 'Please fill all fields.'); return; }
  if (!/\S+@\S+\.\S+/.test(email))     { showModalError('suError', 'Enter a valid email address.'); return; }
  if (pass.length < 6)                  { showModalError('suError', 'Password must be at least 6 characters.'); return; }
  var users = Store.get('users') || [];
  if (users.find(function(u) { return u.email === email; })) {
    showModalError('suError', 'Email already registered.'); return;
  }
  var u = { id:'u_' + Date.now(), name:name, email:email, password:pass, phone:'', city:'', licenseUploaded:false, joinedAt:new Date().toISOString() };
  users.push(u);
  Store.set('users', users);
  CU = u; CR = 'user';
  modalHide('signupModal');
  saveSession(); updateNav();
  showToast('Welcome, ' + name + '! Account created 🎉', 'ok');
  showPage('user-dashboard');
}

/* ── AUTH: SIGN IN ── */
function signIn() {
  var email = $.trim($('#siEmail').val()).toLowerCase();
  var pass  = $('#siPass').val();
  if (!email || !pass) { showModalError('siError', 'Please fill all fields.'); return; }
  var users = Store.get('users') || [];
  var u = users.find(function(u) { return u.email === email && u.password === pass; });
  if (!u) { showModalError('siError', 'Invalid email or password.'); return; }
  CU = u; CR = 'user';
  modalHide('signinModal');
  saveSession(); updateNav();
  showToast('Welcome back, ' + u.name + '!', 'ok');
  showPage('user-dashboard');
}

/* ── AUTH: ADMIN ── */
function adminLogin() {
  ['signupModal','signinModal'].forEach(function(id) { modalHide(id); });
  CU = { id:'admin', name:'Admin', email:'admin@driveease.com', isAdmin:true };
  CR = 'admin';
  saveSession(); updateNav();
  showToast('Admin access granted ✓', 'ok');
  showPage('admin-dashboard');
}

/* ── AUTH: SIGN OUT ── */
function signOut() {
  CU = null; CR = null;
  licFront = null; licBack = null; insDoc = null; upImgs = []; imgCounter = 0;
  Store.del('session');
  showToast('Signed out successfully', 'inf');
  updateNav(); showPage('home');
}

/* ── VENDOR AUTH ── */
function vendorSignUp() {
  var name  = $.trim($('#vuName').val());
  var email = $.trim($('#vuEmail').val()).toLowerCase();
  var pass  = $('#vuPass').val();
  if (!name || !email || !pass)       { showModalError('vuError', 'Please fill all fields.'); return; }
  if (!/\S+@\S+\.\S+/.test(email))   { showModalError('vuError', 'Enter a valid email.'); return; }
  if (pass.length < 6)                { showModalError('vuError', 'Password must be at least 6 characters.'); return; }
  var vendors = Store.get('vendors') || [];
  if (vendors.find(function(v) { return v.email === email; })) {
    showModalError('vuError', 'Email already registered.'); return;
  }
  var v = { id:'vnd_' + Date.now(), name:name, email:email, password:pass, status:'pending', joinedAt:new Date().toISOString() };
  vendors.push(v);
  Store.set('vendors', vendors);
  CU = v; CR = 'vendor';
  modalHide('vendorSignupModal');
  saveSession(); updateNav();
  showToast('Vendor account created! Pending admin approval.', 'ok');
  showPage('vendor-dashboard');
}

function vendorSignIn() {
  var email = $.trim($('#vsEmail').val()).toLowerCase();
  var pass  = $('#vsPass').val();
  if (!email || !pass) { showModalError('vsError', 'Please enter email and password.'); return; }
  var vendors = Store.get('vendors') || [];
  var v = vendors.find(function(v) { return v.email === email && v.password === pass; });
  if (!v) { showModalError('vsError', 'Invalid email or password.'); return; }
  CU = v; CR = 'vendor';
  modalHide('vendorSigninModal');
  saveSession(); updateNav();
  showToast('Welcome back, ' + v.name + '!', 'ok');
  if (v.status === 'pending') setTimeout(function() { showToast('Account pending admin approval', 'inf'); }, 600);
  showPage('vendor-dashboard');
}

function showModalError(alertId, msg) {
  $('#' + alertId).removeClass('d-none').text(msg);
}

/* ── SESSION ── */
function restoreSession() {
  var sess = Store.get('session');
  if (!sess) return;
  CU = sess.user; CR = sess.role;
  updateNav();
}
function saveSession() {
  if (CU && CR) Store.set('session', { user:CU, role:CR });
  else Store.del('session');
}

/* ── NAVBAR UPDATE ── */
function updateNav() {
  if (CU && CR) {
    var init = (CU.name || 'U').charAt(0).toUpperCase();
    var lbl  = CR === 'admin' ? 'Admin' : CR === 'vendor' ? 'Vendor' : 'My Account';
    var dash = CR === 'admin' ? 'admin-dashboard' : CR === 'vendor' ? 'vendor-dashboard' : 'user-dashboard';
    $('#navActions').html(
      '<div class="nav-pill" onclick="showPage(\'' + dash + '\')">' +
        '<div class="nav-ava">' + init + '</div><span>' + lbl + '</span>' +
      '</div>' +
      '<button class="btn-signout" onclick="signOut()"><i class="fas fa-sign-out-alt"></i> Out</button>'
    );
  } else {
    $('#navActions').html(
      '<button class="btn btn-de-outline" onclick="openSignIn()">Sign In</button>' +
      '<button class="btn btn-de-primary" onclick="openSignUp()">Get Started</button>' +
      '<button class="btn btn-vendor-pill" onclick="openVendorSignIn()"><i class="fas fa-store"></i> Vendor</button>'
    );
  }
}

/* ── TRENDING ── */
function renderTrending() {
  var vs = (Store.get('vehicles') || [])
    .filter(function(v) { return v.status === 'approved' && v.trending; })
    .sort(function(a, b) { return (b.bookings || 0) - (a.bookings || 0); })
    .slice(0, 3);
  $('#trendingVehicles').html(
    vs.length ? vs.map(function(v) { return vehicleCardHtml(v, true); }).join('') : emptyHtml('fa-car-side', 'No trending vehicles.')
  );
}

/* ── VEHICLE CARD HTML ── */
function vehicleCardHtml(v, isTrending) {
  var img = (v.images && v.images.length) ? v.images[0] : 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&h=400&fit=crop';
  var isUser = CU && CR === 'user';
  return '<div class="vcard" onclick="openDetail(\'' + v.id + '\')">' +
    '<div class="vcard-img">' +
      '<img src="' + img + '" alt="' + v.name + '" loading="lazy" onerror="this.src=\'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&h=400&fit=crop\'"/>' +
      '<div class="vcard-img-overlay"></div>' +
      '<span class="badge-type">' + v.type + '</span>' +
      ((isTrending || v.trending) ? '<span class="badge-hot"><i class="fas fa-fire"></i> HOT</span>' : '') +
      (v.insurance ? '<span class="badge-ins"><i class="fas fa-shield-alt"></i> Insured</span>' : '') +
    '</div>' +
    '<div class="vcard-body">' +
      '<div class="vcard-name">' + v.name + '</div>' +
      '<div class="vcard-meta">' +
        '<span><i class="fas fa-users"></i> ' + v.seats + ' Seats</span>' +
        (v.rating ? '<span><i class="fas fa-star" style="color:var(--accent2)"></i> ' + v.rating + '</span>' : '') +
        '<span><i class="fas fa-store"></i> ' + v.vendorName + '</span>' +
      '</div>' +
      '<div class="vcard-foot">' +
        '<div class="vprice">₹' + v.price.toLocaleString() + ' <span>/ day</span></div>' +
        (isUser
          ? '<button class="btn-de-warn" onclick="event.stopPropagation();openBooking(\'' + v.id + '\')"><i class="fas fa-calendar-plus"></i> Book</button>'
          : '<button class="btn-de-outline" style="font-size:.75rem;padding:7px 13px" onclick="event.stopPropagation();openSignIn()"><i class="fas fa-sign-in-alt"></i> Sign In</button>') +
      '</div>' +
    '</div>' +
  '</div>';
}

/* ── PUBLIC VEHICLES ── */
function renderPublicVehicles() {
  var vs = filterKey(Store.get('vehicles'), 'status', 'approved');
  if (typeFilter) vs = filterKey(vs, 'type', typeFilter);
  $('.ftag').removeClass('active');
  $('.ftag').each(function() {
    var txt = $(this).text().trim().toLowerCase();
    if (typeFilter === '' && txt.indexOf('all') !== -1) $(this).addClass('active');
    else if (typeFilter && txt.indexOf(typeFilter) !== -1) $(this).addClass('active');
  });
  $('#vehiclesGrid').html(
    vs.length ? vs.map(function(v) { return vehicleCardHtml(v); }).join('') : emptyHtml('fa-car-side', 'No vehicles available.')
  );
}

function filterTag(el, type) {
  $('.ftag').removeClass('active');
  $(el).addClass('active');
  typeFilter = type;
  filterVehicles();
}

function filterVehicles() {
  var q = $('#vSearch').val() || '';
  var s = $('#vSort').val() || '';
  var vs = filterKey(Store.get('vehicles'), 'status', 'approved');
  if (typeFilter) vs = filterKey(vs, 'type', typeFilter);
  if (q) vs = searchArr(vs, ['name','type','vendorName'], q);
  if      (s === 'pa') vs = sortByFn(vs, function(a,b) { return a.price - b.price; });
  else if (s === 'pd') vs = sortByFn(vs, function(a,b) { return b.price - a.price; });
  else if (s === 'r')  vs = sortByFn(vs, function(a,b) { return (b.rating||0) - (a.rating||0); });
  else                 vs = sortByFn(vs, function(a,b) { return a.name.localeCompare(b.name); });
  $('#vehiclesGrid').html(
    vs.length ? vs.map(function(v) { return vehicleCardHtml(v); }).join('') : emptyHtml('fa-search', 'No vehicles found.')
  );
}

/* ── VEHICLE DETAIL MODAL ── */
function openDetail(id) {
  var v = (Store.get('vehicles') || []).find(function(x) { return x.id === id; });
  if (!v) return;
  var imgs = (v.images && v.images.length) ? v.images : ['https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&h=400&fit=crop'];
  var isUser = CU && CR === 'user';
  var galHtml = imgs.length > 1
    ? '<div class="gal">' + imgs.slice(1, 5).map(function(i) {
        return '<img src="' + i + '" class="gthumb" onclick="document.getElementById(\'detMain\').src=this.src" loading="lazy"/>';
      }).join('') + '</div>'
    : '';
  var bookBtn = isUser
    ? '<button class="btn btn-de-primary w-100" onclick="modalHide(\'vDetailModal\');setTimeout(function(){openBooking(\'' + v.id + '\')},300)"><i class="fas fa-calendar-check"></i> Book This Vehicle</button>'
    : '<button class="btn btn-de-primary w-100" onclick="modalHide(\'vDetailModal\');setTimeout(openSignIn,300)"><i class="fas fa-sign-in-alt"></i> Sign In to Book</button>';
  $('#vDetailContent').html(
    '<div style="padding-right:30px">' +
      '<div class="d-flex align-items-center gap-2 mb-3 flex-wrap">' +
        '<h2 style="font-family:\'Bebas Neue\',sans-serif;font-size:2rem;letter-spacing:3px">' + v.name + '</h2>' +
        '<span class="sbadge s-approved" style="text-transform:capitalize">' + v.type + '</span>' +
        (v.insurance ? '<span class="sbadge s-approved"><i class="fas fa-shield-alt"></i> Insured</span>' : '') +
      '</div>' +
      '<img id="detMain" src="' + imgs[0] + '" style="width:100%;height:360px;object-fit:cover;border-radius:16px;margin-bottom:12px" onerror="this.src=\'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&h=400&fit=crop\'"/>' +
      galHtml +
      '<div class="row g-3 my-3">' +
        '<div class="col-4"><div style="background:var(--bg3);padding:16px;border-radius:12px;text-align:center;border:1px solid var(--border)"><div style="color:var(--text3);font-size:.68rem;margin-bottom:4px;text-transform:uppercase;letter-spacing:.07em">PRICE/DAY</div><div style="color:var(--accent);font-size:1.5rem;font-weight:700;font-family:\'Space Mono\',monospace">₹' + v.price.toLocaleString() + '</div></div></div>' +
        '<div class="col-4"><div style="background:var(--bg3);padding:16px;border-radius:12px;text-align:center;border:1px solid var(--border)"><div style="color:var(--text3);font-size:.68rem;margin-bottom:4px;text-transform:uppercase;letter-spacing:.07em">SEATS</div><div style="font-size:1.5rem;font-weight:700">' + v.seats + '</div></div></div>' +
        '<div class="col-4"><div style="background:var(--bg3);padding:16px;border-radius:12px;text-align:center;border:1px solid var(--border)"><div style="color:var(--text3);font-size:.68rem;margin-bottom:4px;text-transform:uppercase;letter-spacing:.07em">RATING</div><div style="font-size:1.5rem;font-weight:700"><i class="fas fa-star" style="color:var(--accent2);font-size:.9rem"></i> ' + (v.rating || 4.5) + '</div></div></div>' +
      '</div>' +
      '<p style="color:var(--text2);font-size:.9rem;line-height:1.8;margin-bottom:16px">' + (v.desc || 'No description provided.') + '</p>' +
      '<p style="font-size:.82rem;color:var(--text3);margin-bottom:22px"><i class="fas fa-store" style="color:var(--accent)"></i> ' + v.vendorName + '</p>' +
      bookBtn +
    '</div>'
  );
  modalShow('vDetailModal');
}

/* ── BOOKING MODAL OPEN ── */
function openBooking(id) {
  if (!CU || CR !== 'user') { openSignIn(); return; }
  var v = (Store.get('vehicles') || []).find(function(x) { return x.id === id; });
  if (!v) return;
  BT = v;
  $('#bkVehicleName').text(v.name + ' — ₹' + v.price.toLocaleString() + '/day');
  $('#bkStart, #bkEnd, #bkPickup, #bkReturn').val('');
  $('#bkSum').removeClass('show').html('');
  var ud = (Store.get('users') || []).find(function(u) { return u.id === CU.id; });
  $('#licWarn').toggleClass('d-none', !!(ud && ud.licenseUploaded));
  var today = new Date().toISOString().split('T')[0];
  $('#bkStart, #bkEnd').attr('min', today);
  modalShow('bookingModal');
}

/* ── BOOKING SUMMARY UPDATE ── */
function updateBkSum() {
  var s = $('#bkStart').val();
  var e = $('#bkEnd').val();
  if (!s || !e || !BT) return;
  var d1 = new Date(s), d2 = new Date(e);
  if (d2 <= d1) return;
  var days  = Math.max(1, Math.round((d2 - d1) / 86400000));
  var total = days * BT.price;
  var pu = $('#bkPickup').val() || 'Not specified';
  var rt = $('#bkReturn').val() || 'Not specified';
  $('#bkSum').addClass('show').html(
    '<div class="bk-sum-row"><span>Vehicle</span><span>' + BT.name + '</span></div>' +
    '<div class="bk-sum-row"><span>Pickup Date</span><span>' + s + '</span></div>' +
    '<div class="bk-sum-row"><span>Return Date</span><span>' + e + '</span></div>' +
    '<div class="bk-sum-row"><span>Duration</span><span>' + days + ' day(s)</span></div>' +
    '<div class="bk-sum-row"><span>Pickup At</span><span style="color:var(--accent)">' + pu + '</span></div>' +
    '<div class="bk-sum-row"><span>Return At</span><span style="color:var(--success)">' + rt + '</span></div>' +
    '<div class="bk-sum-row bk-total"><span>Total</span><span>₹' + total.toLocaleString() + '</span></div>'
  );
}

/* ── CONFIRM BOOKING ── */
function confirmBooking() {
  if (!CU || CR !== 'user') { showToast('Please sign in', 'err'); return; }
  var s  = $('#bkStart').val();
  var e  = $('#bkEnd').val();
  var pu = $.trim($('#bkPickup').val());
  var rt = $.trim($('#bkReturn').val());
  if (!s || !e)                    { showToast('Select pickup and return dates', 'err'); return; }
  if (new Date(e) <= new Date(s))  { showToast('Return date must be after pickup date', 'err'); return; }
  if (!pu)                         { showToast('Enter pickup location', 'err'); return; }
  if (!rt)                         { showToast('Enter return location', 'err'); return; }
  var users = Store.get('users') || [];
  var ud = users.find(function(u) { return u.id === CU.id; });
  if (!ud || !ud.licenseUploaded) {
    showToast('Upload your driving license in My Profile first', 'err');
    modalHide('bookingModal');
    showPage('user-dashboard');
    setTimeout(function() {
      showDashTab('userProfile', document.getElementById('uTab-userProfile'));
    }, 400);
    return;
  }
  var days  = Math.max(1, Math.round((new Date(e) - new Date(s)) / 86400000));
  var total = days * BT.price;
  var bk = {
    id: 'bk_' + Date.now(),
    userId: CU.id,
    userName: ud.name || CU.name,
    userEmail: ud.email || CU.email,
    userPhone: ud.phone || '',
    userCity: ud.city || '',
    licenseFront: ud.licenseFront || null,
    licenseBack: ud.licenseBack || null,
    vehicleId: BT.id,
    vehicleName: BT.name,
    vehicleType: BT.type,
    vehicleImg: (BT.images && BT.images[0]) || '',
    vehiclePrice: BT.price,
    vendorId: BT.vendorId,
    vendorName: BT.vendorName || '',
    startDate: s,
    endDate: e,
    days: days,
    total: total,
    pickupLocation: pu,
    returnLocation: rt,
    status: 'confirmed',
    bookedAt: new Date().toISOString()
  };
  var bks = Store.get('bookings') || [];
  bks.push(bk);
  Store.set('bookings', bks);
  var vs = Store.get('vehicles') || [];
  var vi = vs.findIndex(function(v) { return v.id === BT.id; });
  if (vi !== -1) { vs[vi].bookings = (vs[vi].bookings || 0) + 1; Store.set('vehicles', vs); }
  BT = null;
  modalHide('bookingModal');
  showToast('Booking confirmed! 🎉 Check My Bookings.', 'ok');
  showPage('user-dashboard');
  setTimeout(function() {
    showDashTab('myBookings', document.getElementById('uTab-myBookings'));
    loadUserBookings();
  }, 350);
}

/* ══════════════════════════════════════════
   USER DASHBOARD
══════════════════════════════════════════ */
function loadUserDash() {
  if (!CU) return;
  var ud = (Store.get('users') || []).find(function(u) { return u.id === CU.id; }) || CU;
  $('#userAva').text((CU.name || 'U').charAt(0).toUpperCase());
  $('#userName').text(CU.name || 'User');
  $('#pName').val(ud.name || '');
  $('#pEmail').val(ud.email || '');
  $('#pPhone').val(ud.phone || '');
  $('#pCity').val(ud.city || '');
  if (ud.licenseUploaded) {
    $('#licDone').show();
    if (ud.licenseFront) {
      licFront = ud.licenseFront;
      $('#licFPrev').html('<img src="' + ud.licenseFront + '" style="width:100%;height:100%;object-fit:cover;border-radius:8px"/>');
      $('#licFStat').html('<i class="fas fa-check" style="color:var(--success)"></i> Front uploaded');
    }
    if (ud.licenseBack) {
      licBack = ud.licenseBack;
      $('#licBPrev').html('<img src="' + ud.licenseBack + '" style="width:100%;height:100%;object-fit:cover;border-radius:8px"/>');
      $('#licBStat').html('<i class="fas fa-check" style="color:var(--success)"></i> Back uploaded');
    }
  } else {
    $('#licDone').hide();
    licFront = null; licBack = null;
    $('#licFPrev').html('<i class="fas fa-id-card"></i><span>Front Side</span><small>Click to upload</small>');
    $('#licBPrev').html('<i class="fas fa-id-card-alt"></i><span>Back Side</span><small>Click to upload</small>');
    $('#licFStat, #licBStat').html('');
  }
  loadUserBookings();
  loadDashVehicles();
}

/* ── LOAD USER BOOKINGS ── */
function loadUserBookings() {
  if (!CU) return;
  var bks = sortByFn(
    (Store.get('bookings') || []).filter(function(b) { return b.userId === CU.id; }),
    function(a, b) { return new Date(b.bookedAt) - new Date(a.bookedAt); }
  );
  if (!bks.length) {
    $('#userBookingsList').html(emptyHtml('fa-calendar-times', 'No bookings yet. Browse our fleet to get started!'));
    return;
  }
  var html = bks.map(function(b) { return userBookingCardHtml(b); }).join('');
  $('#userBookingsList').html(html);
  bindBookingHoverPopup('#userBookingsList', false);
}

/* ── USER BOOKING CARD HTML ── */
function userBookingCardHtml(b) {
  var statusClass = b.status === 'confirmed' ? 's-approved' : b.status === 'cancelled' ? 's-rejected' : 's-pending';
  return '<div class="bcard" data-bk-id="' + b.id + '">' +
    '<div class="bcard-hdr">' +
      '<div class="bcard-ico"><i class="fas fa-car"></i></div>' +
      '<div class="bcard-info">' +
        '<h4>' + b.vehicleName + '</h4>' +
        '<div class="bcard-dates">' +
          '<i class="fas fa-calendar"></i> ' + b.startDate + ' → ' + b.endDate + ' &nbsp;·&nbsp; ' + b.days + ' day(s)' +
        '</div>' +
      '</div>' +
      '<div class="bcard-right">' +
        '<div class="bcard-price">₹' + (b.total || 0).toLocaleString() + '</div>' +
        '<span class="sbadge ' + statusClass + '">' + (b.status || 'confirmed') + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="bcard-det">' +
      '<div class="bdet-grid">' +
        '<div class="bdet-item"><span class="bdet-lbl"><i class="fas fa-map-marker-alt" style="color:var(--accent)"></i> Pickup Location</span><span class="bdet-val">' + (b.pickupLocation || '—') + '</span></div>' +
        '<div class="bdet-item"><span class="bdet-lbl"><i class="fas fa-flag-checkered" style="color:var(--success)"></i> Return Location</span><span class="bdet-val">' + (b.returnLocation || '—') + '</span></div>' +
        '<div class="bdet-item"><span class="bdet-lbl"><i class="fas fa-car" style="color:var(--accent)"></i> Vehicle Type</span><span class="bdet-val" style="text-transform:capitalize">' + (b.vehicleType || '—') + '</span></div>' +
        '<div class="bdet-item"><span class="bdet-lbl"><i class="fas fa-rupee-sign" style="color:var(--accent)"></i> Rate / Day</span><span class="bdet-val">' + (b.vehiclePrice ? '₹' + b.vehiclePrice.toLocaleString() : '—') + '</span></div>' +
        '<div class="bdet-item"><span class="bdet-lbl"><i class="fas fa-store" style="color:var(--accent)"></i> Vendor</span><span class="bdet-val">' + (b.vendorName || '—') + '</span></div>' +
        '<div class="bdet-item"><span class="bdet-lbl"><i class="fas fa-clock" style="color:var(--accent)"></i> Booked On</span><span class="bdet-val">' + (b.bookedAt ? new Date(b.bookedAt).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'}) : '—') + '</span></div>' +
      '</div>' +
      '<div class="bdet-total-row">' +
        '<span>Total Amount</span>' +
        '<span class="bdet-total-val">₹' + (b.total || 0).toLocaleString() + ' <small>(' + b.days + ' day' + (b.days > 1 ? 's' : '') + ')</small></span>' +
      '</div>' +
    '</div>' +
  '</div>';
}

/* ── BOOKING HOVER POPUP ── */
function bindBookingHoverPopup(containerSelector, isAdmin) {
  var popup = document.getElementById('bookingHoverPopup');
  var $c = $(containerSelector);
  $c.off('mouseenter.bkpop mouseleave.bkpop mousemove.bkpop', '.bcard');
  $c.on('mouseenter.bkpop', '.bcard', function(e) {
    var id = $(this).data('bk-id');
    var bk = (Store.get('bookings') || []).find(function(x) { return x.id === id; });
    if (!bk) return;
    var inner = '';
    if (isAdmin) {
      var ud = (Store.get('users') || []).find(function(u) { return u.id === bk.userId; });
      var licHtml = '';
      var front = bk.licenseFront || (ud && ud.licenseFront) || null;
      var back  = bk.licenseBack  || (ud && ud.licenseBack)  || null;
      if (front || back) {
        licHtml = '<div class="bhp-lic">' +
          '<div class="bhp-lic-title">Driving License</div>' +
          '<div class="bhp-lic-imgs">' +
            '<div class="bhp-lic-img">' + (front ? '<img src="' + front + '"/>' : '<span>No front</span>') + '</div>' +
            '<div class="bhp-lic-img">' + (back  ? '<img src="' + back  + '"/>' : '<span>No back</span>')  + '</div>' +
          '</div>' +
        '</div>';
      }
      inner =
        '<div class="bhp-title"><i class="fas fa-user"></i> ' + bk.userName + '</div>' +
        '<div class="bhp-row"><span>Email</span><span>' + bk.userEmail + '</span></div>' +
        '<div class="bhp-row"><span>Phone</span><span>' + (bk.userPhone || '—') + '</span></div>' +
        '<div class="bhp-row"><span>City</span><span>'  + (bk.userCity  || '—') + '</span></div>' +
        '<div class="bhp-row"><span>Vehicle</span><span>' + bk.vehicleName + '</span></div>' +
        '<div class="bhp-row"><span>Pickup Date</span><span>'  + bk.startDate + '</span></div>' +
        '<div class="bhp-row"><span>Return Date</span><span>'  + bk.endDate   + '</span></div>' +
        '<div class="bhp-row"><span>Days</span><span>'  + bk.days  + '</span></div>' +
        '<div class="bhp-row"><span>Total</span><span style="color:var(--accent);font-weight:700">₹' + (bk.total || 0).toLocaleString() + '</span></div>' +
        '<div class="bhp-row"><span>Pickup At</span><span>' + (bk.pickupLocation || '—') + '</span></div>' +
        '<div class="bhp-row"><span>Return At</span><span>' + (bk.returnLocation || '—') + '</span></div>' +
        licHtml +
        '<button class="bhp-del-btn" onclick="adminDeleteBooking(\'' + bk.id + '\')"><i class="fas fa-trash"></i> Delete This Booking</button>';
    } else {
      inner =
        '<div class="bhp-title"><i class="fas fa-car"></i> ' + bk.vehicleName + '</div>' +
        '<div class="bhp-row"><span>Pickup Date</span><span>' + bk.startDate + '</span></div>' +
        '<div class="bhp-row"><span>Return Date</span><span>' + bk.endDate   + '</span></div>' +
        '<div class="bhp-row"><span>Duration</span><span>' + bk.days + ' day(s)</span></div>' +
        '<div class="bhp-row"><span>Pickup At</span><span>' + (bk.pickupLocation || '—') + '</span></div>' +
        '<div class="bhp-row"><span>Return At</span><span>' + (bk.returnLocation || '—') + '</span></div>' +
        '<div class="bhp-row"><span>Total</span><span style="color:var(--accent);font-weight:700">₹' + (bk.total || 0).toLocaleString() + '</span></div>' +
        '<div class="bhp-row"><span>Status</span><span style="color:var(--success);font-weight:700">' + (bk.status || 'confirmed') + '</span></div>';
    }
    popup.innerHTML = inner;
    positionPopup(e);
    popup.classList.add('show');
  });
  $c.on('mousemove.bkpop', '.bcard', function(e) { positionPopup(e); });
  $c.on('mouseleave.bkpop', '.bcard', function() { popup.classList.remove('show'); });
}

function positionPopup(e) {
  var popup = document.getElementById('bookingHoverPopup');
  var pw = 320;
  var ph = popup.offsetHeight || 280;
  var x = e.clientX + 18;
  var y = e.clientY + 18;
  if (x + pw > window.innerWidth  - 10) x = e.clientX - pw - 10;
  if (y + ph > window.innerHeight - 10) y = e.clientY - ph - 10;
  if (x < 8) x = 8;
  if (y < 8) y = 8;
  popup.style.left = (x + window.scrollX) + 'px';
  popup.style.top  = (y + window.scrollY) + 'px';
}

/* ── LOAD DASH VEHICLES ── */
function loadDashVehicles() {
  var vs = filterKey(Store.get('vehicles'), 'status', 'approved');
  $('#dashVehiclesGrid').html(
    vs.length ? vs.map(function(v) { return vehicleCardHtml(v); }).join('') : emptyHtml('fa-car-side', 'No vehicles available.')
  );
}

function filterDashV() {
  var q = $('#dVSearch').val() || '';
  var t = $('#dVType').val()   || '';
  var vs = filterKey(Store.get('vehicles'), 'status', 'approved');
  if (t) vs = filterKey(vs, 'type', t);
  if (q) vs = searchArr(vs, ['name','type','vendorName'], q);
  $('#dashVehiclesGrid').html(
    vs.length ? vs.map(function(v) { return vehicleCardHtml(v); }).join('') : emptyHtml('fa-search', 'No vehicles found.')
  );
}

function showDashTab(id, el) {
  $('#page-user-dashboard .dtab').removeClass('active');
  $('#page-user-dashboard .sl').removeClass('active');
  $('#tab-' + id).addClass('active');
  if (el) $(el).addClass('active');
  else $('#uTab-' + id).addClass('active');
  if (id === 'myBookings')     loadUserBookings();
  if (id === 'browseVehicles') loadDashVehicles();
}

/* ── LICENSE UPLOAD ── */
function handleLicUpload(input, side) {
  var file = input.files[0];
  if (!file) return;
  input.value = '';
  if (file.size > 5 * 1024 * 1024) { showToast('Max file size is 5MB', 'err'); return; }
  var reader = new FileReader();
  reader.onerror = function() { showToast('Failed to read file', 'err'); };
  reader.onload = function(ev) {
    var data = ev.target.result;
    if (!data) return;
    var preview = file.type.startsWith('image/')
      ? '<img src="' + data + '" style="width:100%;height:100%;object-fit:cover;border-radius:8px"/>'
      : '<i class="fas fa-file-pdf" style="font-size:1.8rem;color:var(--accent)"></i><span>' + file.name + '</span>';
    if (side === 'front') {
      licFront = data;
      $('#licFPrev').html(preview);
      $('#licFStat').html('<i class="fas fa-check" style="color:var(--success)"></i> Front uploaded');
    } else {
      licBack = data;
      $('#licBPrev').html(preview);
      $('#licBStat').html('<i class="fas fa-check" style="color:var(--success)"></i> Back uploaded');
    }
    if (licFront && licBack) {
      $('#licDone').show();
      showToast('Both sides uploaded! Save profile to confirm.', 'ok');
    }
  };
  reader.readAsDataURL(file);
}

/* ── PROFILE SAVE ── */
function saveProfile() {
  if (!CU) return;
  var name  = $.trim($('#pName').val());
  var phone = $('#pPhone').val().trim();
  var city  = $('#pCity').val().trim();
  if (!name) { showToast('Name cannot be empty', 'err'); return; }
  var users = Store.get('users') || [];
  var idx   = users.findIndex(function(u) { return u.id === CU.id; });
  if (idx === -1) { showToast('User not found', 'err'); return; }
  var licDone = !!(licFront && licBack);
  users[idx] = Object.assign({}, users[idx], {
    name: name,
    phone: phone,
    city: city,
    licenseUploaded: licDone,
    licenseFront: licFront || users[idx].licenseFront || null,
    licenseBack:  licBack  || users[idx].licenseBack  || null
  });
  Store.set('users', users);
  CU = users[idx];
  saveSession();
  $('#userAva').text((name || 'U').charAt(0).toUpperCase());
  $('#userName').text(name);
  updateNav();
  showToast(
    licDone ? 'Profile & license saved! ✅ You can now book vehicles.' : 'Profile saved! Upload both license sides to enable bookings.',
    licDone ? 'ok' : 'inf'
  );
}

function deleteAccount() {
  if (!confirm('Delete your account? All bookings will be lost. This cannot be undone.')) return;
  Store.set('users',    (Store.get('users')    || []).filter(function(u) { return u.id !== CU.id; }));
  Store.set('bookings', (Store.get('bookings') || []).filter(function(b) { return b.userId !== CU.id; }));
  CU = null; CR = null;
  Store.del('session');
  showToast('Account deleted', 'inf');
  updateNav(); showPage('home');
}

/* ── CONTACT FORMS ── */
function submitContact() {
  var n = $('#cName').val().trim();
  var e = $('#cEmail').val().trim();
  var s = $('#cSubj').val();
  var m = $('#cMsg').val().trim();
  if (!n || !e || !s || !m) { showToast('Please fill all fields', 'err'); return; }
  var msgs = Store.get('messages') || [];
  msgs.push({ id:'msg_' + Date.now(), name:n, email:e, subject:s, message:m, sentAt:new Date().toISOString(), type:'public' });
  Store.set('messages', msgs);
  $('#cName, #cEmail, #cMsg').val('');
  $('#cSubj').val('');
  showToast("Message sent! We'll reply shortly.", 'ok');
}

function submitUserContact() {
  if (!CU) return;
  var s = $('#ucSubj').val();
  var m = $('#ucMsg').val().trim();
  if (!s || !m) { showToast('Please fill all fields', 'err'); return; }
  var msgs = Store.get('messages') || [];
  msgs.push({ id:'msg_' + Date.now(), name:CU.name, email:CU.email, subject:s, message:m, sentAt:new Date().toISOString(), type:'user', userId:CU.id });
  Store.set('messages', msgs);
  $('#ucSubj').val('');
  $('#ucMsg').val('');
  showToast('Message sent to admin!', 'ok');
}

/* ══════════════════════════════════════════
   ADMIN DASHBOARD
══════════════════════════════════════════ */
function loadAdminDash() {
  loadAdminOverview();
  loadAdminBookings();
  loadAdminVendors();
  loadAdminVehicles('all');
  loadAdminUsers();
  loadAdminMessages();
}

function loadAdminOverview() {
  var vs  = Store.get('vehicles') || [];
  var bks = Store.get('bookings') || [];
  var us  = Store.get('users')    || [];
  var vnd = Store.get('vendors')  || [];
  var pendV   = vs.filter(function(v)  { return v.status === 'pending'; }).length;
  var revenue = bks.reduce(function(s, b) { return s + (b.total || 0); }, 0);
  $('#adminStats').html(
    '<div class="stat-card"><div class="num">' + bks.length + '</div><div class="lbl">Total Bookings</div></div>' +
    '<div class="stat-card blue"><div class="num">' + vs.filter(function(v) { return v.status === 'approved'; }).length + '</div><div class="lbl">Active Vehicles</div></div>' +
    '<div class="stat-card green"><div class="num">' + us.length + '</div><div class="lbl">Registered Users</div></div>' +
    '<div class="stat-card purple"><div class="num">' + vnd.length + '</div><div class="lbl">Vendors</div></div>' +
    '<div class="stat-card" style="border-left-color:var(--warning)"><div class="num" style="color:var(--warning)">' + pendV + '</div><div class="lbl">Pending Vehicles</div></div>' +
    '<div class="stat-card" style="border-left-color:var(--accent2)"><div class="num" style="color:var(--accent2)">₹' + revenue.toLocaleString() + '</div><div class="lbl">Total Revenue</div></div>'
  );
  var recent = sortByFn(bks, function(a, b) { return new Date(b.bookedAt) - new Date(a.bookedAt); }).slice(0, 3);
  $('#adminRecentActivity').html(
    recent.length ? recent.map(function(b) { return adminBookingCardHtml(b); }).join('') : emptyHtml('fa-calendar-times', 'No bookings yet.')
  );
  bindBookingHoverPopup('#adminRecentActivity', true);
}

function loadAdminBookings() {
  var bks = sortByFn(Store.get('bookings') || [], function(a, b) { return new Date(b.bookedAt) - new Date(a.bookedAt); });
  $('#aBookingsList').html(
    bks.length ? bks.map(function(b) { return adminBookingCardHtml(b); }).join('') : emptyHtml('fa-calendar-times', 'No bookings yet.')
  );
  bindBookingHoverPopup('#aBookingsList', true);
}

function adminBookingCardHtml(b) {
  return '<div class="bcard" data-bk-id="' + b.id + '">' +
    '<div class="bcard-hdr">' +
      '<div class="bcard-ico"><i class="fas fa-car"></i></div>' +
      '<div class="bcard-info">' +
        '<h4>' + b.vehicleName + ' <span style="font-size:.74rem;color:var(--text3);font-weight:400">by ' + b.userName + '</span></h4>' +
        '<div class="bcard-dates"><i class="fas fa-calendar"></i> ' + b.startDate + ' → ' + b.endDate + ' · ' + b.days + ' day(s)</div>' +
      '</div>' +
      '<div class="bcard-right">' +
        '<div class="bcard-price">₹' + (b.total || 0).toLocaleString() + '</div>' +
        '<span class="sbadge s-approved">' + (b.status || 'confirmed') + '</span><br/>' +
        '<button class="btn-de-del mt-1" style="font-size:.7rem;padding:4px 10px" onclick="adminDeleteBooking(\'' + b.id + '\')"><i class="fas fa-trash"></i> Delete</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function adminDeleteBooking(id) {
  if (!confirm('Delete this booking permanently?')) return;
  document.getElementById('bookingHoverPopup').classList.remove('show');
  Store.set('bookings', (Store.get('bookings') || []).filter(function(b) { return b.id !== id; }));
  showToast('Booking deleted', 'inf');
  loadAdminBookings();
  loadAdminOverview();
}

/* ── ADMIN VENDORS ── */
function loadAdminVendors() { renderVendorTbl(Store.get('vendors') || []); }
function renderVendorTbl(vs) {
  if (!vs.length) { $('#aVendorsList').html(emptyHtml('fa-store', 'No vendors yet.')); return; }
  var rows = vs.map(function(v) {
    return '<tr>' +
      '<td>' + v.name + '</td>' +
      '<td>' + v.email + '</td>' +
      '<td>' + (v.joinedAt ? new Date(v.joinedAt).toLocaleDateString() : '—') + '</td>' +
      '<td><span class="sbadge ' + (v.status === 'approved' ? 's-approved' : v.status === 'rejected' ? 's-rejected' : 's-pending') + '">' + v.status + '</span></td>' +
      '<td><div class="acts">' +
        (v.status === 'pending'   ? '<button class="btn-de-success" onclick="setVendorStatus(\'' + v.id + '\',\'approved\')">Approve</button><button class="btn-de-del" onclick="setVendorStatus(\'' + v.id + '\',\'rejected\')">Reject</button>' : '') +
        (v.status === 'approved'  ? '<button class="btn-de-del" onclick="setVendorStatus(\'' + v.id + '\',\'rejected\')">Suspend</button>' : '') +
        '<button class="btn-de-del" onclick="removeVendor(\'' + v.id + '\')">Remove</button>' +
      '</div></td>' +
    '</tr>';
  }).join('');
  $('#aVendorsList').html(
    '<table class="dtable"><thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead><tbody>' + rows + '</tbody></table>'
  );
}
function setVendorStatus(id, s) {
  var vs = Store.get('vendors') || [];
  var i  = vs.findIndex(function(v) { return v.id === id; });
  if (i === -1) return;
  vs[i].status = s;
  Store.set('vendors', vs);
  renderVendorTbl(vs);
  showToast('Vendor ' + (s === 'approved' ? 'approved ✓' : 'suspended'), s === 'approved' ? 'ok' : 'inf');
}
function removeVendor(id) {
  if (!confirm('Remove this vendor? Their vehicles will also be removed.')) return;
  Store.set('vehicles', (Store.get('vehicles') || []).filter(function(v) { return v.vendorId !== id; }));
  Store.set('vendors',  (Store.get('vendors')  || []).filter(function(v) { return v.id !== id; }));
  loadAdminVendors(); loadAdminVehicles(adminVehicleFilter);
  showToast('Vendor removed', 'inf');
}
function sortVendors(k) {
  renderVendorTbl(sortByFn(Store.get('vendors') || [], function(a, b) {
    return k === 'status' ? (a.status||'').localeCompare(b.status||'') : a.name.localeCompare(b.name);
  }));
}

/* ── ADMIN VEHICLES ── */
function filterAdminVehicles(f) { adminVehicleFilter = f; loadAdminVehicles(f); }
function loadAdminVehicles(filter) {
  var vs = Store.get('vehicles') || [];
  if (filter && filter !== 'all') vs = vs.filter(function(v) { return v.status === filter; });
  if (!vs.length) { $('#aVehiclesList').html(emptyHtml('fa-car-side', 'No vehicles found.')); return; }
  var rows = vs.map(function(v) {
    return '<tr>' +
      '<td><strong>' + v.name + '</strong></td>' +
      '<td><span class="sbadge s-approved" style="text-transform:capitalize">' + v.type + '</span></td>' +
      '<td>₹' + v.price.toLocaleString() + '</td>' +
      '<td>' + v.vendorName + '</td>' +
      '<td>' + (v.insurance ? '<span class="sbadge s-approved"><i class="fas fa-shield-alt"></i> Yes</span>' : '<span class="sbadge s-rejected">No</span>') + '</td>' +
      '<td><span class="sbadge ' + (v.status === 'approved' ? 's-approved' : v.status === 'rejected' ? 's-rejected' : 's-pending') + '">' + v.status + '</span></td>' +
      '<td><div class="acts">' +
        (v.status === 'pending'  ? '<button class="btn-de-success" onclick="approveVehicle(\'' + v.id + '\')">Approve</button><button class="btn-de-del" onclick="rejectVehicle(\'' + v.id + '\')">Reject</button>' : '') +
        (v.status === 'approved' ? '<button class="btn-de-del" onclick="rejectVehicle(\'' + v.id + '\')">Delist</button>' : '') +
        '<button class="btn-de-del" onclick="delVehicle(\'' + v.id + '\')"><i class="fas fa-trash"></i></button>' +
      '</div></td>' +
    '</tr>';
  }).join('');
  $('#aVehiclesList').html(
    '<table class="dtable"><thead><tr><th>Name</th><th>Type</th><th>Price/day</th><th>Vendor</th><th>Insurance</th><th>Status</th><th>Actions</th></tr></thead><tbody>' + rows + '</tbody></table>'
  );
}
function approveVehicle(id) {
  var vs = Store.get('vehicles') || [];
  var i  = vs.findIndex(function(v) { return v.id === id; });
  if (i === -1) return;
  vs[i].status = 'approved';
  Store.set('vehicles', vs);
  loadAdminVehicles(adminVehicleFilter);
  showToast('Vehicle approved! ✓', 'ok');
}
function rejectVehicle(id) {
  var vs = Store.get('vehicles') || [];
  var i  = vs.findIndex(function(v) { return v.id === id; });
  if (i === -1) return;
  vs[i].status = 'rejected';
  Store.set('vehicles', vs);
  loadAdminVehicles(adminVehicleFilter);
  showToast('Vehicle delisted', 'inf');
}
function delVehicle(id) {
  if (!confirm('Permanently delete this vehicle?')) return;
  Store.set('vehicles', (Store.get('vehicles') || []).filter(function(v) { return v.id !== id; }));
  loadAdminVehicles(adminVehicleFilter);
  showToast('Vehicle deleted', 'inf');
}

/* ── ADMIN USERS ── */
function loadAdminUsers() { renderUserTbl(Store.get('users') || []); }
function renderUserTbl(us) {
  if (!us.length) { $('#aUsersList').html(emptyHtml('fa-users', 'No users registered yet.')); return; }
  var rows = us.map(function(u) {
    var licCell = u.licenseUploaded
      ? '<span class="sbadge s-approved"><i class="fas fa-id-card"></i> Uploaded</span>' + (u.licenseFront ? '<button class="btn-de-warn ms-1" style="font-size:.65rem;padding:3px 8px" onclick="viewLicense(\'' + u.id + '\')">View</button>' : '')
      : '<span class="sbadge s-pending">Not Uploaded</span>';
    return '<tr>' +
      '<td>' + u.name + '</td>' +
      '<td>' + u.email + '</td>' +
      '<td>' + (u.phone || '—') + '</td>' +
      '<td>' + (u.city  || '—') + '</td>' +
      '<td>' + licCell + '</td>' +
      '<td><button class="btn-de-del" onclick="removeUser(\'' + u.id + '\')"><i class="fas fa-trash"></i> Remove</button></td>' +
    '</tr>';
  }).join('');
  $('#aUsersList').html(
    '<table class="dtable"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>City</th><th>License</th><th>Actions</th></tr></thead><tbody>' + rows + '</tbody></table>'
  );
}
function viewLicense(uid) {
  var u = (Store.get('users') || []).find(function(x) { return x.id === uid; });
  if (!u || (!u.licenseFront && !u.licenseBack)) { showToast('No license images available', 'inf'); return; }
  var d = document.createElement('div');
  d.className = 'modal fade';
  d.innerHTML =
    '<div class="modal-dialog modal-dialog-centered modal-lg"><div class="modal-content de-modal">' +
      '<button type="button" class="mclose" data-bs-dismiss="modal"><i class="fas fa-times"></i></button>' +
      '<div class="mhdr"><h2>' + u.name + '\'s <span class="accent">License</span></h2></div>' +
      '<div class="row g-3">' +
        '<div class="col-6"><p style="color:var(--text3);font-size:.7rem;margin-bottom:8px;text-transform:uppercase;letter-spacing:.1em">FRONT SIDE</p>' +
          (u.licenseFront ? '<img src="' + u.licenseFront + '" style="width:100%;border-radius:12px;border:1px solid var(--border)"/>' : '<p style="color:var(--text3)">Not uploaded</p>') +
        '</div>' +
        '<div class="col-6"><p style="color:var(--text3);font-size:.7rem;margin-bottom:8px;text-transform:uppercase;letter-spacing:.1em">BACK SIDE</p>' +
          (u.licenseBack ? '<img src="' + u.licenseBack + '" style="width:100%;border-radius:12px;border:1px solid var(--border)"/>' : '<p style="color:var(--text3)">Not uploaded</p>') +
        '</div>' +
      '</div>' +
    '</div></div>';
  document.body.appendChild(d);
  var m = new bootstrap.Modal(d);
  m.show();
  $(d).on('hidden.bs.modal', function() { $(this).remove(); });
}
function removeUser(id) {
  if (!confirm('Remove this user? Their bookings will also be deleted.')) return;
  Store.set('users',    (Store.get('users')    || []).filter(function(u) { return u.id !== id; }));
  Store.set('bookings', (Store.get('bookings') || []).filter(function(b) { return b.userId !== id; }));
  loadAdminUsers();
  showToast('User removed', 'inf');
}
function sortUsers(k) {
  renderUserTbl(sortByFn(Store.get('users') || [], function(a, b) {
    return k === 'email' ? a.email.localeCompare(b.email) : a.name.localeCompare(b.name);
  }));
}

/* ── ADMIN MESSAGES ── */
function loadAdminMessages() {
  var ms = sortByFn(Store.get('messages') || [], function(a, b) { return new Date(b.sentAt) - new Date(a.sentAt); });
  if (!ms.length) { $('#aMessagesList').html(emptyHtml('fa-inbox', 'No messages yet.')); return; }
  $('#aMessagesList').html(ms.map(function(m) {
    return '<div class="bcard">' +
      '<div class="bcard-hdr">' +
        '<div class="bcard-ico" style="background:rgba(0,200,255,.08);color:var(--vendor)"><i class="fas fa-envelope"></i></div>' +
        '<div class="bcard-info">' +
          '<h4>' + m.subject + '</h4>' +
          '<div class="bcard-dates"><i class="fas fa-user"></i> ' + m.name + ' · ' + m.email + '</div>' +
        '</div>' +
        '<div class="bcard-right">' +
          '<span style="font-size:.72rem;color:var(--text3)">' + new Date(m.sentAt).toLocaleDateString() + '</span><br/>' +
          '<span class="sbadge ' + (m.type === 'user' ? 's-approved' : 's-pending') + '" style="font-size:.62rem">' + (m.type === 'user' ? 'User' : 'Public') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="bcard-det"><p style="font-size:.85rem;color:var(--text2);line-height:1.7">' + m.message + '</p></div>' +
    '</div>';
  }).join(''));
}

function showAdminTab(id, el) {
  $('#page-admin-dashboard .dtab').removeClass('active');
  $('#page-admin-dashboard .sl').removeClass('active');
  $('#tab-' + id).addClass('active');
  if (el) $(el).addClass('active');
  else $('#aTab-' + id).addClass('active');
  if (id === 'aMessages') loadAdminMessages();
  if (id === 'aOverview') loadAdminOverview();
  if (id === 'aBookings') loadAdminBookings();
  if (id === 'aVendors')  loadAdminVendors();
  if (id === 'aVehicles') loadAdminVehicles(adminVehicleFilter);
  if (id === 'aUsers')    loadAdminUsers();
}

/* ══════════════════════════════════════════
   VENDOR DASHBOARD
══════════════════════════════════════════ */
function loadVendorDash() {
  if (!CU) return;
  var freshVendor = (Store.get('vendors') || []).find(function(v) { return v.id === CU.id; });
  if (freshVendor) { CU = freshVendor; saveSession(); }
  $('#vendorAva').text((CU.name || 'V').charAt(0).toUpperCase());
  $('#vendorName').text(CU.name || 'Vendor');
  var statusMap = {
    approved: '<span class="sbadge s-approved"><i class="fas fa-check-circle"></i> Approved</span>',
    rejected:  '<span class="sbadge s-rejected"><i class="fas fa-ban"></i> Suspended</span>',
    pending:   '<span class="sbadge s-pending"><i class="fas fa-clock"></i> Pending Review</span>'
  };
  $('#vendorStatusBadge').html(statusMap[CU.status] || statusMap.pending);
  $('#vendorPendingNotice').toggle(CU.status !== 'approved');
  loadVendorVehicles();
  loadVendorOrders();
}

function loadVendorVehicles() {
  if (!CU) return;
  var vs = (Store.get('vehicles') || []).filter(function(v) { return v.vendorId === CU.id; });
  if (!vs.length) { $('#vVehiclesList').html(emptyHtml('fa-car-side', 'No vehicles added yet. Use the Add Vehicle tab.')); return; }
  var rows = sortByFn(vs, function(a, b) { return a.name.localeCompare(b.name); }).map(function(v) {
    return '<tr>' +
      '<td><strong>' + v.name + '</strong></td>' +
      '<td style="text-transform:capitalize">' + v.type + '</td>' +
      '<td>₹' + v.price.toLocaleString() + '</td>' +
      '<td>' + v.seats + '</td>' +
      '<td>' + (v.insurance ? '<span class="sbadge s-approved"><i class="fas fa-shield-alt"></i> Yes</span>' : '<span class="sbadge s-rejected">No</span>') + '</td>' +
      '<td><span class="sbadge ' + (v.status === 'approved' ? 's-approved' : v.status === 'rejected' ? 's-rejected' : 's-pending') + '">' + v.status + '</span></td>' +
    '</tr>';
  }).join('');
  $('#vVehiclesList').html(
    '<table class="dtable"><thead><tr><th>Name</th><th>Type</th><th>Price/day</th><th>Seats</th><th>Insurance</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table>'
  );
}

function loadVendorOrders() {
  if (!CU) return;
  var vids = (Store.get('vehicles') || []).filter(function(v) { return v.vendorId === CU.id; }).map(function(v) { return v.id; });
  var ords = sortByFn(
    (Store.get('bookings') || []).filter(function(b) { return vids.indexOf(b.vehicleId) !== -1; }),
    function(a, b) { return new Date(b.bookedAt) - new Date(a.bookedAt); }
  );
  $('#vOrdersList').html(
    ords.length ? ords.map(function(b) { return adminBookingCardHtml(b); }).join('') : emptyHtml('fa-bell-slash', 'No orders yet. Get your vehicles approved to start receiving bookings.')
  );
  if (ords.length) bindBookingHoverPopup('#vOrdersList', false);
}

/* ── INSURANCE UPLOAD ── */
function handleInsuranceUpload(input) {
  var file = input.files[0];
  if (!file) return;
  input.value = '';
  if (file.size > 5 * 1024 * 1024) { showToast('Max file size is 5MB', 'err'); return; }
  var reader = new FileReader();
  reader.onerror = function() { showToast('Failed to read file', 'err'); };
  reader.onload = function(ev) {
    var data = ev.target.result;
    if (!data) return;
    insDoc = data;
    var preview = file.type.startsWith('image/')
      ? '<img src="' + data + '" style="width:100%;height:100%;object-fit:cover;border-radius:8px"/>'
      : '<i class="fas fa-file-pdf" style="font-size:1.8rem;color:var(--accent)"></i><span>' + file.name + '</span>';
    $('#insPrev').html(preview);
    $('#insStat').html('<i class="fas fa-check"></i> Insurance uploaded ✓');
    showToast('Insurance document uploaded!', 'ok');
  };
  reader.readAsDataURL(file);
}

/* ── VEHICLE IMAGES UPLOAD ── */
function handleVehicleImages(input) {
  var files = Array.from(input.files || []);
  if (!files.length) return;
  input.value = '';
  /* FIX: Check current count against max of 5 per vehicle submission */
  if (upImgs.length >= 5) {
    showToast('Maximum 5 images allowed per vehicle.', 'err');
    return;
  }
  var remaining = 5 - upImgs.length;
  var toProcess = files.slice(0, remaining);
  if (files.length > remaining) {
    showToast('Only ' + remaining + ' more image(s) can be added (max 5 total).', 'inf');
  }
  toProcess.forEach(function(f) {
    if (!f.type.startsWith('image/')) { showToast('Only image files allowed', 'err'); return; }
    if (f.size > 5 * 1024 * 1024)     { showToast('Each image must be under 5MB', 'err'); return; }
    var reader = new FileReader();
    var key = ++imgCounter;
    reader.onerror = function() { showToast('Failed to read image', 'err'); };
    reader.onload = function(ev) {
      var data = ev.target.result;
      if (!data) return;
      upImgs.push({ key: key, data: data });
      $('#imgPrevs').append(
        '<div class="img-pitem" id="ip_' + key + '">' +
          '<img src="' + data + '" alt="Vehicle photo"/>' +
          '<button class="img-rm" onclick="removeImg(' + key + ',event)"><i class="fas fa-times"></i></button>' +
        '</div>'
      );
    };
    reader.readAsDataURL(f);
  });
}

function removeImg(key, e) {
  if (e) e.stopPropagation();
  upImgs = upImgs.filter(function(i) { return i.key !== key; });
  $('#ip_' + key).remove();
}

/* ── RESET VENDOR ADD VEHICLE FORM ── */
/* FIX: Extracted into a dedicated function so it's always called completely */
function resetVehicleForm() {
  $('#vName').val('');
  $('#vPrice').val('');
  $('#vSeats').val('');
  $('#vDesc').val('');
  $('#vType').val('sedan');
  /* Reset image previews */
  $('#imgPrevs').empty();
  /* Reset image state */
  upImgs = [];
  imgCounter = 0;
  /* Reset insurance */
  insDoc = null;
  $('#insPrev').html('<i class="fas fa-file-shield"></i><span>Upload Insurance Document</span><small>PDF or Image — Max 5MB</small>');
  $('#insStat').text('');
  /* Reset file inputs so same file can be re-selected */
  $('#carIns').val('');
  $('#vImgs').val('');
  /* Reset image upbox label */
  $('#imgUpBox').html('<i class="fas fa-cloud-upload-alt"></i> Upload up to 5 vehicle images');
}

/* ── ADD VEHICLE ── */
function addVehicle() {
  var name  = $('#vName').val().trim();
  var type  = $('#vType').val();
  var price = parseInt($('#vPrice').val());
  var seats = parseInt($('#vSeats').val());
  var desc  = $('#vDesc').val().trim();

  if (!name || !type || !price || !seats || !desc) {
    showToast('Please fill all fields', 'err');
    return;
  }

  if (upImgs.length === 0) {
    showToast('Upload at least 1 vehicle image', 'err');
    return;
  }

  if (!insDoc) {
    showToast('Upload insurance document', 'err');
    return;
  }

  var vehicles = Store.get('vehicles') || [];

  var newVehicle = {
    id: 'v_' + Date.now(),
    name: name,
    type: type,
    price: price,
    seats: seats,
    desc: desc,
    vendorId: CU.id,
    vendorName: CU.name,
    status: 'pending',
    images: upImgs.slice(),
    insurance: true,
    createdAt: new Date().toISOString()
  };

  vehicles.push(newVehicle);
  Store.set('vehicles', vehicles);

  showToast('Vehicle added successfully! Awaiting admin approval', 'ok');

  /* ✅ RESET EVERYTHING PROPERLY */
  resetVehicleForm();
}

function showVendorTab(id, el) {
  $('#page-vendor-dashboard .dtab').removeClass('active');
  $('#page-vendor-dashboard .sl').removeClass('active');
  $('#tab-' + id).addClass('active');
  if (el) $(el).addClass('active');
  else $('#vTab-' + id).addClass('active');
  /* FIX: Reset form state when navigating TO the Add Vehicle tab */
  if (id === 'vAdd') {
    resetVehicleForm();
  }
  if (id === 'vVehicles') loadVendorVehicles();
  if (id === 'vOrders')   loadVendorOrders();
}

/* ── EMPTY STATE ── */
function emptyHtml(icon, msg) {
  return '<div class="empty"><i class="fas ' + icon + '"></i><p>' + msg + '</p></div>';
}
