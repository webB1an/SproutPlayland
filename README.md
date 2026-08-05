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
