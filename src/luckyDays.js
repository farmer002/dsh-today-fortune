/*
 * The 12 "大宜日" of a year.
 *
 * Deterministic by construction: a single seeded PRNG fed only with the year
 * number, one draw inside each of twelve equal day-of-year buckets. The same
 * year therefore yields the same twelve dates on every device, and the next
 * year simply draws a different batch. Leap years get a 366-day span, so a
 * February 29 can be drawn instead of shifting the whole tail.
 */
F.luckyDays = (function () {
  var perYear = {};

  function daysInYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365;
  }

  function dateFromDayOfYear(year, offset) {
    var d = new Date(year, 0, 1);
    d.setDate(1 + offset);
    return d;
  }

  function draw(year) {
    var total = daysInYear(year);
    var rnd = F.util.mulberry32(F.util.hash32('dsh-today-fortune:' + year));
    var days = [];
    var bucket = total / 12;

    for (var i = 0; i < 12; i++) {
      var lo = Math.floor(i * bucket);
      var hi = Math.floor((i + 1) * bucket) - 1;
      if (hi < lo) hi = lo;
      var offset = lo + Math.floor(rnd() * (hi - lo + 1));
      days.push(offset);
    }

    return days.map(function (offset) {
      var d = dateFromDayOfYear(year, offset);
      return {
        key: F.util.dateKey(d),
        month: d.getMonth() + 1,
        day: d.getDate(),
        offset: offset,
      };
    });
  }

  function list(year) {
    if (!perYear[year]) perYear[year] = draw(year);
    return perYear[year];
  }

  function isLucky(key) {
    var year = Number(String(key).slice(0, 4));
    if (!year) return false;
    return list(year).some(function (item) {
      return item.key === key;
    });
  }

  return { list: list, isLucky: isLucky, draw: draw };
})();
