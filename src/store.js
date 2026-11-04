/* Same-day cache plus the remembered orb anchor. Everything degrades silently. */
F.store = (function () {
  var PREFIX = 'dsh-today-fortune:v2:';

  function read(key) {
    try {
      return window.localStorage.getItem(PREFIX + key);
    } catch (err) {
      return null;
    }
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(PREFIX + key, value);
    } catch (err) {
      /* private mode or a blocked origin: the computation is deterministic anyway */
    }
  }

  function readJson(key) {
    var raw = read(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  function day(date) {
    var key = F.util.dateKey(date);
    var cached = readJson('day:' + key);
    if (cached && cached.scenes) return cached;
    var payload = F.mapper.build(date);
    write('day:' + key, JSON.stringify(payload));
    return payload;
  }

  function position() {
    var saved = readJson('pos');
    if (saved && (saved.side === 'left' || saved.side === 'right') && typeof saved.yRatio === 'number') {
      return saved;
    }
    return { side: 'right', yRatio: 0.62 };
  }

  function savePosition(next) {
    write('pos', JSON.stringify(next));
  }

  /*
   * 历史最高连续天数，按约定单独存成顶层键 fortune-max-streak（不带命名空间前缀），
   * 方便直接在控制台查看 / 重置。
   */
  var MAX_KEY = 'fortune-max-streak';

  function rawRead(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  }

  function rawWrite(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      /* ignore */
    }
  }

  /*
   * 连续进庙打卡.
   *
   * diffDays = 今天 - 上次打卡（本地日历日差）:
   *   0  → 今天已经打过，数字不变
   *   1  → 昨天打过，+1
   *   2  → 前天打过（只断了昨天一天），按"中断不超过两天"继续，+1
   *  >=3 → 前天和昨天都没去，断签超过两天，清零重来
   *
   * 历史最高存在独立的 fortune-max-streak 键里，只有刷新纪录才写。
   */
  function dayDiff(lastKey, now) {    var parts = String(lastKey || '').split('-');
    if (parts.length !== 3) return Number.POSITIVE_INFINITY;
    var past = Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    var today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    var diff = Math.round((today - past) / 86400000);
    return Number.isFinite(diff) ? diff : Number.POSITIVE_INFINITY;
  }

  function checkIn(now) {
    var today = F.util.dateKey(now);
    var saved = readJson('streak') || {};
    var days = Number(saved.days) || 0;
    var last = typeof saved.last === 'string' ? saved.last : '';
    var diff = last ? dayDiff(last, now) : Number.POSITIVE_INFINITY;
    var next;

    if (!last) {
      next = 1;
    } else if (diff === 0) {
      next = days > 0 ? days : 1;
    } else if (diff >= 3) {
      next = 1;
    } else {
      next = Math.max(1, days) + 1;
    }

    write('streak', JSON.stringify({ days: next, last: today }));

    var max = Number(rawRead(MAX_KEY)) || 0;
    if (next > max) {
      max = next;
      rawWrite(MAX_KEY, String(max));
    }

    return {
      days: next,
      max: max,
      isNew: last !== today,
      last: today,
      previous: days,
      diff: Number.isFinite(diff) ? diff : -1,
      reset: Boolean(last) && diff >= 3,
    };
  }

  return {
    day: day,
    position: position,
    savePosition: savePosition,
    checkIn: checkIn,
  };
})();
