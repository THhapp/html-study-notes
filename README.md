# html-study-notes

面向 Agent 的可视化讲解与例子制作 skill。将指定知识、数据或过程转成静态图、关系联动、可控动画或 HTML 演示。

项目标识沿用 `html-study-notes`，当前显示名称为“图表与交互可视化”。它不再承担完整课程笔记整理、分篇或正文撰写；主任务负责知识主文，本 skill 专注视觉表达。用于 MD 笔记时，普通解释和静态内容可留在 MD，需要定制展示与操作的部分再制作 HTML。

## 使用

Agent 入口是 [SKILL.md](SKILL.md)。将项目放在 Agent 能读取的位置，按所用工具的方式加载 skill，或直接要求阅读入口。提供要展示的内容、必要数据和输出位置，例如：

```text
使用 $html-study-notes，为这段过程设计图解，让读者看清每一步哪些对象改变、为什么改变。
根据内容选择静态图或交互演示；主文已另行维护，演示只保留必要说明。
输出到指定目录，现有材料保持不变。
```

可直接打开 [信息副本与投影](assets/reference-note.html) 或 [有向图与可达性](assets/reachability-note.html)，无需开发环境或网络。它们保留早期较完整的 HTML 讲解，当前主要用于参考联动、流向、步骤与静态备用表达；其篇幅、目录和样式不是新成果的模板要求。

## 按需复用

| 资源 | 用途 |
| --- | --- |
| [视觉设计](references/design-system.md) | 图形层次、布局、颜色、标签与动效 |
| [制作流程](references/agent-workflow.md) | 从视觉问题建立数据与状态模型，再实现和核对 |
| [图表模式](references/visualization-patterns.md) | 按关系与变化选择表达形式 |
| [组件接口](references/components.md) | 联动选择、连线、对象追踪与步骤控制器 |
| [HTML 交付](references/single-file-contract.md) | 离线、静态备用、打印及现有工具的适用边界 |
| [研究登记](references/research-notes.md) | 历史设计依据与许可来源 |
| `assets/note.css`、`assets/note.js`、`assets/diagrams.js` | 可选的样式、控制器与图解实现 |
| `assets/note-shell.html`、`examples/` | 现有 HTML 示例的骨架、内容与领域逻辑 |
| `scripts/`、`tests/` | 可选打包器、严格静态检查与现有示例回归 |

可以直接编写 SVG、Mermaid 或 HTML，也可只复用局部实现。现有类名、API 和脚本名为兼容已有成果而保留，不要求每次使用整套工具。

## 维护现有 HTML 示例

以下命令从仓库根目录运行，Python 3.10+ 即可；属于旧示例的制作工具，不是读者依赖：

```sh
python scripts/build_note.py --title "信息副本与投影" --content examples/representation-content.html --script assets/diagrams.js --script examples/representation.js --output assets/reference-note.html --overwrite
python scripts/build_note.py --title "有向图与可达性" --content examples/reachability-content.html --script examples/reachability.js --output assets/reachability-note.html --overwrite
```

打包器只组装可信源码，默认拒绝覆盖。它调用严格静态检查器，只接受自包含、纯篇内链接的 HTML；该工具不适用于独立 SVG、Mermaid 或带合法返回链接的页面。按实际交付目标核查，不为通过旧检查器删除有用内容。

修改相关工具或示例后，可按需要执行：

```sh
python scripts/audit_note.py assets/reference-note.html
python scripts/audit_note.py assets/reachability-note.html
python -m unittest discover -s tests -p "test_*.py"
```

现有浏览器回归是 `tests/representation-check.cjs` 和 `tests/browser-check.cjs`，需要 Playwright 及兼容的 Chromium。`NODE_PATH` 可复用已有模块，`BROWSER_EXECUTABLE` 可指定浏览器，`NOTE_QA_DIR` 可指定证据目录。仅修订指令或文档时，无需重复整套浏览器回归。

静态检查不证明模型和计算正确，浏览器测试也不代表特定宿主的嵌入适配。交付时说明实际核对范围。

## 许可

原创代码与文档采用 [MIT](LICENSE)，来源与素材边界见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。公开示例使用原创构造数据，不附私人笔记或课件；工具的 MIT 许可不改变用户材料的权利归属。
