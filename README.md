# dsh-client-ui-file-attach

DeepSeek Harness Web 插件：**把本地文件加进会话上下文**，并提供「📎 添加文件」入口与可删除、可横向滚动的文件名芯片条。

## 功能

**UI（与输入框同款胶囊样式）**
- 输入框底部工具条新增「📎 添加文件」胶囊按钮——与「访问模式 / Plan / 模型」等控件同一行（`conversation.input.left` 座位）。
- 添加文件后，**输入框上方的芯片条**（`conversation.input.dock` 座位）**居中、左对齐输入框**；每个胶囊 **左侧有 ✕**，点击即删除。
- 文件累积超过输入框宽度时**出现横向滚动条**，可左右滚动查看所有已添加文件（单行、不换行）。
- 芯片条独立于输入框布局（位于卡片上方），**不影响输入框尺寸与文本**；为空时整条隐藏。
- **文件添加上限 10 个**（单个文本 ≤ 256 KB），超出给出 Toast 提示。

**核心：文件内容加入上下文**
- 文本/代码/Markdown/JSON/日志（UTF-8）添加后，内容由宿主端在 `agent/pre-step` 注入模型上下文：每次发送消息，模型都会看到附加文件的内容，无需粘贴进输入框、无需模型额外调用 read。
- 图片（PNG/JPG/WebP/GIF）走 DSH 内置图片附件管线（图片芯片栏 + 真实图片消息块）。
- 二进制/超大/不可读文件不添加，Toast 说明原因。

## 安装（bundle 一键安装）

```sh
dsh plugin --profile web add dsh-client-ui-file-attach
```

bundle 的 `cordis.patch.yml` 会自动注册 UI 行，无需手改任何配置文件；重启 `dsh web` 后刷新浏览器即可。

> 本地开发安装（从源码目录）：
> ```sh
> dsh plugin --profile web add "file:<本仓库绝对路径>"
> ```
> 并把 `~/.dsh/profiles/web/cordis.patch.yml` 里已有的 `ui-file-attach` 行删掉，避免与 bundle patch 重复。

## 结构

```
package.json          dsh.bundle.patch + dsh.client 声明 + exports["./client"]
cordis.patch.yml      bundle patch：注册 ui-file-attach 行（一键安装即激活）
lib/index.js          宿主端：/attach-files 命令（recordInput:false）+ agent/pre-step 上下文注入
lib/client.js         浏览器端 bundle：添加按钮 + 文件名芯片条 + 图片管线 + 宿主同步
```

## 发布到 DSH 插件市场

1. **发布 npm**（推荐，市场一般用包名安装）：
   ```sh
   npm publish
   ```
2. **或托管 GitHub**：把本目录内容推到一个 GitHub 仓库，市场/用户可通过
   `dsh plugin --profile web add "github:<user>/<repo>"` 安装（本包已预构建，无需 prepare 脚本）。
3. 在插件市场仓库（如 [dsh-market/dsh-market](https://github.com/dsh-market/dsh-market)、
   [2BingLing/dsh-market](https://github.com/2BingLing/dsh-market)、
   [chnjames/dsh-plugin-market](https://github.com/chnjames/dsh-plugin-market)）提交收录 PR/issue，
   附上本 README 与本包名/仓库地址。

## 限制

- 文本文件需为 UTF-8；UTF-16 / 含 NUL 字节的文件按二进制处理，不添加。
- 单文件内容上限 256 KB、总上限 1 MiB、同时最多 10 个文件（客户端与宿主端双重校验）。
- 附件列表为浏览器会话级（与未发送的草稿图片一致）；页面刷新或服务重启后需重新添加。
- 文件内容只在每次发送时注入模型上下文，不会写入聊天历史（避免污染记录）。
# dsh_plugin_file_attach
