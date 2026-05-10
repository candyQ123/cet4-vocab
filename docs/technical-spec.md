# 技术规范

## 技术栈
| 层级 | 技术 | 说明 |
|------|------|------|
| 结构 | HTML5 | 语义化标签 |
| 样式 | CSS3 | 原生 CSS，无预处理器 |
| 逻辑 | ES6 JavaScript | 原生 JS，无框架/库 |
| 存储 | localStorage | 浏览器本地 KV 存储 |
| 图标 | Emoji | 内联字符，无图片依赖 |

## 架构
```
index.html ─┬─ css/style.css
            ├─ js/storage.js   ← 数据层（localStorage 读写）
            ├─ js/data.js      ← 静态数据（词库 + 语法）
            └─ js/app.js       ← 业务逻辑 + UI 交互
```

- **storage.js**：封装 localStorage 操作，提供 get/set/remove 方法
- **data.js**：纯数据导出，包含 WORDS（词库数组）和 GRAMMAR（语法数组）
- **app.js**：DOM 操作、事件绑定、模块切换、业务逻辑

## 数据模型

### WORDS 数组（data.js 内置）
```js
{ id: "w001", word: "abandon", phonetic: "/əˈbændən/", pos: "v.", meaning: "放弃；抛弃", example: "He had to abandon his plan." }
```

### GRAMMAR 数组（data.js 内置）
```js
{ id: "g01", category: "时态", title: "一般现在时", content: "...", example: "..." }
```

### localStorage 键设计
| 键 | 类型 | 说明 |
|----|------|------|
| cet4_words_progress | object | { wordId: { status, correct, wrong, lastReview } } |
| cet4_daily_stats | object | { "YYYY-MM-DD": { learned, reviewed } } |
| cet4_custom_words | array | [{ id, word, meaning, added }] |
| cet4_bookmarked | array | ["w001", "w002"] |
| cet4_settings | object | { dailyGoal: 20 } |

## 浏览器兼容性
- Chrome 80+
- Edge 80+
- 需要支持 localStorage API
