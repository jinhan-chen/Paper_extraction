# Paper Focus

一个面向论文阅读场景的 Next.js 全栈原型。用户可以上传 PDF 或粘贴网页链接，系统会异步完成正文抽取、双层摘要生成和单篇论文问答。

## 已实现能力

- `PDF 上传` 与 `网页链接` 两种输入
- `首屏重点摘要 + 深度分析` 双层结构化输出
- `DashScope` 默认模型接入，保留 `OpenRouter` 兼容
- `长文分块 -> 全局归并` 的总结流水线
- `DashScope qwen-long` 文档解析，文本提取不足时自动切换
- 单篇论文内的追问问答
- 本地文件数据库，方便先本地演示和继续开发

## 目录结构

- `app/`: Next.js App Router 页面与 API 路由
- `components/`: 工作台、摘要卡片、深度分析与聊天组件
- `lib/prompts/`: system prompt、首屏摘要 prompt、深度分析 prompt
- `lib/server/`: 解析、总结、队列、仓储、本地存储
- `tests/`: schema 与渲染层测试

## 本地启动

1. 安装依赖

```bash
npm install
```

2. 复制环境变量

```bash
cp .env.example .env.local
```

3. 启动开发环境

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 环境变量

- `LLM_PROVIDER`: 当前模型厂商，支持 `dashscope` 或 `openrouter`，默认推荐 `dashscope`。
- `DASHSCOPE_API_KEY`: 阿里云百炼 API Key。
- `DASHSCOPE_BASE_URL`: 百炼兼容接口地址，默认 `https://dashscope.aliyuncs.com/compatible-mode/v1`。
- `DASHSCOPE_MODEL`: 总结与问答模型，默认 `qwen3.5-plus`。
- `DASHSCOPE_PDF_MODEL`: 文档解析模型，默认 `qwen-long`。
- `OPENROUTER_API_KEY`: 可选，保留 OpenRouter 兼容接入。
- `APP_BASE_URL`: 用于部分提供商透传站点来源。

## 当前实现说明

- 现在的任务队列是进程内异步队列，适合本地开发和 MVP 演示。
- 当前数据存储为 `data/papers.json`，后续可以平滑替换成 Supabase。
- 问答范围只限当前论文，不会自动联网补全。
- 默认推荐用 DashScope：短文本结构化输出走 `qwen3.5-plus`，长文档 / PDF 解析走 `qwen-long`。
- 仍然保留 OpenRouter 兼容模式，方便回切或做 AB 对比。
- 第一版没有强制展示 evidence spans，但 schema 已经为 `explicit / inferred / unknown` 做好了标记。

## 测试

```bash
npm run test
```
