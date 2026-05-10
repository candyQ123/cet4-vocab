# CLAUDE.md — AI 助手指引

## 项目简介
英语四级背单词助手，面向中职毕业生的 CET-4 备考网页工具。零依赖，纯 HTML/CSS/JS，浏览器直接打开使用。

## 标准文件路径

| 文档 | 路径 | 用途 |
|------|------|------|
| 需求文档 | [docs/requirements.md](docs/requirements.md) | 功能与非功能需求 |
| 技术规范 | [docs/technical-spec.md](docs/technical-spec.md) | 技术栈、架构、数据模型 |
| 设计规范 | [docs/design-spec.md](docs/design-spec.md) | 色彩、字体、组件标准 |
| 分步计划 | [docs/development-steps.md](docs/development-steps.md) | 8 步执行计划及验证点 |
| 开发日志 | [devlog/](devlog/) | 每日开发记录 |

## 工作说明

1. **增量开发**：严格按分步计划推进，每完成一步验证后再进入下一步
2. **代码规范**：
   - 所有源码放在 `src/` 目录
   - JS 文件拆分：`storage.js`（数据层）、`data.js`（静态数据）、`app.js`（业务逻辑）
   - CSS 统一在 `style.css`
   - 零外部依赖，不使用任何框架或 CDN
3. **数据持久化**：所有用户数据通过 `storage.js` 操作 localStorage
4. **验证**：每步完成后在浏览器中手动验证功能正确性
5. **devlog**：每完成一步，在 `devlog/` 下创建/更新当天的日志文件，记录完成事项和待办
6. **UI 一致性**：所有 UI 改动必须遵循 [docs/design-spec.md](docs/design-spec.md) 色彩和组件规范
