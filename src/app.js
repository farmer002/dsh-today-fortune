/* The overlay entry: draggable temple orb, panel state machine, censer timing. */
F.app = (function () {
  var React = F.React;
  var h = F.h;
  var SIZE = 68;

  function clamp(value, lo, hi) {
    return Math.max(lo, Math.min(hi, value));
  }

  function isNight(hour) {
    return hour < 7 || hour >= 19;
  }

  function modeLabel() {
    var hour = new Date().getHours();
    return isNight(hour)
      ? '夜间（19:00-06:59），本地 ' + hour + ' 点'
      : '白天（07:00-18:59），本地 ' + hour + ' 点';
  }

  function clockNow() {
    var hour = new Date().getHours();
    return { hour: hour, night: isNight(hour) };
  }

  function App() {
    var rootRef = React.useRef(null);
    var layerRef = React.useRef(null);
    var timersRef = React.useRef([]);
    var dragRef = React.useRef(null);
    var posRef = React.useRef(null);

    var posState = React.useState(null);
    var pos = posState[0];
    var setPos = posState[1];

    var sizeState = React.useState({ w: 0, h: 0 });
    var size = sizeState[0];
    var setSize = sizeState[1];

    var openState = React.useState(false);
    var open = openState[0];
    var setOpen = openState[1];

    var stageState = React.useState('choose');
    var stage = stageState[0];
    var setStage = stageState[1];

    var phaseState = React.useState('idle');
    var phase = phaseState[0];
    var setPhase = phaseState[1];

    var pickState = React.useState(null);
    var pick = pickState[0];
    var setPick = pickState[1];

    var payloadState = React.useState(null);
    var payload = payloadState[0];
    var setPayload = payloadState[1];

    var slipState = React.useState('idle');
    var slip = slipState[0];
    var setSlip = slipState[1];

    var clockState = React.useState(clockNow);
    var clock = clockState[0];
    var setClock = clockState[1];

    var streakState = React.useState(0);
    var streak = streakState[0];
    var setStreak = streakState[1];

    var maxState = React.useState(0);
    var maxStreak = maxState[0];
    var setMaxStreak = maxState[1];

    var dragState = React.useState(false);
    var dragging = dragState[0];
    var setDragging = dragState[1];

    function applyPos(next) {
      posRef.current = next;
      setPos(next);
    }

    function schedule(fn, ms) {
      var id = window.setTimeout(fn, ms);
      timersRef.current.push(id);
      return id;
    }

    function clearTimers() {
      for (var i = 0; i < timersRef.current.length; i++) window.clearTimeout(timersRef.current[i]);
      timersRef.current = [];
    }

    /* Measure the frame-wide overlay layer this entry lives in. */
    React.useEffect(function () {
      function measure() {
        var el = rootRef.current;
        if (!el) return;
        var layer = el.offsetParent || el.parentElement;
        layerRef.current = layer;
        var rect = layer ? layer.getBoundingClientRect() : null;
        var w = rect && rect.width > 0 ? rect.width : window.innerWidth;
        var h = rect && rect.height > 0 ? rect.height : window.innerHeight;
        setSize({ w: w, h: h });
      }

      measure();
      var raf = window.requestAnimationFrame(measure);
      window.addEventListener('resize', measure);
      return function () {
        window.cancelAnimationFrame(raf);
        window.removeEventListener('resize', measure);
      };
    }, []);

    /* Restore the remembered anchor once the layer has a size. */
    React.useEffect(function () {
      if (!size.w || posRef.current) return;
      var saved = F.store.position();
      var maxY = Math.max(16, size.h - SIZE - 16);
      var maxX = Math.max(16, size.w - SIZE - 16);
      applyPos({
        x: saved.side === 'left' ? 22 : maxX,
        y: clamp(saved.yRatio * Math.max(0, size.h - SIZE), 16, maxY),
      });
    }, [size.w, size.h]);

    /* Never leave a timer running after unmount. */
    React.useEffect(function () {
      return function () {
        clearTimers();
      };
    }, []);

    /* Local clock: the skin flips at 07:00 / 19:00 without a reload. */
    React.useEffect(function () {
      function tick() {
        setClock(clockNow());
      }
      tick();
      var id = window.setInterval(tick, 30000);
      return function () {
        window.clearInterval(id);
      };
    }, []);

    /* Console breadcrumb for testing the time skin and the streak. */
    React.useEffect(function () {
      if (!window.console) return;
      window.console.log(
        '[dsh-today-fortune] 时间模式：' +
          modeLabel() +
          '，本地 ' +
          clock.hour +
          ' 点；连续进庙 ' +
          streak +
          ' 天；历史最高 ' +
          maxStreak +
          ' 天'
      );
    }, [clock.night, clock.hour, streak, maxStreak]);

    /* Escape and outside press close the panel. */
    React.useEffect(function () {
      if (!open) return;

      function onKey(event) {
        if (event.key === 'Escape' || event.key === 'Esc') {
          event.stopPropagation();
          setOpen(false);
        }
      }

      function onDown(event) {
        var root = rootRef.current;
        if (root && event.target instanceof Node && !root.contains(event.target)) setOpen(false);
      }

      document.addEventListener('keydown', onKey, true);
      document.addEventListener('pointerdown', onDown, true);
      return function () {
        document.removeEventListener('keydown', onKey, true);
        document.removeEventListener('pointerdown', onDown, true);
      };
    }, [open]);

    function openPanel() {
      var now = new Date();
      var data = F.store.day(now);
      var check = F.store.checkIn(now);
      setStreak(check.days);
      setMaxStreak(check.max);
      if (window.console) {
        window.console.log(
          '[dsh-today-fortune] ' +
            modeLabel() +
            ' | 连续进庙 ' +
            check.days +
            ' 天（' +
            (check.isNew ? '今日新打卡' : '今日已打过') +
            '，上次记录 ' +
            check.previous +
            ' 天，间隔 ' +
            check.diff +
            ' 天' +
            (check.reset ? '，已按断签超过两天重置' : '') +
            '） | 历史最高 ' +
            check.max +
            ' 天 | 香炉 state-level-' +
            (check.days >= 3 ? 3 : check.days >= 2 ? 2 : 1)
        );
      }
      clearTimers();
      setPayload(data);
      setPick(null);
      setPhase('idle');
      setSlip('idle');
      setStage('choose');
      setOpen(true);
    }

    function closePanel() {
      clearTimers();
      setOpen(false);
      setPhase('idle');
      setSlip('idle');
      setStage('choose');
    }

    function togglePanel() {
      if (open) closePanel();
      else openPanel();
    }

    function choose(side) {
      if (phase !== 'idle' || !payload) return;
      setPick(side);
      setPhase('light');

      schedule(function () {
        setPhase('burn');
      }, F.anim.timings.light);

      schedule(function () {
        setSlip('idle');
        setPhase('idle');
        setStage('slip');
      }, F.anim.timings.light + F.anim.timings.burn);
    }

    function openSlip() {
      if (slip !== 'idle' || !payload) return;
      setSlip('open');
      schedule(function () {
        var today = new Date();
        setStage(F.easterEgg.active(today, payload.outcome) ? 'easter' : 'result');
        setSlip('idle');
      }, F.anim.timings.flip);
    }

    function censerState(side) {
      if (!pick) return '';
      if (pick !== side) return phase === 'light' ? '' : 'is-dim';
      if (phase === 'light') return 'is-light';
      if (phase === 'burn') return 'is-light is-burn';
      return '';
    }

    function current() {
      return posRef.current || pos;
    }

    function onPointerDown(event) {
      if (event.button !== undefined && event.button !== 0) return;
      var layer = layerRef.current;
      var here = current();
      if (!layer || !here) return;
      var rect = layer.getBoundingClientRect();
      dragRef.current = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: here.x,
        originY: here.y,
        rect: rect,
        moved: false,
      };
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch (err) {
        /* not all pointer sources support capture */
      }
      setDragging(true);
    }

    function onPointerMove(event) {
      var drag = dragRef.current;
      if (!drag || drag.id !== event.pointerId) return;
      var dx = event.clientX - drag.startX;
      var dy = event.clientY - drag.startY;
      if (!drag.moved) {
        if (dx * dx + dy * dy < 16) return;
        drag.moved = true;
      }
      applyPos({
        x: clamp(drag.originX + dx, 8, Math.max(8, drag.rect.width - SIZE - 8)),
        y: clamp(drag.originY + dy, 8, Math.max(8, drag.rect.height - SIZE - 8)),
      });
    }

    function onPointerUp(event) {
      var drag = dragRef.current;
      if (!drag || drag.id !== event.pointerId) return;
      dragRef.current = null;
      setDragging(false);

      if (!drag.moved) {
        togglePanel();
        return;
      }

      var here = current() || { x: 0, y: 0 };
      var maxX = Math.max(8, drag.rect.width - SIZE - 8);
      var maxY = Math.max(8, drag.rect.height - SIZE - 8);
      var side = here.x + SIZE / 2 < drag.rect.width / 2 ? 'left' : 'right';
      var snapped = { x: side === 'left' ? 22 : maxX, y: clamp(here.y, 8, maxY) };
      applyPos(snapped);
      F.store.savePosition({
        side: side,
        yRatio: maxY > 8 ? snapped.y / maxY : 0,
      });
    }

    var here = current();
    var side = here && size.w ? (here.x + SIZE / 2 < size.w / 2 ? 'left' : 'right') : 'right';
    var rootClass =
      'tf-root' +
      (dragging ? ' is-dragging' : '') +
      (open ? ' is-open' : '') +
      (side === 'left' ? ' is-left' : '') +
      (clock.night ? ' is-night' : '');

    var panelStyle = {};
    panelStyle[side === 'right' ? 'right' : 'left'] = SIZE + 10;
    if (here && here.y < 250) panelStyle.top = 0;
    else panelStyle.bottom = 0;

    var body = null;
    if (open && payload) {
      if (stage === 'easter') {
        body = h(F.view.EasterPage, { payload: payload, date: new Date() });
      } else if (stage === 'slip') {
        body = h(F.view.Slip, {
          outcome: payload.outcome,
          state: slip,
          onOpen: openSlip,
        });
      } else if (stage === 'result' && pick) {
        body = h(F.view.ResultCard, {
          payload: payload,
          outcome: payload.outcome,
          streak: streak,
          maxStreak: maxStreak,
          onAgain: function () {
            clearTimers();
            setStage('choose');
            setPick(null);
            setPhase('idle');
            setSlip('idle');
          },
        });
      } else {
        body = h(F.view.Scene, {
          censerState: censerState,
          locked: phase !== 'idle',
          streak: streak,
          onPick: choose,
        });
      }
    }

    return h(
      'div',
      {
        ref: rootRef,
        className: rootClass,
        style: {
          left: (here ? here.x : 0) + 'px',
          top: (here ? here.y : 0) + 'px',
          opacity: here ? 1 : 0,
        },
      },
      h('style', { dangerouslySetInnerHTML: { __html: F.anim.css } }),
      h(
        'button',
        {
          type: 'button',
          className: 'tf-orb',
          'aria-label': '今日运势',
          'aria-expanded': open ? 'true' : 'false',
          onPointerDown: onPointerDown,
          onPointerMove: onPointerMove,
          onPointerUp: onPointerUp,
          onPointerCancel: onPointerUp,
        },
        h(F.view.OrbArt)
      ),
      open && payload
        ? h(
            'div',
            {
              className: 'tf-panel' + (clock.night ? ' is-night' : ''),
              style: panelStyle,
              role: 'dialog',
              'aria-label': '今日运势',
            },
            h(
              'button',
              { type: 'button', className: 'tf-close', 'aria-label': '关闭', onClick: closePanel },
              '×'
            ),
            body
          )
        : null
    );
  }

  return { App: App };
})();
