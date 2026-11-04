/*
 * The 12-day easter egg gate.
 *
 * A lucky day is only ever visible when today's settled outcome is 吉: a 忌 day
 * never mentions that a lucky day existed, so the surprise cannot turn into a
 * second let-down. Which censer was picked plays no part — both lead to the
 * same day outcome.
 */
F.easterEgg = (function () {
  function isLuckyDay(date) {
    return F.luckyDays.isLucky(F.util.dateKey(date));
  }

  function active(date, outcome) {
    return outcome === 'good' && isLuckyDay(date);
  }

  /* 「今天没有忌，只有宜」现在做成卷轴上的朱红印章，不再参与抽句 */
  var SEAL_LINE = '今天没有忌，只有宜。';

  function lines(date) {
    var key = F.util.dateKey(date);
    var pool = F.copy.easter.filter(function (line) {
      return line !== SEAL_LINE;
    });
    var first = F.util.pickIndex(key, 'easter:a', pool.length);
    var second = F.util.pickIndex(key, 'easter:b', pool.length);
    if (second === first) second = (second + 1) % pool.length;

    var chosen = [pool[first], pool[second]];
    if (F.util.pickIndex(key, 'easter:c', 2) === 0) {
      var third = F.util.pickIndex(key, 'easter:c2', pool.length);
      if (chosen.indexOf(pool[third]) < 0) chosen.push(pool[third]);
    }
    return chosen;
  }

  return { isLuckyDay: isLuckyDay, active: active, lines: lines };
})();
