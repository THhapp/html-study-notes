# html-study-notes

让 Agent 将课件、手写记录或已有笔记整理成准确、连贯、可独立阅读的单 HTML 学习笔记。

核心工作包括：剖析原始材料、整理知识与阅读顺序、设计 HTML 表达、编排为阅读友好的笔记。正文提供完整定义、条件和解释，图解呈现结构、对应与变化；例子帮助理解一般知识。

默认采用纯白底色、浅色控件和右侧篇内目录，核心阅读不依赖网络或其他文件。页面直接讲知识，避免制作说明和自评质量的套话。默认约定可按任务调整，不要求特定操作系统或笔记软件。

## 查看与使用

Agent 入口是 [SKILL.md](SKILL.md)。将仓库放在 Agent 可读取的位置，按所用工具的 skill 加载方式使用；也可以直接要求 Agent 阅读入口文件。提供原始材料、输出位置和需要保留的个人记录，例如：

```text
请阅读本仓库的 SKILL.md，将所附材料整理成按主题组织的 HTML 学习笔记。
输出到我指定的目录，原始材料保持不变。保留课堂重点、个人理解与原疑问，
结合课件补足准确的一般知识，并用合适的图解解释关系与过程。
```

可直接打开 [信息副本与投影](assets/reference-note.html) 或 [有向图与可达性](assets/reachability-note.html) 查看示例，无需 Python、服务器或网络。示例使用原创构造数据，可随时更新，具体笔记按当前材料和阅读需要设计。

## 项目结构

开发资源按职责分开维护，读者交付物仍只有一个 HTML。组件是可选工具，不要求每篇使用所有形式：

| 资源 | 用途 |
| --- | --- |
| `references/design-system.md` | 阅读层级、定义／重点／注意／疑问等统一编排 |
| `references/agent-workflow.md` | 材料覆盖、状态建模、分阶段制作与验收 |
| `references/visualization-patterns.md` | 按知识关系选择图表，避免装饰性互动 |
| `references/single-file-contract.md` | 离线、自包含、无脚本阅读与打印边界 |
| `references/components.md` | 示例复用、组件接口与状态约束 |
| `references/research-notes.md` | 研究来源、采纳理由与核查日期 |
| `assets/note.css`、`assets/note.js` | 原创基础样式、联动选择和步骤控制器 |
| `assets/diagrams.js` | 可选的实测曲线连线与对象位置追踪 |
| `assets/note-shell.html` | 打包用页面骨架 |
| `examples/` | 完整示例的正文和领域逻辑 |
| `scripts/` | 可选的标准库打包器与静态检查器 |

## 开发与验证

直接编写单 HTML 即可使用本 skill。以下工具用于维护与验证，不是笔记阅读依赖。命令从仓库根目录执行；Python 工具需要 Python 3.10+，仅使用标准库。

重新构建示例：

```sh
python scripts/build_note.py --title "信息副本与投影" --content examples/representation-content.html --script assets/diagrams.js --script examples/representation.js --output assets/reference-note.html --overwrite
python scripts/build_note.py --title "有向图与可达性" --content examples/reachability-content.html --script examples/reachability.js --output assets/reachability-note.html --overwrite
```

打包器默认拒绝覆盖已有文件，重建时明确加 `--overwrite`。它只处理可信源码，不提供沙箱或 HTML 消毒。

运行静态检查和 Python 回归：

```sh
python scripts/audit_note.py assets/reference-note.html
python scripts/audit_note.py assets/reachability-note.html
python -m unittest discover -s tests -p "test_*.py"
```

可选的浏览器回归需要 Node.js、Playwright 及其 Chromium 浏览器。已有兼容环境可直接使用；在没有项目依赖的环境中可先安装测试工具：

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node tests/representation-check.cjs
node tests/browser-check.cjs
```

`BROWSER_EXECUTABLE` 可指定兼容的 Chromium 浏览器可执行文件；若复用其他目录中的 Playwright，可通过 `NODE_PATH` 提供模块查找路径。截图和报告默认写入系统临时目录，可用 `NOTE_QA_DIR` 指定输出位置。两组浏览器回归分别检查信息副本／投影示例和图论示例的领域数据、交互、布局、离线阅读及打印状态。

静态检查与示例回归只能提供部分证据，不能替代实际材料的知识核对，也不代表完整无障碍评估或特定宿主软件的嵌入适配。具体边界见 [单文件约定](references/single-file-contract.md)。

## 发布与许可

原创代码与文档统一采用 [MIT](LICENSE)。外部参考及未来引入素材的边界见 [来源与许可](THIRD_PARTY_NOTICES.md)。公开包以通用原创示例替代私有课堂材料，不附带课件和个人批注。
