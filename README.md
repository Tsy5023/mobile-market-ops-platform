# 移动市场运营平台 - 高保真 HTML 原型

## 使用方式
1. 用浏览器打开 `index.html`（推荐 Chrome / Edge）
2. 顶部为一级功能，左侧为二/三级菜单，中间 iframe 加载各页面
3. 也可直接打开 `pages/` 下任意 HTML 独立演示

## 目录
- `index.html` - 主入口（iframe 壳）
- `pages/*.html` - 31 个功能页面
- `assets/css/common.css` - 统一样式
- `assets/js/nav-data.js` - 导航与页面元数据
- `assets/js/layout.js` - 子页面布局脚本

## 重新生成
```bash
node build-full.js
```
