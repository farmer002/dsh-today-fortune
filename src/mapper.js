/* Turns the raw almanac into the one rendered day payload. */
F.mapper = (function () {
  function build(date) {
    var alm = F.almanac.read(date);
    var key = alm.key;
    var u = F.util;
    var copy = F.copy;

    var luckyNumber = (u.hash32(key + '|lucky') % 49) + 1;
    var avoidNumber = (u.hash32(key + '|avoid') % 49) + 1;
    if (avoidNumber === luckyNumber) {
      avoidNumber = (avoidNumber % 49) + 1;
    }

    var note = copy.avoidNotes[u.pickIndex(key, 'avoid-note', copy.avoidNotes.length)];
    var avoidNote = note.replace(/\{n\}/g, String(avoidNumber));

    /*
     * The blind box: today's outcome is settled by the date alone. Both censers
     * lead to this value, so which one you pick cannot leak or change it.
     */
    var outcome = u.hash32(key + '|outcome') % 2 === 0 ? 'good' : 'bad';

    var scenes = copy.sceneLabels.map(function (scene) {
      return {
        key: scene.key,
        label: scene.label,
        icon: scene.icon,
        good: u.pick(copy.good[scene.key], key, 'good:' + scene.key),
        bad: u.pick(copy.bad[scene.key], key, 'bad:' + scene.key),
      };
    });

    return {
      key: key,
      alm: alm,
      outcome: outcome,
      mood: copy.dayMood[alm.zhiXing] || '',
      scenes: scenes,
      luckyNumber: luckyNumber,
      avoidNumber: avoidNumber,
      avoidNote: avoidNote,
      yiChips: alm.yi.slice(0, 4),
      jiChips: alm.ji.slice(0, 3),
    };
  }

  return { build: build };
})();
