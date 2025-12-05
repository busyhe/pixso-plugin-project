# Pixso 页面数据导出插件

## 功能介绍

本插件用于从 Pixso 设计文件中提取选中元素的完整数据，支持两种导出格式：

1. **Pixso JSON** - 原始设计数据，包含所有节点属性
2. **fabric.js JSON** - 转换后的格式，可直接用于 fabric.js Canvas 渲染

### 核心特性

- ✅ 递归遍历所有子节点
- ✅ 图片自动转换为 Base64
- ✅ 支持填充、描边、阴影等样式
- ✅ 保留文本属性和矢量路径
- ✅ 可选导出隐藏元素
- ✅ 支持图片缩放导出

---

## 运行原理

### 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                    Pixso 插件环境                        │
├─────────────────────┬───────────────────────────────────┤
│   main.js (后端)    │         UI (前端)                  │
│   ┌─────────────┐   │   ┌─────────────────────────┐     │
│   │ 节点遍历    │   │   │ App.vue (界面)          │     │
│   │ 数据提取    │◄──┼──►│ fabricConverter.js     │     │
│   │ 图片导出    │   │   │ (格式转换)              │     │
│   └─────────────┘   │   └─────────────────────────┘     │
│         ▲           │              │                    │
│         │           │              ▼                    │
│   pixso API         │        下载 JSON 文件             │
└─────────────────────┴───────────────────────────────────┘
```

### 通信机制

Pixso 插件采用 **沙箱隔离** 架构，后端（main.js）和前端（UI）通过 `postMessage` 通信：

```javascript
// UI → 后端
parent.postMessage({ pluginMessage: { type: 'export-pixso', ... } }, '*');

// 后端 → UI
pixso.ui.postMessage({ type: 'export-result', data: ... });
```

---

## 实现原理

### 1. 节点数据提取 (main.js)

核心函数 `extractNodeData()` 递归遍历节点树，提取所需属性：

```javascript
async function extractNodeData(node, options) {
  const data = {
    id: node.id,
    name: node.name,
    type: node.type,      // FRAME, RECTANGLE, TEXT, VECTOR...
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    rotation: node.rotation,
    opacity: node.opacity,
    visible: node.visible
  };

  // 提取填充样式
  const fills = await extractFills(node);
  
  // 提取描边样式
  const strokes = extractStrokes(node);
  
  // 文本特有属性
  if (node.type === 'TEXT') {
    data.characters = node.characters;
    data.fontSize = node.fontSize;
    data.fontName = node.fontName;
  }

  // 递归处理子节点
  if (node.children) {
    data.children = [];
    for (const child of node.children) {
      data.children.push(await extractNodeData(child, options));
    }
  }
  
  return data;
}
```

### 2. 图片导出为 Base64

使用 Pixso 提供的 `exportAsync` API 将节点渲染为图片：

```javascript
async function exportNodeAsBase64(node, options) {
  // 导出为 PNG 字节数组
  const bytes = await node.exportAsync({
    format: 'PNG',
    constraint: { type: 'SCALE', value: options.scale || 1 }
  });
  
  // 转换为 Base64
  const base64 = pixso.base64Encode(bytes);
  return `data:image/png;base64,${base64}`;
}
```

### 3. fabric.js 格式转换 (fabricConverter.js)

将 Pixso 节点类型映射到 fabric.js 对象类型：

| Pixso 类型 | fabric.js 类型 | 说明 |
|-----------|---------------|------|
| RECTANGLE | Rect | 矩形 |
| ELLIPSE | Ellipse/Circle | 椭圆/圆形 |
| TEXT | IText | 可编辑文本 |
| VECTOR | Path | SVG 路径 |
| FRAME/GROUP | Group | 容器组 |
| 图片填充 | Image | 图片对象 |

核心转换逻辑：

```javascript
function convertNode(node, parentOffset) {
  // 检查是否有图片填充
  if (hasImageFill(node)) {
    return convertImage(node, parentOffset);
  }

  switch (node.type) {
    case 'RECTANGLE':
      return {
        type: 'rect',
        left: node.x - parentOffset.x,
        top: node.y - parentOffset.y,
        width: node.width,
        height: node.height,
        fill: getPrimaryFill(node.fills),
        rx: node.cornerRadius || 0,  // 圆角映射
        angle: node.rotation || 0
      };
    
    case 'TEXT':
      return {
        type: 'i-text',
        text: node.characters,
        fontSize: node.fontSize,
        fontFamily: node.fontName?.family,
        // ...
      };
    
    case 'FRAME':
    case 'GROUP':
      return {
        type: 'group',
        objects: node.children.map(c => convertNode(c, node)),
        // ...
      };
  }
}
```

### 4. 属性映射对照

```
Pixso                    fabric.js
─────────────────────────────────────
x, y                  →  left, top
width, height         →  width, height
rotation              →  angle (度数)
opacity               →  opacity (0-1)
fills[].color         →  fill (hex/rgba)
strokes[].color       →  stroke
strokeWeight          →  strokeWidth
cornerRadius          →  rx, ry
fontSize              →  fontSize
fontName.family       →  fontFamily
textAlignHorizontal   →  textAlign
```

---

## 使用方法

1. 在 Pixso 中选择要导出的 Frame 或元素
2. 运行插件，选择导出格式
3. 配置选项（是否导出图片、缩放比例等）
4. 点击"开始导出"
5. 导出完成后点击"下载 JSON"或"下载原始数据"

---

## 项目结构

```
pixso-plugin-project/
├── main.js              # 插件后端逻辑
├── manifest.json        # 插件配置
├── ui/
│   ├── App.vue          # 前端界面
│   ├── fabricConverter.js # fabric.js 转换器
│   ├── index.js         # Vue 入口
│   └── ui.html          # HTML 模板
└── dist/                # 构建输出
```

## 开发命令

```bash
pnpm dev    # 开发模式
pnpm build  # 构建
pnpm pkg    # 打包
```
