(function () {
  // ========= CONFIG =========
  // If you defined the route in routes/api.php:
  var ENDPOINT = "/api/analytics/track";
  // If you used routes/web.php instead, use:
  // var ENDPOINT = "{{ url('/analytics/track') }}";

  var BATCH_SIZE = 10;   // how many events before we send immediately
  var FLUSH_MS  = 3000;  // max time to wait before sending batch

  // ========= UTILITIES =========
  function uuidv4() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){
      var r=Math.random()*16|0, v=c==='x'?r:(r&0x3|0x8); return v.toString(16);
    });
  }
  function getSid() {
    var k='__sid';
    var v=localStorage.getItem(k);
    if(!v){ v=uuidv4(); localStorage.setItem(k,v); }
    return v;
  }
  function nowISO() { return new Date().toISOString().slice(0,19).replace('T',' '); }

  function cssPath(el){
    try {
      var $el=$(el), parts=[];
      while($el.length && parts.length<8){
        var node=$el[0].nodeName.toLowerCase();
        var id=$el.attr('id'); if(id){ parts.unshift(node+'#'+id); break; }
        var cls=($el.attr('class')||'').trim().split(/\s+/).slice(0,3).join('.');
        if(cls) node+='.'+cls;
        var same=$el.parent().children(node).length;
        if(same>1) node+=':nth-of-type('+($el.index()+1)+')';
        parts.unshift(node);
        $el=$el.parent();
      }
      return parts.join(' > ');
    } catch(e){ return ''; }
  }

  function baseCtx() {
    return {
      session_id: sid,
      ts: nowISO(),
      page_url: location.href,
      page_title: document.title,
      viewport_w: window.innerWidth,
      viewport_h: window.innerHeight,
      doc_w: document.documentElement.scrollWidth,
      doc_h: document.documentElement.scrollHeight,
      scroll_y: window.scrollY|0
    };
  }

  // ========= QUEUE / TRANSPORT =========
  var sid = getSid();
  var q = [];
  var flushTO;

  function pushEvent(evt){
    q.push(evt);
    if (q.length >= BATCH_SIZE) send();
    if (!flushTO) flushTO = setTimeout(send, FLUSH_MS);
  }

  function send(){
    if (!q.length) return;
    var payload = q.splice(0, q.length);
    clearTimeout(flushTO); flushTO=null;

    // Prefer sendBeacon so events survive page unload
    if (navigator.sendBeacon) {
      try {
        var ok = navigator.sendBeacon(ENDPOINT, new Blob([JSON.stringify(payload)], {type:'application/json'}));
        if (ok) return;
      } catch(e){}
    }
    // Fallback to fetch/jQuery
    if (window.fetch) {
      fetch(ENDPOINT, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)})
        .catch(function(){});
    } else {
      $.ajax({url: ENDPOINT, method:'POST', data: JSON.stringify(payload), contentType:'application/json'})
        .fail(function(){});
    }
  }

  // ========= EVENTS =========

  // 1) Pageview (once)
  pushEvent($.extend({event_type:'pageview', extra:{referrer: document.referrer || null}}, baseCtx()));

  // 2) Anchor clicks — record link_text + link_href (also selector and position)
  $(document).on('click', 'a', function(e){
    var $a = $(this);
    var txt = $a.text().trim().replace(/\s+/g,' ').slice(0,256);
    var href = $a.attr('href') || null;
    var posX = (e.clientX || 0) / window.innerWidth;
    var posY = (e.clientY || 0) / window.innerHeight;

    pushEvent($.extend({
      event_type: 'click',
      target_tag: 'a',
      link_text: txt || null,
      link_href: href,
      target_selector: cssPath(this),
      pos_x: posX,
      pos_y: posY
    }, baseCtx()));
  });

  // 3) Scroll depth (every +10%)
  /*
  var lastDepth = 0, scrollLock = false;
  $(window).on('scroll', function(){
    if (scrollLock) return;
    scrollLock = true;
    setTimeout(function(){
      scrollLock = false;
      var depth = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100);
      if (depth >= lastDepth + 10) {
        lastDepth = depth;
        pushEvent($.extend({event_type:'scroll', extra:{depth_pct:depth}}, baseCtx()));
      }
    }, 700);
  });
  */

  // 4) ONE “time on page” event on exit (Option A)
  // We measure duration with high-resolution timer; send once on pagehide / route change.
  var pageStart = performance.now();

  function sendFinalHeartbeat(reason) {
    /*
    try {
      var duration = Math.max(0, performance.now() - pageStart); // ms
      pushEvent(Object.assign({
        event_type: 'heartbeat',
        extra: { duration_ms: Math.round(duration), reason: reason || 'pagehide' }
      }, baseCtx()));
      // Force immediate flush (best effort)
      send();
    } catch(e){}
     */
  }

  // Fire when user leaves / hides the page
  window.addEventListener('pagehide', function(){ sendFinalHeartbeat('pagehide'); });

  // If your site is an SPA, also send on history changes and reset the timer
  (function patchHistory(){
    ['pushState','replaceState'].forEach(function(fn){
      var orig = history[fn];
      history[fn] = function(){
        sendFinalHeartbeat('route-change');
        pageStart = performance.now(); // reset for the new virtual page
        return orig.apply(this, arguments);
      };
    });
    window.addEventListener('popstate', function(){
      sendFinalHeartbeat('popstate');
      pageStart = performance.now();
    });
  })();

  // 5) Safety: also try to flush on visibility changes (just in case)
  document.addEventListener('visibilitychange', function(){
    if (document.visibilityState === 'hidden') send();
  });


  //---------------------------
  // --- 1) immediate, unload-safe sender (no batching)
  function sendNow(events) {
    try {
      var payload = JSON.stringify(Array.isArray(events) ? events : [events]);
      if (navigator.sendBeacon) {
        var ok = navigator.sendBeacon(ENDPOINT, new Blob([payload], {type: 'application/json'}));
        if (ok) return;
      }
      if (window.fetch) {
        // keepalive lets fetch continue during navigation in modern browsers
        fetch(ENDPOINT, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: payload,
          keepalive: true
        });
      } else {
        // last resort: synchronous XHR (avoid unless absolutely needed)
        var xhr = new XMLHttpRequest();
        xhr.open('POST', ENDPOINT, false); // sync
        xhr.setRequestHeader('Content-Type','application/json');
        try { xhr.send(payload); } catch(e) {}
      }
    } catch(e) {}
  }

/*
  // --- 2) capture *all* form submits before navigation (user-triggered)
  // use capture so we run before other handlers can redirect
  window.addEventListener('submit', function (ev) {
    var form = ev.target;
    if (!form || form.nodeName !== 'FORM') return;

    // Build event NOW (no batching)
    var $form = window.jQuery ? jQuery(form) : null;
    var formAction = (form.getAttribute('action') || location.href);
    var formId = form.id || null;
    var formClass = form.getAttribute('class') || null;

    // Only non-PII field names; customize as needed
    var fields = [];
    var els = form.querySelectorAll('input, select, textarea');
    for (var i=0; i<els.length; i++) {
      var name = els[i].getAttribute('name');
      if (!name) continue;
      var lower = name.toLowerCase();
      // skip sensitive names
      if (lower.includes('password') || lower.includes('pass') || lower.includes('email')) continue;
      fields.push(name);
    }

    var evt = Object.assign({
      event_type: 'form_submit',
      target_tag: 'form',
      target_selector: (typeof cssPath === 'function') ? cssPath(form) : null,
      extra: {
        form_action: formAction,
        form_id: formId,
        form_class: formClass,
        field_names: fields
      }
    }, baseCtx());

    sendNow(evt); // fire immediately so we don't lose it
    // Do NOT preventDefault; let the form continue normally
  }, true); // <-- capture=true

  // --- 3) catch programmatic submissions: form.submit()
  // Some libs call form.submit() directly, which skips 'submit' event
  (function patchNativeSubmit(){
    var NativeSubmit = HTMLFormElement.prototype.submit;
    HTMLFormElement.prototype.submit = function () {
      try {
        var form = this;
        var formAction = (form.getAttribute('action') || location.href);
        var fields = [];
        var els = form.querySelectorAll('input, select, textarea');
        for (var i=0; i<els.length; i++) {
          var name = els[i].getAttribute('name');
          if (!name) continue;
          var lower = name.toLowerCase();
          if (lower.includes('password') || lower.includes('pass') || lower.includes('email')) continue;
          fields.push(name);
        }
        var evt = Object.assign({
          event_type: 'form_submit',
          target_tag: 'form',
          target_selector: (typeof cssPath === 'function') ? cssPath(form) : null,
          extra: {
            form_action: formAction,
            programmatic: true,
            field_names: fields
          }
        }, baseCtx());
        sendNow(evt);
      } catch(e) {}
      return NativeSubmit.apply(this, arguments);
    };
  })();

  // --- 4) (Optional) also catch jQuery.ajax POSTs that submit forms
  if (window.jQuery) {
    (function($){
      var oldAjax = $.ajax;
      $.ajax = function(options){
        try {
          var o = options || {};
          var type = (o.type || o.method || 'GET').toString().toUpperCase();
          if (type === 'POST' && o.url) {
            var keys = [];
            if (o.data) {
              if (typeof o.data === 'string') {
                o.data.replace(/(^|&)([^=]+)=/g, function(_, __, k){ keys.push(decodeURIComponent(k)); return _; });
              } else if (typeof o.data === 'object') {
                keys = Object.keys(o.data);
              }
            }
            sendNow(Object.assign({
              event_type: 'form_submit_ajax',
              extra: { url: o.url, data_keys: keys.slice(0, 50) }
            }, baseCtx()));
          }
        } catch(e){}
        return oldAjax.apply(this, arguments);
      };
    })(jQuery);
  }
  */

  // expose useful helpers globally
window.baseCtx = baseCtx;
window.pushTrackerEvent = pushEvent;   // optional: if you want to manually push custom events
window.sendTrackerNow = sendNow;       // optional
  //-------------------------------
})();