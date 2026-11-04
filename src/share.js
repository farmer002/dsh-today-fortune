/*
 * Renders the day's result as a vertical share image with HTML5 Canvas.
 * Everything is drawn locally: no network, no third-party renderer.
 */
F.share = (function () {
  var W = 720;
  var H = 1180;

  function loadImage(svg) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        resolve(img);
      };
      img.onerror = function () {
        reject(new Error('svg image failed to load'));
      };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }

  function paint(svg, color) {
    return String(svg).replace(/currentColor/g, color);
  }

  function roundRect(ctx, x, y, w, h, r) {
    var radius = Math.min(r, h / 2, w / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function wrap(ctx, text, maxWidth, maxLines) {
    var chars = String(text).split('');
    var lines = [];
    var line = '';
    for (var i = 0; i < chars.length; i++) {
      var next = line + chars[i];
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = chars[i];
        if (lines.length === maxLines - 1) {
          line = chars.slice(i).join('');
          break;
        }
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    if (lines.length > maxLines) lines.length = maxLines;
    return lines;
  }

  function draw(ctx, payload, outcome, imgs) {
    var good = outcome === 'good';
    var alm = payload.alm;
    var ink = good ? '#B4762C' : '#5D7186';

    ctx.fillStyle = '#FFF7E8';
    ctx.fillRect(0, 0, W, H);

    var top = ctx.createLinearGradient(0, 0, 0, 380);
    top.addColorStop(0, good ? '#FFF0C9' : '#EAF0F6');
    top.addColorStop(1, '#FFF7E8');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, W, 380);

    roundRect(ctx, 22, 22, W - 44, H - 44, 44);
    ctx.strokeStyle = '#EBC79E';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.drawImage(imgs.logo, W / 2 - 78, 58, 156, 156);

    var dateText = [alm.solarText || payload.key, alm.lunarText, alm.zhiXing ? alm.zhiXing + '日' : '']
      .filter(Boolean)
      .join('  ·  ');
    ctx.fillStyle = '#B48B62';
    ctx.font = '500 25px "PingFang SC","Microsoft YaHei",system-ui,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(dateText, W / 2, 268);

    roundRect(ctx, W / 2 - 92, 296, 184, 66, 24);
    var badge = ctx.createLinearGradient(0, 296, 0, 362);
    badge.addColorStop(0, good ? '#FFC24B' : '#A9BCD0');
    badge.addColorStop(1, good ? '#EF8F2E' : '#7C93AB');
    ctx.fillStyle = badge;
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 38px "PingFang SC","Microsoft YaHei",system-ui,sans-serif';
    ctx.fillText(good ? '吉' : '忌', W / 2, 344);

    ctx.fillStyle = '#9B6A3E';
    ctx.font = '500 27px "PingFang SC","Microsoft YaHei",system-ui,sans-serif';
    var title = good ? payload.mood || '今天手气不错，适合往前走一小步' : '今天不太顺，慢一点也算赢';
    ctx.fillText(title, W / 2, 412);

    var icons = [imgs.work, imgs.life, imgs.study];
    var y = 450;
    for (var i = 0; i < payload.scenes.length; i++) {
      var scene = payload.scenes[i];
      var rowY = y + i * 148;

      roundRect(ctx, 40, rowY, 640, 136, 28);
      ctx.fillStyle = 'rgba(255,255,255,0.78)';
      ctx.fill();
      ctx.strokeStyle = '#F0DCC0';
      ctx.lineWidth = 3;
      ctx.stroke();

      roundRect(ctx, 68, rowY + 44, 52, 52, 16);
      ctx.fillStyle = good ? '#FFEBCB' : '#E7EEF6';
      ctx.fill();
      ctx.drawImage(icons[i], 76, rowY + 52, 36, 36);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#B48B62';
      ctx.font = '500 20px "PingFang SC","Microsoft YaHei",system-ui,sans-serif';
      ctx.fillText(scene.label, 138, rowY + 48);

      ctx.fillStyle = '#4E3018';
      ctx.font = '500 27px "PingFang SC","Microsoft YaHei",system-ui,sans-serif';
      var lines = wrap(ctx, good ? scene.good : scene.bad, 508, 2);
      for (var j = 0; j < lines.length; j++) {
        ctx.fillText(lines[j], 138, rowY + 88 + j * 38);
      }
    }

    var boxY = 894;
    roundRect(ctx, 40, boxY, 640, 210, 30);
    ctx.fillStyle = good ? '#FFF1C9' : '#EEF3F9';
    ctx.fill();
    ctx.setLineDash([11, 9]);
    ctx.strokeStyle = good ? '#EFB95A' : '#9FB0C4';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.textAlign = 'center';
    ctx.fillStyle = good ? '#A9773F' : '#64788C';
    ctx.font = '600 22px "PingFang SC","Microsoft YaHei",system-ui,sans-serif';
    ctx.fillText(good ? '今日幸运数字' : '今日避雷数字', W / 2, boxY + 46);

    ctx.fillStyle = good ? '#E08A28' : '#6E8398';
    ctx.font = '800 92px "PingFang SC","Microsoft YaHei",system-ui,sans-serif';
    ctx.fillText(String(good ? payload.luckyNumber : payload.avoidNumber), W / 2, boxY + 142);

    if (!good) {
      ctx.fillStyle = '#64788C';
      ctx.font = '500 20px "PingFang SC","Microsoft YaHei",system-ui,sans-serif';
      ctx.fillText(payload.avoidNote, W / 2, boxY + 182);
    } else {
      ctx.fillStyle = '#A9773F';
      ctx.font = '500 20px "PingFang SC","Microsoft YaHei",system-ui,sans-serif';
      ctx.fillText('宜多看一眼这个数字', W / 2, boxY + 182);
    }

    ctx.fillStyle = '#C3A588';
    ctx.font = '500 22px "PingFang SC","Microsoft YaHei",system-ui,sans-serif';
    ctx.fillText('来自 DSH 今日运势 · ' + payload.key, W / 2, 1148);

    ctx.fillStyle = ink;
  }

  function render(payload, outcome) {
    var good = outcome === 'good';
    var ink = good ? '#B4762C' : '#5D7186';
    return Promise.all([
      loadImage(F.art.orbTemple),
      loadImage(paint(F.art.work, ink)),
      loadImage(paint(F.art.life, ink)),
      loadImage(paint(F.art.study, ink)),
    ]).then(function (images) {
      var canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      var ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas 2d context unavailable');
      draw(ctx, payload, outcome, {
        logo: images[0],
        work: images[1],
        life: images[2],
        study: images[3],
      });
      return canvas;
    });
  }

  function save(payload, outcome) {
    return render(payload, outcome).then(function (canvas) {
      var url = canvas.toDataURL('image/png');
      var a = document.createElement('a');
      a.href = url;
      a.download = 'dsh-today-fortune-' + payload.key + '.png';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        a.remove();
      }, 0);
      return url;
    });
  }

  return { render: render, save: save };
})();
