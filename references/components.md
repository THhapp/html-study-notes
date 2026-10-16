# 组件与复用接口

本包提供小型原生实现，不是通用图表框架。基础视觉在 `assets/note.css`；选择与步骤在 `assets/note.js`；可选连线与对象移动在 `assets/diagrams.js`。主要用法见 `examples/representation-content.html` 和 `examples/representation.js`，另有 reachability 示例。复用时读取有关局部，别将整篇样稿当作空模板后遗留知识数据。

## 按需复用示例

示例提供一种可行实现，会随时更新；它不定义其他笔记必须继承的版式、图表或验收项目。先确定当前知识需要解释什么，再选取有关机制：多个表示可考虑联动，一对多去向可考虑流向图，操作过程可考虑状态变化。适合直接陈述的内容使用文字或静态图。

复用时重新核对领域数据、前提和计算，清除示例题材、占位文字和讨论标注，按阅读需要调整布局、颜色及控件。以知识准确性、叙述连贯性、图解解释力和阅读体验评价成品，用户最新要求优先。

## 静态组件

| 类名 | 用法 | 内容约束 |
| --- | --- | --- |
| `.hn-page`、`.hn-main`、`.hn-toc` | main 与右侧篇内 nav | 窄栏目录可折叠，正文不依赖目录 |
| `.hn-block`、`.hn-label` | 定义标签与完整段落 | 不可只留一句例子 |
| `.hn-key`、`.hn-caution`、`.hn-question` | 在 block 上增加角色 | 重点／边界／真实原疑问不混用 |
| `.hn-formula` | 原生 MathML 或严谨文本公式 | 邻近说明符号、条件 |
| `.hn-figure` | figure + figcaption + 图表 | 给对象、单位、前提、观察说明 |
| `.hn-scroll` | 局部宽表滚动 | 用 region 名称和 tabindex 支持键盘 |
| `.hn-state-grid`、`.hn-state`、`.hn-chip` | 集合、队列或步骤对象 | 文字明确顺序／集合语义 |
| `.hn-extra` | details 补充内容 | 核心定义不藏入折叠 |
| `.hn-sources` | 文末出处 | 文字来源，不创建跨文件导航 |
| `.hn-copy-map`、`.hn-fact`、`.hn-copy-targets` | 一项事实到多个副本的关系图 | 数量与标签由实际数据决定，表中记录有同一稳定标识 |
| `.hn-flow-source`、`.hn-projections` | 多属性平行流向与目标表 | 同一源可对应多个目标；数据表不被连线替代 |
| `.hn-wire-board`、`.hn-wire-layer`、`.hn-wire` | 局部 SVG 线路层 | 所有端点在同一组件作用域，用实测位置重算 |

全局标题、段落、表格、按钮基础样式用于独立文档；将局部复制到其他系统时应进一步收窄选择器。对领域特有的图形和颜色新建独立类，避免更改基础标签语义。

## 联动选择

一个 `[data-hn-linked]` 是一个独立作用域，不嵌套同类作用域。选择按钮使用 `data-hn-select="key"`，初始 `disabled` 和 `aria-pressed="false"`；相应表示使用 `data-hn-key="key"`。一个表示可用空格分隔多个 key，因此 key 本身不能有空格，优先简单稳定标识。

挂载后按钮可操作，选择／再次取消会同步 `.hn-selected` 与 aria-pressed。选择只强调，不隐藏其余数据。可选 `[data-hn-linked-status]` 作为 `aria-live="polite"` 状态说明。组件派发 `hn:select`，`event.detail.key` 为当前标识，取消为空字符串；领域脚本据此更新连线等其他表示。

状态区初始文字是取消选择后的提示。默认选中提示使用领域中立表述；如需解释具体表示，在作用域上设置 `data-hn-selected-message="当前事实 {key}：相关记录已标记。"`，其中 `{key}` 替换为当前标识。不要把示例专有的节点、矩阵或数量条名称写死在通用组件中。

不要把连续值、说明文字或数组索引误作对象身份。初始 HTML 应已包含完整表示，没有脚本时按钮保留标识但不误导为可操作。

## 步骤控制器

作用域为 `[data-hn-sequence]`，不嵌套。必需子项：

| 标记 | 契约 |
| --- | --- |
| `script[type="application/json"][data-hn-frames]` | 非空对象数组，每帧有字符串 label；其他字段由领域决定 |
| `[data-hn-controls]` | 初始 hidden，仅成功初始化后显示 |
| `[data-hn-action="prev/next/play/reset"]` | 四个原生 button，各用一个实际值 |
| `[data-hn-range]` | 原生 range，控制器设置 min/max/step |
| `[data-hn-status]` | 帧编号与说明，建议 polite 状态区 |
| `[data-hn-bind="field"]` | 可选，将当前帧字段写为文本；数组只作简单箭头序列 |

`StudyNotes.mount(document)` 初始化并返回控制器数组；重复挂载同一元素返回原控制器，不重复绑定。单个控制器公开 `go(index)`、`stop()`、`setFrames(frames)`、`index`、`destroy()`。联动控制器公开 `select(key)` 与 `destroy()`。移除交互前调用 destroy 释放其计时器和监听器；领域脚本自行负责其他资源。

切换场景可用 `setFrames(frames)`：验证新帧、停止旧播放、更换帧数组、更新进度上限并回到首帧，再派发一次 hn:frame。同步清除领域选择和旧路径，不让旧计时器把新场景推进。非法帧应拒绝而保留当前状态。动态替换选择按钮后，销毁该联动组旧控制器再挂载，避免给已移除的按钮保留监听器。

状态源只有一个整数索引。每次渲染派发 `hn:frame`，detail 是 `{index, frame}`；领域监听器在首次 mount **之前**注册，使用 frame 同步所有表示。手动前后、拖动和重置都会停止播放；播放到最后一帧停止，末帧再点播放则从首帧开始。页面隐藏暂停。默认不持久化，不自动播放。

组件只调度帧，不证明帧合法，也不自动生成完整静态过程表。定义领域数据、验证帧、提供静态表均是笔记作者责任。公共示例把帧写在 HTML 里以保持简洁，浏览器测试另用独立搜索计算核对，防止“动态表与静态表一同写错”。大量帧应在开发时从领域算法生成并内联。

## 领域层与打包

### 按实际元素连线

需要连线时，在领域脚本之前内联 `assets/diagrams.js`。调用 `StudyDiagrams.connect(root)`，root 内包含 `svg[data-hn-wire-layer]`。源和目标元素分别标记唯一的 `data-hn-anchor="key"`；SVG path 使用 `data-hn-wire-from`、`data-hn-wire-to` 引用这些 key。key 仅在当前图内唯一，不是页面跳转 ID。

可设置 `data-hn-wire-axis="vertical|horizontal"`；默认按元素相对位置决定。必要时用 `data-hn-wire-start/end="top|bottom|left|right|center"` 指定端点边。`data-hn-wire-key` 给路径一个领域身份，供联动选择与 `pulse(keys)` 使用。颜色通过路径上的 `--hn-wire-color` 指定，原生 CSS／数据不是执行代码。

控制器提供 `draw()` 立即重算、`refresh()` 下一帧合并重算、`pulse(keys?)` 一次线路引导、`cancel()` 取消引导、`destroy()` 释放观察器。尺寸、锚点／路径增删和 `hn:layout` 会触发更新；局部 SVG 坐标来自 SVG 自身的矩形。缺失或隐藏端点时隐藏对应路径，避免线指向旧位置。该组件负责几何，不决定关系是否正确。

复制带线图时，应保留静态路径或等价表格／结构说明。无脚本情况下不能只剩“按按钮生成图”。窄栏可在 hn-scroll 内保持二维图最小可读宽度，页面正文仍重排。

### 追踪对象位置

`StudyDiagrams.move(root, update)` 在 update 前后按后代元素的 `data-hn-item` 测量对应对象，追踪位置变化并标出新对象进入。key 在一个 root 内必须稳定且唯一，不能以可能移动的数组下标冒充身份。重复元组的中间序列可使用“元组值＋出现次序”区分重复项，集合去重后保留首项身份。

update 是受信任作者代码提供的同步 DOM 更新回调，不来自材料或 JSON 字符串。它立即落到完整合法状态；动画只是位置追踪，不把连续插值说成新的领域状态。返回值有 cancel()；连续调用会取消同一 root 的旧动效，减少动效时直接更新。删除的数据立即退出可读 DOM，不伪装成仍然存储的行。

### 领域示例

representation.js 负责四种操作的记录变化、未入库与违规状态标注、投影和去重计算；通用组件不包含设备字段或这些判断。主示例保留静态全过程，动态表格从同一构造输入计算。不要因为借用了播放条就省略实际对象之间的连线、数据变化或结果解释。

示例的边测量、节点布局、发现集合与队列绘制在 `examples/reachability.js`，不进入通用控制器。它在尺寸变化时重算局部连线；队列项以稳定 key 保留身份，更新前后测量位置，用短位移展示原项前移及新项进入。新帧数据先落到最终合法状态，位移只追踪布局；减少动效时直接更新。重复操作取消旧位移。这些图论字段不是其他课程必须采用的模式。用同一机制可表达属性流向、状态转换、过程比较，但必须替换相应知识模型。

默认装配顺序：正文与静态内容 → 基础控制器 → 领域事件绑定 → mount。所有实际可执行内容来自可信源码；帧 JSON 只能是数据。作者直接编辑 HTML 时，内联 JSON 中的 `<` 应转义为 `\u003c`，避免 `</script>` 提前结束数据元素。打包器会拒绝脚本源中未转义的提前闭合片段，不会自动清洗恶意正文。

每个 SVG 的 title、desc、marker ID 都要有实例前缀；复制组件时一并更改引用。两份组件并存时验证状态互不干扰、ID 不冲突、缩放后连线不漂移。
