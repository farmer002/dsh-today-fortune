/* Deterministic helpers shared by the almanac, the copy mapper and the easter egg. */
F.util = (function () {
  function hash32(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pad2(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function dateKey(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  /* Stable index into a pool for a given (day, salt) pair. */
  function pickIndex(seedStr, salt, len) {
    if (!len) return 0;
    var rnd = mulberry32(hash32(seedStr + '|' + salt))();
    return Math.min(len - 1, Math.floor(rnd * len));
  }

  function pick(list, seedStr, salt) {
    return list[pickIndex(seedStr, salt, list.length)];
  }

  return {
    hash32: hash32,
    mulberry32: mulberry32,
    pad2: pad2,
    dateKey: dateKey,
    pickIndex: pickIndex,
    pick: pick,
  };
})();
