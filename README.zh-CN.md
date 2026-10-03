<div align="center">

# CC-Usage-Band

**额度、上下文、缓存命中率，在输入框上方一眼看清。**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](./LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-2.1.287%2B-d97757?style=flat-square)](https://claude.com/claude-code)
[![Type: mod](https://img.shields.io/badge/type-mod-6f7be0?style=flat-square)](https://claude.com/blog/claude-code-mods)
![Surfaces](https://img.shields.io/badge/surfaces-terminal%20%7C%20desktop-5cc4d6?style=flat-square)

[English](./README.md) · 简体中文

<img src="docs/images/hero.png" alt="usage-band 在 Claude Code 桌面端（上）和终端（下）的效果" width="760">

</div>

---

`usage-band` 是一个 [Claude Code 模组（mod）](https://claude.com/blog/claude-code-mods)。它在输入框上方显示一行状态，包含工作时最值得留意的四个数据。终端和桌面端各有一套专门的布局，每一轮对话结束后自动更新，平时安静地待着，只在需要注意时才变红提醒你。

## 目录

- [功能](#功能)
- [使用要求](#使用要求)
- [安装](#安装)
- [设置](#设置)
- [数据说明](#数据说明)
- [终端兼容性](#终端兼容性)
- [隐私与权限](#隐私与权限)
- [开发](#开发)
- [截图](#截图)
- [许可证](#许可证)

## 功能

| 指标 | 显示内容 |
| --- | --- |
| **5h** 额度 | 5 小时滚动额度已用了多少，以及还有多久重置 |
| **7d** 额度 | 7 天额度的用量和重置时间 |
| **上下文窗口**（图层图标） | 当前上下文占用的 token 数和模型窗口大小，例如 `398K/1M` |
| **缓存命中率**（靶心图标） | 上一轮输入中有多少由提示缓存提供 |

- **一眼看清**：每项数据都有自己的颜色。只有在需要注意时才会变红：额度或上下文超过 80%，或者缓存命中率低于 50%。
- **有动感但不打扰**：额度进度条上有一道缓慢的扫光，所有进度条同步移动。
- **两端原生适配**：
  - 终端里是一行字符，图标可以用 Nerd Font 或普通 Unicode 字符，并且会根据窗口宽度自动调整显示的内容。
  - 桌面端是一行居中的 SVG 图形，额度用进度条显示，上下文用 2×10 的点阵灯显示，并且支持浅色和深色模式。
- **轻量**：不读文件、不运行程序、不联网，只读取 Claude Code 本来就有的用量数据。

## 使用要求

- Claude Code **2.1.287 或更新版本**（模组功能是从这个版本开始提供的），终端和桌面端的 Code 页都可以用。
- 5h 和 7d 额度只有订阅账号才有数据。没有订阅时，这一行只显示上下文和缓存命中率。

## 安装

在 Claude Code 里依次运行：

```
/plugin marketplace add JetsonChan/CC-Usage-Band
/plugin install usage-band@cc-usage-band
```

新开一个会话，输入框上方就会出现这一行。额度数据要等会话里第一次回复返回后才会显示。

如果只想在一个会话里临时试用，可以从本地克隆后加载：

```bash
git clone https://github.com/JetsonChan/CC-Usage-Band.git
claude --plugin-dir CC-Usage-Band/usage-band
```

**更新**

```
/plugin marketplace update cc-usage-band
```

**卸载**

```
/plugin uninstall usage-band@cc-usage-band
```

## 设置

| 选项 | 可选值 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `icons` | `auto` · `nerd` · `unicode` · `ascii` | `auto` | 终端里使用的图标。`auto` 在自带 Nerd Font 图标的 Ghostty 里用 Nerd Font 图标，在其他终端里用普通 Unicode 字符。如果你的终端字体是 Nerd Font，可以选 `nerd`；很老旧的终端可以选 `ascii`。桌面端的图标是自己画的，不受这个选项影响。 |

可以在 `/plugin` 里配置 `usage-band`，或者在终端会话里用 `/config` 修改。

## 数据说明

| 指标 | 数据来源 | 说明 |
| --- | --- | --- |
| 5h / 7d | Claude Code 从每次 API 响应中读到的额度窗口 | 四舍五入到整数百分比，重置倒计时每分钟更新一次。 |
| 上下文 | 最后一次请求的输入总量：未缓存部分 + 缓存读取 + 缓存写入 | 按当前模型的窗口大小计算，1M 和 200K 的模型都能正确显示。桌面端每个点代表窗口的 5%，先点亮上排，再点亮下排。 |
| 缓存命中率 | 上一轮的 `缓存读取 / (未缓存输入 + 缓存读取 + 缓存写入)` | 把这一轮里所有请求加总后计算，不包括子代理的轮次。 |

## 终端兼容性

| 终端 | `auto` 下的图标 | 颜色 |
| --- | --- | --- |
| Ghostty | Nerd Font（自带） | 真彩色 |
| iTerm2、WezTerm、kitty、Warp | Unicode（`≡` `●`） | 真彩色 |
| macOS 自带终端 | Unicode | 256 色，自动换算 |
| 其他终端 | Unicode | 按终端支持的颜色显示 |

如果图标显示成方框，把 `icons` 改成 `unicode` 就行。可以运行 `/usage-band-preview`，在你自己的终端里对比所有样式。

## 隐私与权限

模组运行时的权限和 Claude Code 本身一样，没有沙箱隔离。所以这里列出这个模组会接触的全部内容：

- **读取**：会话的用量数据（`session.measure`、`turn.complete`、`$.session.usage`），以及环境变量 `TERM_PROGRAM`
- **注册**：一个命令 `/usage-band-preview`
- **绘制**：输入框上方的这一行

它不读写文件、不运行程序、不联网，也不会把任何数据发送到任何地方。整个模组只有一个文件：[`usage-band/hooks/register.tsx`](./usage-band/hooks/register.tsx)。

## 开发

```
.
├── .claude-plugin/marketplace.json   # cc-usage-band 插件市场
└── usage-band/
    ├── .claude-plugin/plugin.json    # 插件信息和 icons 选项
    ├── hooks/register.tsx            # 模组代码
    ├── types/index.d.ts              # 状态类型定义
    └── tests/band.test.ts
```

```bash
cd usage-band
claude plugin validate .
claude plugin test .
```

修改时用 `claude --plugin-dir ./usage-band` 加载，文件一保存，会话就会自动重新加载。

欢迎提交 Issue 和 Pull Request。

## 截图

**桌面端，浅色模式**：5h 额度已超过 80%，所以变成了红色。

<img src="docs/images/desktop-light.png" alt="usage-band 在桌面端的浅色模式效果" width="760">

**桌面端，深色模式**

<img src="docs/images/desktop-dark.png" alt="usage-band 在桌面端的深色模式效果" width="760">

**终端**（Ghostty）：宽度不够时会先去掉进度条，再去掉重置时间。运行 `/usage-band-preview` 可以并排对比所有终端样式。

<img src="docs/images/terminal.png" alt="usage-band 在终端里的效果" width="760">

## 许可证

[MIT](./LICENSE) © Jetson Chan
