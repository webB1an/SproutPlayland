# 小芽智趣岛 / Sprout Playland

面向 2～5 岁儿童的横屏微信益智小游戏，使用 Cocos Creator 3.8.8 与 TypeScript 开发。项目坚持“大触控区域、无倒计时、无失败惩罚、即时反馈、短局体验”的低龄设计原则。

当前版本包含五种玩法，并共享同一套恐龙与场景素材：

1. **欢乐拼图**：把完整画面切成 4、9 或 16 块，拖回底板后自动吸附；
2. **擦擦发现**：滑动拨开覆盖画面的云朵，露出完整恐龙场景；
3. **恐龙归位**：把彩色图片拖到对应的淡色目标槽中；
4. **泡泡找找**：根据左侧目标，点破装有同一只恐龙的泡泡；
5. **恐龙翻翻**：翻开 2～4 对卡片，找到相同的恐龙伙伴。

新增四种玩法不维护独立关卡美术，而是直接读取 `PUZZLE_ARTWORKS`。增加一张拼图源图后，它会同时成为擦擦发现、恐龙归位、泡泡找找和恐龙翻翻的可用关卡。

## 开发环境

- Cocos Creator 3.8.8
- TypeScript
- 微信开发者工具 2.02.2607161
- 设计分辨率：1334 × 750
- 屏幕方向：横屏

## 本地启动

1. 启动 Cocos Creator 3.8.8；
2. 在项目管理器中打开项目目录；
3. 在资源管理器中双击 `assets/scenes/Main.scene`；
4. 按 `Ctrl + P` 或点击顶部预览按钮；
5. 默认浏览器预览地址为 `http://localhost:7456/`。

该地址依赖 Cocos 的本地预览服务，关闭编辑器或停止预览后无法访问。

## 代码结构

业务代码位于 `assets/scripts/`：

```text
assets/scripts/
├─ app/
│  ├─ App.ts                         # 应用根节点、拼图流程和通用 UI 工具
│  ├─ GameRegistry.ts                # 首页游戏注册表、配色和文案
│  ├─ MiniGameProgressStore.ts       # 四种小游戏共用的本地星级进度
│  ├─ MiniGameShared.ts              # 关卡难度、素材轮转、拖拽归位和完成奖励
│  ├─ GameCompletionModal.ts         # 全游戏共用的完成弹窗（星星、彩纸、按钮编排）
│  ├─ ui/
│  │  └─ UiTheme.ts                  # UI 设计 token（颜色、圆角、字号、阴影）
│  └─ pages/
│     ├─ HomePage.ts                 # 五游戏首页
│     ├─ ArtworkGameSelectPage.ts    # 四种小游戏共用选关页
│     ├─ ScratchGamePage.ts          # 擦擦发现
│     ├─ ShadowGamePage.ts           # 恐龙归位
│     ├─ BubbleGamePage.ts           # 泡泡找找
│     └─ MemoryGamePage.ts           # 恐龙翻翻
└─ games/
   └─ puzzle/
      ├─ PuzzleConfig.ts             # 所有关卡图片与默认选项
      ├─ PuzzleTypes.ts              # 拼图共享类型
      ├─ PuzzleGeometry.ts           # 拼齿、圆角和边缘路径
      ├─ PuzzleDepthRenderer.ts      # 2.5D 厚度和侧壁材质
      └─ PuzzleInteractionController.ts
```

首页游戏入口由 `GAME_CARDS` 配置生成。新增首页玩法时，不应继续在 `HomePage.ts` 中堆叠独立页面流程；应增加注册项，并建立独立页面或控制器。

## 共享关卡素材

美术资源位于：

```text
assets/resources/art
├─ common/home/             # 首页插画
├─ common/ui-generated/     # 通用按钮与 UI 资源
└─ games/puzzle/            # 拼图源图、缩略图与拼图 UI
```

所有内置关卡统一配置在：

```text
assets/scripts/games/puzzle/PuzzleConfig.ts
```

每一项关卡至少包含：

```ts
{
  id: 'dino-tyrannosaurus',
  title: '霸王龙',
  thumbnailFrame: 'dino-tyrannosaurus',
  sourceFrame: 'dino-tyrannosaurus',
  fallbackColor: new Color(...),
}
```

四种新增玩法只读取这些字段，不需要额外制作“擦除版、泡泡版、翻牌版或目标版”图片。

### 选关缩略图与原图按需加载

`dino-art` 资源包分为两级：

- `thumbnails/` 保存 256 × 256 的选关缩略图；
- `dinosaurs/` 与资源包根目录保存游戏使用的完整原图。

进入选关页时只调用 `loadDir('thumbnails')`，不会同时下载并解码所有 1254 × 1254 原图。拼图和擦擦发现开始关卡时才加载当前原图，切换关卡后释放上一张原图；泡泡、归位和翻牌由于展示尺寸较小，直接复用缩略图。

原图发生变化后，可以重新生成全部缩略图：

```powershell
.\tools\generate-game-thumbnails.ps1
```

缩略图生成后仍需运行 `prepare-remote-assets.ps1`，将更新后的 Bundle 整理到 `deploy/remote`。

选关与难度统一采用两步流程：先选择画面，再进入大尺寸难度设置页。拼图在同一设置页额外选择拼块数量与外轮廓。明确以“恐龙”为目标的配对、泡泡和翻牌玩法只读取 `dino-` 素材；擦擦发现仍可使用完整场景图。

## 各玩法实现

### 欢乐拼图

- 保留原图宽高比，以正方形拼图区域居中 `cover` 裁切；
- 从同一标准化画面生成 4、9 或 16 个拼块；
- 支持常规、六边形和圆形外轮廓；
- 拖动时自动置顶、轻微倾斜，靠近正确位置后吸附；
- 外圈与中央拼块使用同一张图，完成后像素连续。

### 擦擦发现

- 图片上覆盖 49 个重叠的程序化云朵节点；
- 手指经过时云朵缩小并淡出；
- 擦除达到 70% 后自动揭开剩余部分；
- 不依赖 RenderTexture 或自定义 Shader，优先保证微信真机兼容性。

### 恐龙归位

- 根据关卡位置自动生成 1、2 或 3 组目标；
- 彩色卡片与淡色目标使用同一素材，内容不会错配；
- 共用 `DragMatchController`，支持拾起、目标聚焦、吸附、错误回位和边界限制；
- 后续物品整理或喂食玩法可以继续复用该控制器。

### 泡泡找找

- 每关连续寻找 3 个目标；
- 难度逐渐增加到 4、5 或 6 个泡泡；
- 泡泡漂浮、按压、错误摇晃和爆开粒子均由代码生成；
- 无倒计时、无扣分、无红叉。

### 恐龙翻翻

- 难度分别为 2、3、4 对卡片；
- 使用水平缩放完成翻牌，不需要额外的卡背精灵表；
- 配对成功后保持翻开，错误组合短暂停留后柔和翻回；
- 不记录失败次数。

## 进度与奖励

新增小游戏使用：

```text
sprout-playland:mini-game-progress:v1
```

按“玩法 id + 关卡素材 id”保存最高星级。所有小游戏共用同一套完成弹窗、星星动画、彩纸粒子、重玩、下一关和返回按钮。

原拼图进度仍使用独立存储键，不受影响。

## 微信自定义照片

微信选图适配层将本地图片转换为 `SpriteFrame` 后，可调用：

```ts
SproutPlaylandApp.useCustomPuzzlePhoto(frame, title)
```

该入口只更新当前拼图预览与切块源，不修改首页插画。自定义照片目前只进入拼图，不写入四种内置关卡列表。

拼图选择页的“相册 +”图形卡片可以直接选择微信相册照片。小游戏会优先请求压缩图，并在当前基础库支持时将图片长边限制在 1536 像素左右，减少手机和 Pad 上的纹理内存压力。

微信端会把最近一张压缩后的自定义照片复制到 `wx.env.USER_DATA_PATH`，并在拼图选择页显示为独立照片卡片；下次打开小游戏仍可继续使用。新照片保存成功后会删除旧照片，不会上传服务器。用户清理微信缓存或卸载后本地照片可能丢失。浏览器预览仍使用本地文件选择器，只在当前会话保留。

## 日常开发与调试

1. 保存代码或资源；
2. 等待 Cocos 完成脚本编译和资源导入；
3. 回到浏览器按 `Ctrl + F5`；
4. 重点测试横屏布局、触摸范围、返回流程和完成弹窗；
5. 查看浏览器 Console 是否有错误。

如果仍显示旧代码：

1. 回到 Cocos Creator；
2. 按一次 `Ctrl + P` 停止预览；
3. 再按一次 `Ctrl + P` 重新编译；
4. 必要时在新页面再次按 `Ctrl + F5`。

不要直接修改以下自动生成目录：

```text
temp/
library/
build/
```

## 微信小游戏构建

1. 在浏览器预览中确认五个入口和主要交互正常；
2. 打开“项目 → 构建发布”；
3. 平台选择“微信小游戏”；
4. 确认横屏与 1334 × 750 设计分辨率；
5. 构建目录使用 `build/wechatgame`；
6. 使用微信开发者工具导入该目录；
7. 真机检查安全区、触摸手感、首次资源加载、内存和不同屏幕比例。

第一阶段不使用登录、网络服务、广告、支付或第三方统计 SDK。

## 远程资源自动部署

`.github/workflows/deploy-remote-assets.yml` 会在 `main` 分支每次推送后：

1. 使用 GitHub 托管的 `ubuntu-latest` Runner；
2. 校验仓库中准备好的 `dino-art` 与 `resources` 远程包；
3. 通过 SSH 增量部署到：

```text
/www/wwwroot/sprout-playland-assets.wdbzk.com/remote
```

远端部署采用内容哈希文件增量合并，不删除旧版本资源，保证旧预览二维码仍可读取其对应资源。该流程只部署服务器资源，不上传或发布微信小游戏版本。

### 日常更新流程

每次修改代码或资源、准备推送前，在项目根目录运行：

```powershell
.\tools\prepare-remote-assets.ps1
```

该命令会调用本机 Cocos Creator 构建微信小游戏，并把服务器所需内容整理到 `deploy/remote`。完整操作顺序为：

```powershell
.\tools\prepare-remote-assets.ps1
git add -A
git commit -m "更新游戏内容"
git push origin main
```

推送完成后，GitHub Actions 会自动把 `deploy/remote` 上传到服务器。它只负责部署服务器资源，不会上传或发布微信小游戏版本，也不需要安装 Windows 自托管 Runner。

如果刚刚已经完成过 Cocos 构建，只想重新整理现有构建产物，可以运行：

```powershell
.\tools\prepare-remote-assets.ps1 -SkipBuild
```

### 首次部署配置

当前仓库使用以下服务器配置：

```text
资源域名：https://sprout-playland-assets.wdbzk.com/
服务器目录：/www/wwwroot/sprout-playland-assets.wdbzk.com/remote
SSH 主机：121.40.201.86
SSH 端口：22
SSH 用户：root
```

首次为新仓库或新服务器启用时，需要在 GitHub 仓库中完成以下配置：

1. 在 `Settings → Secrets and variables → Actions` 添加：
   - `DEPLOY_HOST`：服务器地址，本项目为 `121.40.201.86`；
   - `DEPLOY_PORT`：SSH 端口，本项目为 `22`；
   - `DEPLOY_USER`：拥有资源站目录写权限的 SSH 用户，本项目为 `root`；
   - `DEPLOY_SSH_KEY`：对应用户的 SSH 私钥全文；
2. 将对应公钥加入服务器用户的 `~/.ssh/authorized_keys`。

设置 `DEPLOY_SSH_KEY` 时必须保留 OpenSSH 私钥的完整换行和头尾标记。推荐直接从私钥文件读取，不要先经过可能改变编码或换行的 PowerShell 文本管道：

```powershell
cmd /d /c "gh secret set DEPLOY_SSH_KEY --repo webB1an/SproutPlayland < C:\path\to\deploy-key"
```

如果 Actions 日志出现以下错误，通常说明 Secret 中的私钥格式已经损坏，应按上述方式重新写入：

```text
Load key "...": error in libcrypto
Permission denied (publickey,...)
```

部署成功时，Actions 日志会显示：

```text
Remote assets deployed to /www/wwwroot/sprout-playland-assets.wdbzk.com/remote
```

也可以在 GitHub Actions 页面手动运行 `Deploy remote game assets`。
