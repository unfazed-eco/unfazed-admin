# Unfazed Admin

基于 Ant Design Pro 构建的现代化企业级中后台管理系统，使用 React 18 + TypeScript + Umi 4 + Ant Design 5 技术栈。

## 如何使用

- 需要配合 [Unfazed](https://github.com/unfazed-eco/unfazed) 使用, 如何使用 Unfazed 创建 Web 后端项目，请查询 Unfazed 相关文档

#### 下载 admin 静态文件

- 在 [Unfazed Admin Release](https://github.com/unfazed-eco/unfazed-admin/releases) 页面获取最新的静态文件
- 把文件解压，并修改文件名（例如：`frontend`），然后把静态文件放到项目路径下（例如：`UnfazedProject/src`）

#### 配置静态文件路由

- 打开 `UnfazedProject/src/backend/routes.py`，在根路由添加以下配置
  - 地址不做强制要求，请根据实际路径配置
  ```python
  static("/admin", directory="/var/www/src/frontend/", html=True)
  ```

#### 如何访问

- 把 Unfazed 服务启动后，在浏览器访问 http://domain/admin/ 即可访问

#### 如何配置动态路由，请查看 Unfazed Admin 部分的文档（待更新）

#### 如何修改 website name / logo，请查看 Unfazed Admin 部分的文档（待更新）

## 如何指定 路由前缀
- 默认是 admin

- 修改 路由 前缀
  ```shell
  # config/constants.ts
  修改 PATH_PREFIX 这个全局变量
  ```
- 安装依赖
  ```shell
    cd unfazed-admin && npm install
  ```
- 重新打包
  ```shell
  npm run build
  ```

## 如何添加 新的 components

### 背景
- `ModelAdmin` 提供“列表 ⇄ 详情”双视图控制器，适合展示与管理数据模型。
- `ModelCustom` 提供“表单 + 动作”模板，适合运行后端自定义工具或批量操作。
- 基于二者可以快速封装新的业务组件，以统一交互体验并降低重复开发成本。

### 基础组件概览
- `ModelAdmin`：维护视图状态、记录详情，并委托实际渲染给 `ModelList` 与 `ModelDetail`。
  ```58:78:src/components/ModelAdmin/index.tsx
  return (
    <>
      {currentView === 'list' ? (
        <ModelList ... />
      ) : currentRecord && modelDesc ? (
        <ModelDetail ... />
      ) : (
        <div>Loading detail...</div>
      )}
    </>
  );
  ```
- `ModelCustom`：按工具描述动态生成表单，执行 `executeModelAction` 并根据不同输出类型反馈结果。
  ```131:198:src/components/ModelCustom/index.tsx
  const response = await executeModelAction({
    name: toolName,
    action: actionKey,
    search_condition: searchConditions,
    ...(actionConfig.batch
      ? { input_data: formData || {} }
      : { form_data: formData || {} }),
  });
  ```

### 自定义组件步骤
1. **选择模板**
   - 列表/详情场景复制 `ModelAdmin`。
   - 表单/工具场景复制 `ModelCustom`。
2. **重命名与类型**
   - 修改文件与组件名称，定义清晰的 Props（如 `modelName`、`toolName`、回调函数等）。
3. **配置数据源**
   - 根据业务调用 `getModelDesc`、`executeModelAction` 或自定义接口。
   - 使用 `useRequest` 或 `useEffect` 管理异步状态与依赖刷新。
4. **渲染 UI**
   - 复用 `ModelList`、`ModelDetail` 或 `renderFormField`，按需调整布局、校验、提示。
   - 自定义按钮、操作提示时建议沿用 Ant Design 组件（`Button`、`Space`、`Modal` 等）。
5. **动作逻辑**
   - 参考 `executeAction` 处理输入校验、请求发送、loading 状态与成功/失败提示。
   - 支持 `toast`、`display`、`download`、`refresh` 等多类型输出，可追加自定义分支。
6. **导出与注册**
   - 在 `src/components/index.ts`（或相关入口）导出新组件。
   - 在路由/菜单配置中添加入口，页面层引入并传递必要 props。

### 集成注意事项
- 共用常量放在 `config/constants`，例如 `PATH_PREFIX`，避免直接依赖 `config/config` 默认导出。
- 组件若依赖国际化或主题配置，请遵循现有上下文（`@/locales`、`defaultSettings` 等）。
- 保持日志或错误处理语句简明，避免在生产环境泄露敏感信息。

### 验证建议
- 使用 mock/后端联调逐步验证：描述加载、表单渲染、动作执行、提示反馈。
- 在路由间切换，确认状态重置逻辑有效（如 `ModelAdmin` 在 `modelName` 变化时还原视图）。
- 覆盖异常场景：网络错误、校验失败、后端报错等，确保界面有清晰反馈。

### 示例扩展方向
- 基于 `ModelAdmin`：新增批量操作按钮、行内编辑、筛选条件等。
- 基于 `ModelCustom`：增加多步骤表单、动作执行日志、结果导出格式选择等。
- 若需要同时具备列表与动态表单，可组合两者逻辑或抽取公共 hook。

完成上述步骤后，即可得到一个符合项目规范的自定义组件，快速融入现有管理后台。


## 如何二次开发

### 环境要求

- Node.js >= 20.0.0
- npm 或 yarn 或 pnpm

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm start
```

### 代码检查

```bash
npm run lint
```

### 项目结构

```
src/
├── components/           # 全局组件
├── pages/               # 页面组件
│   ├── user/           # 用户相关页面（登录、注册）
│   ├── exception/      # 异常页面（403、404、500）
│   ├── result/         # 结果页面（成功、失败）
│   └── Admin.tsx       # 管理页面
├── services/           # API 服务
├── locales/           # 国际化文件
└── app.tsx            # 应用入口配置
```

### 添加新页面

1. 在 `src/pages/` 目录下创建新的页面组件
2. 在 `config/routes.ts` 中添加路由配置
3. 如需权限控制，在 `src/access.ts` 中配置权限

### 添加新接口

1. 在 `src/services/api.ts` 中添加新的 API 接口
2. 使用 TypeScript 定义接口类型
3. 在页面组件中调用接口

### 国际化

1. 在 `src/locales/zh-CN/` 和 `src/locales/en-US/` 中添加翻译文件
2. 在组件中使用 `useIntl()` 或 `formatMessage()` 进行国际化

### 主题定制

在 `config/defaultSettings.ts` 中修改主题配置，支持：

- 主色调配置
- 布局模式（侧边栏、顶部导航等）
- 暗黑模式切换

### 代理配置

开发环境代理配置位于 `config/proxy.ts`，可以配置 API 代理。

### 国际化配置

国际化文件位于 `src/locales/` 目录，支持多语言切换。

## 📖 更多文档

- [Ant Design Pro 官方文档](https://pro.ant.design/)
- [Umi 官方文档](https://umijs.org/)
- [Ant Design 官方文档](https://ant.design/)

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进项目。

## 📄 许可证

本项目基于 MIT 许可证开源。
