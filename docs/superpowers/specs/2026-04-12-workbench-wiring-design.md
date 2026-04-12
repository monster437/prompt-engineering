# Workbench 接线阶段设计文档

## 1. 目标
把当前仅显示占位文字的首页，替换成一个最小可用的图片提示词工作台。这个工作台需要直接接上现有后端能力，让用户可以在浏览器里完成一条完整主流程：

- 查看和切换工作台
- 新建和删除工作台
- 编辑当前工作台的核心状态
- 选择文本模型与目标模型类型
- 发起提示词生成
- 在追问模式下继续回答问题
- 查看最终提示词与参数摘要
- 基于当前结果继续微调

本阶段只解决“把已完成的后端能力接成可用 UI”这件事，不扩展到配置管理弹窗和图片生成。

## 2. 范围
### 2.1 包含
- 用真实工作台页面替换 `src/app/page.tsx` 占位内容
- 接入现有接口：
  - `GET /api/workspaces`
  - `POST /api/workspaces`
  - `PATCH /api/workspaces/:id`
  - `DELETE /api/workspaces/:id`
  - `GET /api/models`
  - `POST /api/prompt/generate`
  - `POST /api/prompt/refine`
- 工作台列表切换、新建、删除
- 当前工作台的基础编辑能力：
  - 模式
  - 输出语言
  - 文本模型
  - 目标模型类型
  - 原始提示词
- 生成、追问继续、结果展示、二次微调
- 针对主流程的前端测试

### 2.2 不包含
- AI 配置 CRUD 弹窗
- 图片生成 UI 与 `/api/image/generate`
- 历史记录系统
- 多用户、权限、分享能力
- 引入新的全局状态管理库

## 3. 现有约束
本设计必须服从当前已经确定的后端契约和状态语义。

### 3.1 工作台状态来源
前端不重新发明状态结构，直接复用现有工作台 DTO。工作台至少包含这些核心字段：

- `id`
- `title`
- `mode`
- `outputLanguage`
- `selectedTextConfig`
- `selectedTextModel`
- `selectedTargetType`
- `sourcePrompt`
- `questionMessages`
- `answers`
- `finalPrompt`
- `parameterSummary`
- `refineInstruction`
- `status`

### 3.2 文本模型选择语义
文本模型不是单一值，而是必须同时保留：

- `selectedTextConfig`
- `selectedTextModel`

因为后端 prompt 接口要求两者同时存在，前端不能只存模型名。

### 3.3 Prompt 状态语义
- `generate` 可能返回：
  - `needs_clarification`
  - `completed`
- `refine` 只应消费已经具备文本模型选择和结果上下文的工作台
- 已完成 optimize 的工作台状态语义保持现状，不在前端擅自改写

## 4. 总体方案
采用 **单页 client shell + 小型 fetch helper** 的方式实现。

首页只挂载一个顶层 `WorkbenchShell`。这个组件负责：

- 首屏并行加载工作台和模型选项
- 维护当前激活工作台
- 维护页面级 loading / submitting / error 状态
- 把用户操作转成对后端 API 的调用
- 把服务端返回结果同步回当前工作台显示

不引入额外全局状态管理。当前需求范围内，状态集中在一个顶层 shell 中更直接，也更符合“最小可用”目标。

## 5. 组件划分
### 5.1 `WorkbenchShell`
职责：
- 首屏加载 `workspaces` 和 `models`
- 保存 `activeWorkspaceId`
- 组合子组件
- 承接 create / delete / patch / generate / refine 等动作
- 维护全局错误提示和提交中状态

这是唯一持有页面级状态和副作用的核心组件。

### 5.2 `WorkspaceList`
职责：
- 展示工作台列表
- 切换当前工作台
- 新建工作台
- 删除工作台

要求：
- 删除当前工作台后，要自动切到一个仍存在的工作台；如果列表为空，则页面进入“暂无工作台”空态
- 新建成功后，新的工作台应自动成为当前工作台

### 5.3 `WorkspaceEditor`
职责：
- 编辑当前工作台的基础字段
- 渲染文本模型选择
- 渲染目标模型类型选择
- 渲染 source prompt 输入区
- 触发 generate 操作

要求：
- 文本模型下拉项使用 `/api/models` 返回的扁平列表
- 只允许从 `configType === "text"` 的模型中选择文本模型
- 选中某个模型项时，同时写入 `selectedTextConfig` 和 `selectedTextModel`
- 用户修改字段后，通过现有 workspace PATCH 路由持久化

### 5.4 `FollowUpPanel`
职责：
- 在 `needs_clarification` 状态下显示当前最新问题
- 接收一条回答输入
- 提交回答并继续生成

要求：
- 只展示“当前要回答的最后一个问题”，不重复渲染整段历史为复杂聊天 UI
- 提交时先把新 answer 追加到 workspace 的 `answers` 中，再调用 generate
- 回答为空时不允许提交

### 5.5 `PromptResult`
职责：
- 展示 `finalPrompt`
- 展示 `parameterSummary`
- 提供 refine instruction 输入和提交按钮

要求：
- 没有 `finalPrompt` 时不显示 refine 操作区
- refine 成功后，结果区直接显示新的最终提示词和摘要

## 6. 前端数据流
### 6.1 首屏加载
1. 页面挂载
2. 并行请求工作台列表与模型列表
3. 加载成功后：
   - 保存 `workspaces`
   - 保存 `models`
   - 默认激活第一个工作台
4. 任一请求失败时显示页面级错误提示

### 6.2 工作台编辑
1. 用户修改模式、语言、目标类型、原始提示词或文本模型
2. 前端将变更转换为 PATCH payload
3. 服务端返回更新后的 workspace DTO
4. 前端用返回值替换本地对应工作台

这里以后端返回值为准，不在前端手写二次推导状态。

### 6.3 生成流程
1. 用户点击生成
2. 前端从当前工作台读取：
   - `id`
   - `selectedTextConfig`
   - `selectedTextModel`
   - `sourcePrompt`
3. 调用 `POST /api/prompt/generate`
4. 如果返回 `needs_clarification`：
   - 显示追问区
   - 等待用户输入一条回答
5. 如果返回 `completed`：
   - 更新当前工作台展示结果
   - 显示 `finalPrompt` 和 `parameterSummary`

### 6.4 追问继续流程
1. 用户填写回答
2. 先 PATCH 当前 workspace，把新 answer 追加进去
3. 再次调用 generate
4. 重复直到返回 `completed`

这样可以保持工作台持久状态与 prompt 编排状态一致。

### 6.5 微调流程
1. 用户输入 refine instruction
2. 从当前工作台读取：
   - `id`
   - `selectedTextConfig`
   - `selectedTextModel`
3. 调用 `POST /api/prompt/refine`
4. 返回成功后更新结果区

## 7. 客户端状态设计
顶层 shell 只维护当前阶段真正需要的状态：

- `workspaces: WorkspaceDto[]`
- `activeWorkspaceId: string | null`
- `models: ModelOptionDto[]`
- `isBootstrapping: boolean`
- `isSubmitting: boolean`
- `errorMessage: string | null`
- `pendingAnswer: string`
- `pendingRefineInstruction: string`

这些状态足以覆盖主流程，不引入局部重复 source of truth。

## 8. 错误处理
### 8.1 页面级加载错误
工作台列表或模型列表首屏加载失败时，显示明确错误信息，并保留重新触发的入口或刷新页面即可恢复。

### 8.2 提交类错误
生成、继续追问、微调、创建、删除、PATCH 任一失败时：
- 保留当前页面上下文
- 显示错误信息
- 不清空用户刚输入的 answer / refine instruction

### 8.3 空态
- 没有工作台时，显示空态并提供“新建工作台”入口
- 没有可用文本模型时，编辑区仍可见，但生成动作应不可用，并明确提示用户先配置文本模型

## 9. 测试策略
### 9.1 `src/lib/workbench-client.test.ts`
验证：
- workspaces/models/generate/refine 路径是否正确
- method / headers / body 是否正确
- `/api/models` 的 `{ items }` 响应是否被正确展开
- 非 `ok` 响应是否能转成清晰错误

### 9.2 `src/components/workbench/workbench-shell.test.tsx`
至少覆盖：
- 首屏加载并展示第一个工作台
- 切换工作台
- create / delete workspace 行为
- generate 返回 `completed`
- generate 返回 `needs_clarification`
- answer 后继续 generate
- refine 成功后更新结果区
- 加载失败或提交失败时的错误展示

## 10. 验收标准
满足以下条件即可认为本阶段完成：

- 首页不再是占位文本，而是可交互工作台
- 用户可以创建、切换、删除工作台
- 用户可以编辑模式、语言、文本模型、目标模型类型和原始提示词
- 用户可以通过现有 prompt API 生成结果
- 追问模式可以继续回答直到拿到最终结果
- 最终提示词和参数摘要可以展示
- 用户可以对结果继续微调
- 本阶段不引入配置 CRUD 和图片生成 UI
- 相关前端测试通过，且既有后端测试不回归

## 11. 延后事项
以下内容明确留到后续阶段，不在本设计内：

- AI 配置管理弹窗及其完整 CRUD
- 图片生成和下载
- 更复杂的工作台历史或会话时间线
- 更细粒度的 optimistic UI
- 跨页面共享状态或持久化缓存层
