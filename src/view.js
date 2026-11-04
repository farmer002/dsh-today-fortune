/* Presentational components shared by the orb and its panel. */
F.view = (function () {
  var h = F.h;

  function art(html, className, extra) {
    var props = { className: className, dangerouslySetInnerHTML: { __html: html } };
    if (extra) {
      for (var k in extra) props[k] = extra[k];
    }
    return h('span', props);
  }

  function OrbArt() {
    return h(
      'span',
      { className: 'tf-orb-sway' },
      h('span', {
        className: 'tf-orb-art',
        dangerouslySetInnerHTML: { __html: F.art.orbTemple },
      }),
      h('span', { className: 'tf-orb-veil' }),
      h('span', { className: 'tf-orb-glow' }),
      h('span', { className: 'tf-orb-stars' }, h('i'), h('i'), h('i'))
    );
  }

  /* 1 = 粗陶小炉 + 细香，2 = 青铜双耳鼎 + 粗香，3 = 鎏金大鼎 + 御制高香 */
  function censerLevel(streak) {
    if (streak >= 3) return 3;
    if (streak >= 2) return 2;
    return 1;
  }

  function censerArt(level) {
    if (level >= 3) return F.art.censer3;
    if (level === 2) return F.art.censer2;
    return F.art.censer1;
  }

  function Censer(props) {
    return h(
      'button',
      {
        type: 'button',
        className: 'tf-censer state-level-' + props.level + ' ' + (props.stateClass || ''),
        onClick: props.onClick,
        disabled: props.disabled,
        'aria-label': props.label,
      },
      art(censerArt(props.level), 'tf-censer-art')
    );
  }

  function Scene(props) {
    return h(
      'div',
      { className: 'tf-scene' },
      h('div', { className: 'tf-col left' }),
      h('div', { className: 'tf-col right' }),
      h('div', { className: 'tf-beam' }),
      h('div', { className: 'tf-title' }, '进庙选一选，升档降档问问天'),
      h(
        'div',
        { className: 'tf-censers' },
        h(Censer, {
          label: '点左边的香炉',
          stateClass: props.censerState('left'),
          disabled: props.locked,
          level: censerLevel(props.streak),
          onClick: function () {
            props.onPick('left');
          },
        }),
        h(Censer, {
          label: '点右边的香炉',
          stateClass: props.censerState('right'),
          disabled: props.locked,
          level: censerLevel(props.streak),
          onClick: function () {
            props.onPick('right');
          },
        })
      ),
      h('div', { className: 'tf-table' }),
      h('div', { className: 'tf-table-legs' })
    );
  }

  function Chips(props) {
    var nodes = [];
    props.yi.forEach(function (term, i) {
      nodes.push(h('span', { className: 'tf-chip', key: 'yi' + i }, '宜·' + term));
    });
    props.ji.forEach(function (term, i) {
      nodes.push(h('span', { className: 'tf-chip ji', key: 'ji' + i }, '忌·' + term));
    });
    if (!nodes.length) return null;
    return h('div', { className: 'tf-chips' }, nodes);
  }

  function ResultCard(props) {
    var payload = props.payload;
    var alm = payload.alm;
    var good = props.outcome === 'good';
    var dateLine = [alm.solarText || payload.key, alm.lunarText, alm.zhiXing ? alm.zhiXing + '日' : '']
      .filter(Boolean)
      .join(' · ');

    var rows = payload.scenes.map(function (scene) {
      return h(
        'div',
        { className: 'tf-row' + (good ? '' : ' bad'), key: scene.key },
        h('span', {
          className: 'tf-row-icon',
          dangerouslySetInnerHTML: { __html: F.art[scene.icon] },
        }),
        h(
          'span',
          { className: 'tf-row-body' },
          h('span', { className: 'tf-row-label' }, scene.label),
          h('span', { className: 'tf-row-text' }, good ? scene.good : scene.bad)
        )
      );
    });

    return h(
      'div',
      { className: 'tf-card' },
      h(
        'div',
        { className: 'tf-card-head' },
        h('span', { className: 'tf-badge ' + (good ? 'good' : 'bad') }, good ? '吉' : '忌'),
        h(
          'span',
          { className: 'tf-card-title' },
          good ? (payload.mood || '今天手气不错，适合往前走一小步') : '今天不太顺，慢一点也算赢'
        )
      ),
      h('div', { className: 'tf-date' }, dateLine),
      rows,
      h(
        'div',
        { className: 'tf-number ' + (good ? 'good' : 'bad') },
        h('div', { className: 'tf-number-label' }, good ? '今日幸运数字' : '今日避雷数字'),
        h('div', { className: 'tf-number-value' }, String(good ? payload.luckyNumber : payload.avoidNumber)),
        !good && h('div', { className: 'tf-number-note' }, payload.avoidNote)
      ),
      h(Chips, { yi: payload.yiChips, ji: payload.jiChips }),
      props.streak
        ? h('div', { className: 'tf-streak' }, '已连续进庙 ' + props.streak + ' 天')
        : null,
      props.maxStreak
        ? h(
            'div',
            { className: 'tf-max' },
            h('span', {
              className: 'tf-max-icon',
              dangerouslySetInnerHTML: { __html: F.art.trophy },
            }),
            '历史最高：连续进庙 ' + props.maxStreak + ' 天'
          )
        : null,
      h(
        'div',
        { className: 'tf-foot' },
        h('button', { type: 'button', className: 'tf-again', onClick: props.onAgain }, '回庙里'),
        h(ShareButton, { payload: payload, outcome: props.outcome })
      ),
      h('div', { className: 'tf-tomorrow' }, '明日再来')
    );
  }

  function EasterPage(props) {
    var payload = props.payload;
    var lines = F.easterEgg.lines(props.date);
    var particles = [];
    for (var i = 0; i < 12; i++) {
      particles.push(
        h('i', {
          key: 'p' + i,
          style: {
            left: 4 + i * 8 + '%',
            animationDelay: (i * 0.47).toFixed(2) + 's',
            width: 4 + (i % 4) + 'px',
            height: 4 + (i % 4) + 'px',
          },
        })
      );
    }

    var stars = [];
    for (var s = 0; s < 8; s++) {
      var angle = (s * Math.PI * 2) / 8;
      stars.push(
        h('i', {
          key: 's' + s,
          style: {
            left: (Math.cos(angle) * 58).toFixed(1) + 'px',
            top: (Math.sin(angle) * 44).toFixed(1) + 'px',
            animationDelay: (s * 0.22).toFixed(2) + 's',
            width: 6 + (s % 3) * 2 + 'px',
            height: 6 + (s % 3) * 2 + 'px',
          },
        })
      );
    }

    return h(
      'div',
      { className: 'tf-easter' },
      h('div', { className: 'tf-ess-vignette' }),
      h('div', { className: 'tf-ess-rays' }),
      h('div', { className: 'tf-ess-particles' }, particles),
      h('div', { className: 'tf-ess-title' }, '大宜特宜'),
      h('div', { className: 'tf-ess-sub' }, '【 今日万事皆宜 】'),
      h(
        'div',
        { className: 'tf-ess-scroll' },
        lines.map(function (line, index) {
          return h(
            'div',
            { className: 'tf-ess-line', key: 'l' + index },
            h('span', { className: 'tf-ess-mark' }, '✦'),
            line
          );
        }),
        h(
          'div',
          { className: 'tf-ess-seal' },
          h('span', null, '今天没有忌'),
          h('span', null, '只有宜')
        )
      ),
      h(
        'div',
        { className: 'tf-ess-number' },
        h('span', { className: 'tf-ess-spark' }, stars),
        h('span', { className: 'tf-ess-cap' }, '今日幸运数字'),
        h('span', { className: 'tf-ess-num' }, String(payload.luckyNumber))
      )
    );
  }

  function Slip(props) {
    var good = props.outcome === 'good';
    var pool = good ? F.copy.couplets.good : F.copy.couplets.bad;
    var right = F.util.pick(pool, F.util.dateKey(new Date()), 'couplet');
    return h(
      'div',
      { className: 'tf-slip-wrap' },
      h(
        'div',
        { className: 'tf-slip-row' },
        h('span', { className: 'tf-couplet left' }, F.copy.couplets.left),
        h(
          'button',
          {
            type: 'button',
            className: 'tf-slip' + (props.state === 'open' ? ' is-open' : ''),
            onClick: props.onOpen,
            'aria-label': '解签',
          },
          art(F.art.slip, 'tf-slip-art'),
          h('span', { className: 'tf-slip-text' }, good ? '上上签' : '下下签'),
          h('span', { className: 'tf-slip-sub' }, good ? '大吉' : '避雷')
        ),
        h('span', { className: 'tf-couplet right' }, right)
      ),
      h('div', { className: 'tf-slip-hint' }, '点一下，解签')
    );
  }

  function ShareButton(props) {
    var state = F.React.useState('idle');
    var status = state[0];
    var setStatus = state[1];
    var timer = F.React.useRef(null);

    F.React.useEffect(function () {
      return function () {
        if (timer.current) window.clearTimeout(timer.current);
      };
    }, []);

    function settle(next) {
      setStatus(next);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(function () {
        setStatus('idle');
      }, 1800);
    }

    function onClick() {
      if (status === 'busy') return;
      setStatus('busy');
      F.share.save(props.payload, props.outcome).then(
        function () {
          settle('done');
        },
        function () {
          settle('fail');
        }
      );
    }

    var label =
      status === 'busy'
        ? '生成中…'
        : status === 'done'
          ? '已保存'
          : status === 'fail'
            ? '生成失败'
            : '保存分享图';

    return h(
      'button',
      {
        type: 'button',
        className: 'tf-share',
        onClick: onClick,
        disabled: status === 'busy',
      },
      label
    );
  }

  return {
    OrbArt: OrbArt,
    Scene: Scene,
    Slip: Slip,
    ResultCard: ResultCard,
    EasterPage: EasterPage,
  };
})();
