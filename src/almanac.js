/* Reads today's almanac from the bundled lunar-javascript source. No network. */
F.almanac = (function () {
  var cache = {};

  function fallback(key) {
    return {
      key: key,
      lunarText: '',
      week: '',
      yearGZ: '',
      monthGZ: '',
      dayGZ: '',
      zhiXing: '',
      xiu: '',
      naYin: '',
      chong: '',
      sha: '',
      solarTerm: '',
      yi: [],
      ji: [],
      ok: false,
    };
  }

  function read(date) {
    var key = F.util.dateKey(date);
    if (cache[key]) return cache[key];

    var result;
    try {
      var solar = F.Lunar.Solar.fromDate(date);
      var lunar = solar.getLunar();
      result = {
        key: key,
        solarText: solar.toYmd(),
        lunarText: lunar.getMonthInChinese() + '月' + lunar.getDayInChinese(),
        week: '周' + lunar.getWeekInChinese(),
        yearGZ: lunar.getYearInGanZhi(),
        monthGZ: lunar.getMonthInGanZhi(),
        dayGZ: lunar.getDayInGanZhi(),
        zhiXing: lunar.getZhiXing(),
        xiu: lunar.getXiu() + '宿',
        naYin: lunar.getDayNaYin(),
        chong: lunar.getDayChongDesc(),
        sha: lunar.getDaySha(),
        solarTerm: lunar.getJieQi() || '',
        yi: (lunar.getDayYi() || []).slice(0, 12),
        ji: (lunar.getDayJi() || []).slice(0, 12),
        ok: true,
      };
    } catch (err) {
      result = fallback(key);
      result.error = String((err && err.message) || err);
    }

    cache[key] = result;
    return result;
  }

  return { read: read };
})();
