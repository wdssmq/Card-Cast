# CARD CAST · 轮播名片生成器

输入 GitHub、知乎、哔哩哔哩等社交主页信息，生成一张**会自动轮播 tab 的 GIF 名片**——每个 tab 就是一个站点的展示令牌（平台图标 + 用户名 + ID 链接）。

## 使用

```bash
pnpm install
pnpm dev      # http://localhost:5173
```

1. 左侧填写基本信息（名字 / 身份 / 城市 / 邮箱 / 网站，可上传头像）；
2. 在「站点令牌」里添加平台：用户名只用于展示（可留空，此时标题回退为 `@ID`），ID 用于生成主页链接，也可以直接粘贴主页链接自动提取；
3. 右侧画布实时预览：tab 自动切换，也可以点击画布上的 tab 停在某个站点；
4. 调整每个站点的停留时长与导出宽度，点击「下载 GIF」。

所有编辑内容自动保存在浏览器 localStorage，「恢复示例」可重置。

## 数据与站点

```
src/data/
  ├─ user.ts        预置用户资料 + 用户自己的站点（PRESET_PROFILE / PRESET_SITES）
  ├─ sites.ts       createSite(platform, uid, username) 工厂
  ├─ index.ts       defaultData() 与平台查询的汇总出口
  └─ platforms/     可用站点清单，每个站点一个目录
      ├─ index.ts   登记表（PLATFORMS / getPlatform / identityOf）
      └─ site-<id>/
          ├─ index.ts   品牌色、链接模板、字段文案
          └─ icon.svg    独立图标（可选，没有则用 icon.text 文字图标）
```

新增站点 = 建一个 `site-xxx/` 目录（可带 `icon.svg`）+ 在 `platforms/index.ts` 登记一行。

## 技术要点

- **Solid + Vite**，零额外运行时依赖；
- 网页预览与 GIF 导出共用同一套 **Canvas 渲染器**（`src/lib/draw.ts`），所见即所得；
- GIF 编码为纯 TS 实现（`src/lib/gif.ts`）：中位切分量化出 256 色全局调色板 + LZW 编码 + NETSCAPE 循环扩展；
- 导出时过渡段按 ~10fps 采样，静态停留只保留单帧长延迟，控制文件体积；
- 站点图标是 `site-<id>/icon.svg`，由 `src/lib/icon.ts` 解析 `path` 后用 Path2D 绘制（根节点 `fill="none"` 视为线框，`stroke-width` 控制线粗）。

## 构建

```bash
pnpm build    # tsc -b && vite build
```
