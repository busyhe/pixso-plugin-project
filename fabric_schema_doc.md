# Fabric.js Canvas JSON 参数说明文档

## 顶层结构

```json
{
  "objects": [],   // 画布上的所有对象数组
  "version": "5.5.2",  // Fabric.js 版本号
  "clipPath": {}   // 画布裁剪区域配置
}
```

---

## 通用基础属性（所有对象共有）

| 属性 | 类型 | 说明 |
|------|------|------|
| `id` | string | 对象的唯一标识符 |
| `type` | string | 对象类型，如 `rect`、`image`、`textbox`、`circle`、`path` 等 |
| `top` | number | 对象相对于画布顶部的位置（Y 坐标） |
| `left` | number | 对象相对于画布左侧的位置（X 坐标） |
| `width` | number | 对象的宽度 |
| `height` | number | 对象的高度 |
| `scaleX` | number | 水平缩放比例，默认 1 |
| `scaleY` | number | 垂直缩放比例，默认 1 |
| `angle` | number | 旋转角度（度数） |
| `flipX` | boolean | 是否水平翻转 |
| `flipY` | boolean | 是否垂直翻转 |
| `skewX` | number | X 轴倾斜角度 |
| `skewY` | number | Y 轴倾斜角度 |
| `originX` | string | 水平变换原点：`left` / `center` / `right` |
| `originY` | string | 垂直变换原点：`top` / `center` / `bottom` |
| `opacity` | number | 透明度，0-1 |
| `visible` | boolean | 是否可见 |
| `selectable` | boolean | 是否可选中 |
| `evented` | boolean | 是否响应事件 |
| `hasControls` | boolean | 是否显示控制点 |
| `version` | string | Fabric.js 版本 |

---

## 填充与描边属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `fill` | string/object | 填充颜色，如 `rgb(0,0,0)` 或渐变对象 |
| `fillRule` | string | 填充规则：`nonzero` / `evenodd` |
| `stroke` | string/null | 描边颜色 |
| `strokeWidth` | number | 描边宽度 |
| `strokeLineCap` | string | 线端样式：`butt` / `round` / `square` |
| `strokeLineJoin` | string | 线连接样式：`miter` / `round` / `bevel` |
| `strokeMiterLimit` | number | 斜接限制 |
| `strokeDashArray` | array/null | 虚线数组，如 `[5, 5]` |
| `strokeDashOffset` | number | 虚线偏移量 |
| `strokeUniform` | boolean | 缩放时是否保持描边宽度不变 |
| `paintFirst` | string | 先绘制填充还是描边：`fill` / `stroke` |

---

## 阴影与背景属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `shadow` | object/string/null | 阴影配置，包含 `color`、`blur`、`offsetX`、`offsetY` |
| `backgroundColor` | string | 对象背景颜色 |
| `globalCompositeOperation` | string | 合成操作模式，如 `source-over`、`multiply` 等 |

---

## 矩形（Rect）特有属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `rx` | number | 圆角 X 轴半径 |
| `ry` | number | 圆角 Y 轴半径 |

---

## 图片（Image）特有属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `src` | string | 图片 URL 或 Base64 数据 |
| `cropX` | number | 裁剪起始 X 位置 |
| `cropY` | number | 裁剪起始 Y 位置 |
| `crossOrigin` | string | 跨域设置：`anonymous` / `use-credentials` / null |
| `filters` | array | 滤镜数组，包含亮度、对比度、灰度等滤镜配置 |

---

## 文本框（Textbox）特有属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `text` | string | 文本内容 |
| `name` | string | 文本名称/标识 |
| `fontFamily` | string | 字体名称，如 `站酷快乐体`、`Arial` |
| `fontSize` | number | 字体大小 |
| `fontWeight` | string | 字重：`normal` / `bold` / 数值 |
| `fontStyle` | string | 字体样式：`normal` / `italic` / `oblique` |
| `textAlign` | string | 文本对齐：`left` / `center` / `right` / `justify` |
| `lineHeight` | number | 行高倍数 |
| `charSpacing` | number | 字符间距 |
| `underline` | boolean | 是否下划线 |
| `overline` | boolean | 是否上划线 |
| `linethrough` | boolean | 是否删除线 |
| `editable` | boolean | 是否可编辑 |
| `direction` | string | 文本方向：`ltr` / `rtl` |
| `minWidth` | number | 最小宽度 |
| `splitByGrapheme` | boolean | 是否按字符拆分（用于 CJK 换行） |
| `styles` | array/object | 富文本样式配置 |
| `textBackgroundColor` | string | 文本背景颜色 |
| `path` | object/null | 文本路径配置 |
| `pathSide` | string | 路径侧：`left` / `right` |
| `pathAlign` | string | 路径对齐：`baseline` / `center` / `ascender` / `descender` |
| `pathStartOffset` | number | 路径起始偏移 |

---

## Workspace（工作区）特殊对象

`id` 为 `workspace` 的对象是画布工作区，通常为矩形，定义了画布的可编辑区域：

```json
{
  "id": "workspace",
  "type": "rect",
  "width": 1242,
  "height": 1660,
  "fill": "rgba(255,255,255,1)",
  "selectable": false,
  "evented": false,
  "hasControls": false
}
```

## ClipPath（裁剪区域）

`clipPath` 定义了画布的可见区域，通常也是一个矩形对象：

```json
  "clipPath": {
    "type": "rect",
    "width": 1242,
    "height": 1660,
    "top": 0,
    "left": 0
  }
```
