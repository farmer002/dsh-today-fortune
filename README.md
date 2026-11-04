# 今日运势 · dsh-today-fortune

DSH 界面右下角的一座卡通小庙。点一下，进庙选一个香炉，看今天宜什么、忌什么。

- 悬浮球 = 一座庙：飞檐屋顶、朱红墙身、一扇透暖光的小门、门口一盏会摇的灯笼。
- 可拖动、松手贴边吸附、位移 < 4px 算点击、点击后自动朝另一侧展开面板、Esc 关闭、刷新后记住位置。
- 面板里是庙堂内景与供桌，桌上两个香炉、各插三根香，**不标吉忌、事先无任何暗示**。
  点哪一个都一样：香火点燃、烧短、青烟与金光升起（约 0.7 秒）。
- 随后掉下一根竹签（吉＝「上上签 / 大吉」，忌＝「下下签 / 避雷」），签上只有签文、没有细节。
  点一下竹签，翻转淡出，才展开详细结果卡片——把「解签」这一步留给人自己去揭。
- 当天是吉还是忌由日期决定：`hash32(YYYY-MM-DD) % 2`。两个香炉触发的是同一个结果，
  所以「选左还是选右」只是仪式，不能改命，也泄不了底。
- 结果卡片：工作 / 生活 / 学习三行，外加一个当天固定的数字（吉＝幸运数字，忌＝避雷数字）。
- 底部「保存分享图」用 HTML5 Canvas 画一张 720×1180 竖版长图（小庙 logo、日期、吉忌徽章、
  三行文案、幸运/避雷数字、`来自 DSH 今日运势`），并直接触发下载。
- 同一天内容固定，以 `YYYY-MM-DD` 为缓存键，跨日自动失效。
- **早晚皮肤**：本地 07:00–18:59 是白天原色；19:00–06:59 自动切成夜间——小庙整体压暗、
  门内暖光变成更暖的橘光、圆顶上方浮出三颗微闪的小金星，面板同步换成深色配色。
  跨点不用刷新，30 秒轮询一次自动切换。
- **连续进庙**：每次展开面板打卡一次，连续 3 天香炉换成一根金边高香，连续 7 天青烟更浓
  （多几条升腾的烟）。结果卡片底部显示「已连续进庙 X 天」。

## 打卡与皮肤

- 打卡记录存在 localStorage 的 `dsh-today-fortune:v2:streak`，形如 `{ "days": 5, "last": "2026-11-04" }`。
- 历史最高单独存顶层键 `fortune-max-streak`（便于直接在控制台查看/重置），只有破纪录才写。
- 判定按本地日历日差 `diffDays = 今天 - last`：
  - `0`（今天已打过）→ 不变
  - `1`（昨天打过）→ +1
  - `2`（只断了昨天）→ 按"中断不超过两天"继续，+1
  - `>= 3`（前天和昨天都没去）→ 断签超过两天，清零重来
- 香炉三档，按 streak 切换（DOM 上是 `state-level-N`），三档是同一件器物的逐级升级：
  - `1` → 粗陶小圆炉 + 三根细红香（一缕淡青烟）
  - `2` → 青铜三足双耳鼎（带铜锈与反光）+ 三根暗红高香（三缕烟、亮火星）
  - `>= 3` → 鎏金三足大鼎（錾刻回纹/云纹、镜面高光、底部金晕）+ 三根御制高香（金色仙气）
- 结果页底部两行：`已连续进庙 X 天`、`🏆 历史最高：连续进庙 X 天`。
- 本地日期键（不是 UTC），日切与跨年、跨月都按本机日历计算。
- 控制台会打印两条面包屑：
  - 挂载/模式变化时：`[dsh-today-fortune] 时间模式：夜间（19:00-06:59），本地 21 点；连续进庙 4 天；历史最高 9 天`
  - 每次展开面板时：`[dsh-today-fortune] 夜间… | 连续进庙 4 天（今日新打卡，上次记录 3 天，间隔 1 天） | 历史最高 9 天 | 香炉 state-level-3`

## 安装

### 一句话安装

在 DSH 里对 Agent 说：

> 帮我安装 dsh-today-fortune

它会自动从 npm 拉取最新版。也可以自己在 Plugins 页面手动填包名 `dsh-today-fortune`。

### 从 npm 安装（推荐）

```bash
dsh plugin --profile web add dsh-today-fortune
```

也可以走 `plugin_manager`：

```
plugin_manager({ action: "install_bundle", target: "dsh-today-fortune" })
```

国内网络会自动回退到 npmmirror（DSH 插件管理器内置 `fallbackRegistries`）。
npm 包只含运行必需文件（约 150KB），安装即用，**不需要** `pnpm install`、不需要构建、没有 install 脚本。

### 从 GitHub 安装（源码版，备用）

```bash
dsh plugin --profile web add github:farmer002/dsh-today-fortune
```

仓库里同样提交了构建好的 `lib/client.js`。注意 GitHub 在某些网络环境下不可直连。

### 从本地目录安装（开发用）

已经安装过的 profile 会直接加载。全新安装：

```
plugin_manager({ action: "install_bundle", target: "E:\\AI AGENT\\AI WORK\\dsh-today-fortune" })
```

安装后刷新页面即可看到右下角的小庙。它是 `shell.overlay` 上的一个独立入口
（id `dsh-today-fortune-orb`，order 60），不会替换或遮挡任何官方 UI。

> ⚠️ 不要拿 GitHub 上的 `.zip` 直接安装：DSH 认的是 **npm 包**、**git 地址**和 **npm tarball**，
> `.zip` 不是 pnpm 能装的包格式。`.zip` 只适合下载解压后，用上面「本地目录」的方式装。

## 彩蛋

全年随机 12 天会触发「超级幸运日」彩蛋，抽中吉时整页变成金色氛围页。

## 数据从哪来

`lunar-javascript@1.7.7`（MIT，见 `vendor/LICENSE-lunar-javascript`）取当日黄历：
`Solar.fromDate(new Date()).getLunar()` → 宜、忌、建除十二神、干支、值日星宿、冲煞。
不联网、不请求任何接口。

> 关于「取数逻辑放 client 半」：DSH 的浏览器模块表只认 baseline（react 等），
> npm 依赖无法在 client 半被 `require`。所以 `vendor/lunar.js` 在**构建时**
> 被内联进 `lib/client.js` 的 factory 闭包，运行时仍是纯客户端计算，
> 既不依赖 Host，也没有网络请求。

## 目录

```
dsh-today-fortune/
├── package.json          # dsh.bundle + dsh.client(platform: web)
├── cordis.patch.yml      # 插入 today-fortune 这一行
├── index.js              # Host 半：空实现（无需服务、工具或配置）
├── lib/client.js         # 构建产物（勿手改）
├── src/
│   ├── util.js           # 确定性哈希 / PRNG / 日期键
│   ├── almanac.js        # lunar-javascript 取数 + 当日缓存
│   ├── mapper.js         # 黄历 → 三场景文案 + 幸运/避雷数字
│   ├── copy.js           # 文案池（吉/忌 × 三场景各 22–25 条，含 31 条极客/办公梗）
│   ├── luckyDays.js      # 12 个「大宜日」的确定性生成
│   ├── easterEgg.js      # 彩蛋判定与氛围文案
│   ├── anim.js           # 时长与全部 CSS keyframes
│   ├── store.js          # 同日缓存 + 位置记忆（localStorage）
│   ├── share.js          # Canvas 竖版分享长图（720×1180）与下载
│   ├── view.js           # 悬浮球 / 供桌 / 竹签 / 结果卡 / 彩蛋页
│   └── app.js            # 拖动、贴边、点击判定、Esc、面板状态机
├── assets/               # SVG 素材（构建时内联）
├── vendor/lunar.js       # 内联用的 lunar-javascript 源码
├── build.mjs             # 打包成 lib/client.js
├── icon.svg
└── locale/{zh,en}.json
```

## 重新构建

```bash
node build.mjs          # 写入 lib/client.js
node --check lib/client.js   # 语法检查（复制成 .cjs 再检，避免 ESM 严格模式误报）
```

改完源码后重新构建，再刷新页面即可（浏览器按 artefact 修订号重新取 bundle）。

## 说明

- 文案与数字都是本地确定性生成的，**图个乐，不作为决策依据**。
- 忌的文案只吐槽日常小事，不涉及健康、财务或人际风险暗示。
- 彩蛋页文案池 10 句，按日期确定性取 2–3 句，同日固定。

## 发布（维护者）

```bash
# 1) 改 package.json 的 version
# 2) npm 网站生成一次性令牌（Access Tokens → Granular，勾 Bypass 2FA，权限 Read and write）
# 3) 写入【用户级】.npmrc —— 项目级 .npmrc 里的令牌会被 pnpm 忽略
echo '//registry.npmjs.org/:_authToken=npm_xxx' > "$env:USERPROFILE\.npmrc"
# 4) 发布
pnpm publish --no-git-checks --access public
# 5) 立刻删除 .npmrc 和令牌
```

首次发布会先出现 `0.0.0-stage` 占位版本，`dist-tags.latest` 要等几分钟才指向真实版本，属正常现象。
