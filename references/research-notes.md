# 研究登记与设计决策

来源核查记录日期：**2026-10-16**。范围包括 Agent 指令、知识表达、交互文章、图表、单文件技术、可访问性及许可。以下区分资料依据与项目取舍，不是网站界面、提示词或图稿的转载；来源与许可可能后续变化，实际引入第三方素材时需重新核对。

## Agent 怎样稳定完成笔记

| 一手来源 | 相关依据 | 本包的取舍 |
| --- | --- | --- |
| [OpenAI Frontend prompt instructions](https://developers.openai.com/api/docs/guides/frontend-prompt) | 前端设计要贴合目的、受众和已有视觉约束 | 明确长期学习记录的读者；避免营销页、卡片墙；不照搬网站图片和网络字体建议 |
| [OpenAI Codex Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide) | 清楚任务约束，让实现、检查与修复闭环 | 知识覆盖与浏览器操作分别验收，不将特定模型提示固化成通用咒语 |
| [Anthropic Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | 高信号上下文、清楚接口及按需获取 | 短入口链接专题规范，按任务加载组件，避免灌入全部源码 |
| [Anthropic frontend-design skill](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) | 观察公开指令如何要求具体审美决策 | 仅作方法对照，原创撰写笔记专用规则，不复制完整指令；长期可读性优先 |

这些是工程指导，不是“提示词保证学习质量”的实验结论。内容覆盖表、图表小契约和领域状态核对是本项目针对实际问题设计的流程。

## 交互文章与图表表达

| 一手来源 | 借鉴机制 | 适用边界 |
| --- | --- | --- |
| [Distill: Communicating with Interactive Articles](https://distill.pub/2020/communicating-with-interactive-articles/) | 分段、按需细节、表示联动、模拟与过程 | 联动减少来回寻找，步骤保留对象身份；不声称所有动画都提高学习效果 |
| [Red Blob Games: Little Design Things](https://www.redblobgames.com/making-of/little-things/) | 就近图例、文字与图形对应、原生控件与清楚反馈 | 同一对象保持标识；少量状态优先并排，不将简单对照藏在操作后 |
| [ONS: Using colours in charts](https://service-manual.ons.gov.uk/data-visualisation/colours/using-colours-in-charts) | 颜色依类别、序列和强调目的选择 | 离散／有序／发散色各有用途；单系列不强行多色，不复制机构品牌色表 |
| [Observable Plot: Accessibility](https://observablehq.github.io/plot/features/accessibility) | 描述和标签增强图表可访问性 | 借鉴语义，用原创 SVG／DOM 实现，不引入 Plot 运行库 |

落地为图表模式选择表，以及原创图—矩阵—数量联动、搜索步骤控制。没有复用这些网站的 SVG、动画代码、图片或版式源文件。

## 单文件与长期阅读

| 一手来源 | 技术事实或方法 | 本包决定 |
| --- | --- | --- |
| [WHATWG HTML sections](https://html.spec.whatwg.org/multipage/sections.html) | HTML 提供 main、section、nav、标题等文档结构 | 使用语义正文与篇内导航 |
| [MDN Progressive enhancement](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement) | 基础内容先可用，再增强体验 | 关闭脚本仍有核心定义、数据和关键过程 |
| [MDN MathML Authoring](https://developer.mozilla.org/en-US/docs/Web/MathML/Guides/Authoring) | 数学结构可直接写入 HTML | 默认原生 MathML 与符号说明，不要求 CDN；复杂排版按任务核验 |
| [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) | file: 存储行为无统一保证，也可能受限 | 不依赖持久化；可选保存失败也应可读 |
| [MDN Printing](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing) | 打印媒体样式与事件可调整输出 | 隐藏控制器，保留静态图表和过程，避免只打印当前帧 |

无网络资源、无跨文件跳转是本项目交付约定，不是 HTML 标准的限制。开发阶段拆分维护与最终自包含并不矛盾。默认不打包第三方运行库。

## 可访问性与可读性

| 一手来源 | 要求或提醒 | 本包应用与边界 |
| --- | --- | --- |
| [WAI Complex Images](https://www.w3.org/WAI/tutorials/images/complex/) | 复杂图需要足够的文字／结构替代 | 图题、结构说明和数据／过程表；不能只写“示意图” |
| [WAI Tables](https://www.w3.org/WAI/tutorials/tables/) | 标题与行列标题有助理解关联 | caption、th、scope，视觉网格不替代语义 |
| [WCAG Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) | 颜色不能是唯一信息载体 | 同时使用标签、形状、线条和状态文字 |
| [WCAG Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | 普通文本通常至少 4.5:1、大号通常至少 3:1，有适用条件及例外 | 本包普通文字目标 4.5:1；实际计算，不默认图表色适合小字 |
| [WCAG Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) | 等效 320 CSS px 的内容重排要求，必要二维布局有例外 | 正文换行，宽表／图局部滚动，不缩小整篇 |
| [WCAG Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | 涉及 24×24 CSS px 或间距等条件与例外 | 本包控件约 32px 高，触屏可 44px，是设计裕量，不是完整符合性声明 |
| [W3C technique C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39) | 使用 prefers-reduced-motion 调整交互动效 | 去除位移与过渡，保留操作、状态和正文 |

没有完成辅助技术和全部条款评估时，不宣称 WCAG 认证或屏幕阅读器完全可用。浏览器测试也不能代表特定宿主软件的嵌入实测。

## 许可核查与实现策略

| 来源 | 观察到的边界 | 当前处理 |
| --- | --- | --- |
| [MIT 标准许可](https://choosealicense.com/licenses/mit/) | 复制分发受保留版权与许可文本等条件约束 | 原创代码与文档采用 MIT，包内附完整文本 |
| [frontend-design LICENSE](https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/LICENSE.txt) | 该目录附 Apache-2.0，不能由上层目录猜统一许可 | 未复制源文件或完整 prompt，只登记研究链接 |
| [Distill FAQ](https://distill.pub/faq/) | 自有图与交互代码许可不同，另有声明及借用图例外 | 不搬运图稿或实现，自己编写 |
| [D3 root LICENSE](https://raw.githubusercontent.com/d3/d3/main/LICENSE) | 根包为 ISC，不能据此推断所有依赖和子包 | 当前不打包，未来逐版本、逐依赖核查 |
| [KaTeX LICENSE](https://raw.githubusercontent.com/KaTeX/KaTeX/main/LICENSE) | 项目附 MIT，实际分发仍需核对文件和字体等 | 当前不打包，采用原生 MathML |

可以看到网页不等于可以重新发布其中作品。当前包采用原创说明、组件和构造数据，方法参考与代码分开登记。核查不是法律保证；后续素材仍须按其实际许可处理，用户的课件也不自动属于本包 MIT。
