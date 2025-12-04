/**
 * Pixso to fabric.js JSON Converter
 * Converts Pixso node data to fabric.js compatible JSON format
 */

/**
 * Convert Pixso color (hex) to fabric.js color format
 */
function convertColor(color, opacity = 1) {
  if (!color) return 'transparent';
  if (opacity < 1) {
    // Convert hex to rgba
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
}

/**
 * Get primary fill color from fills array
 */
function getPrimaryFill(fills) {
  if (!fills || fills.length === 0) return 'transparent';
  const solidFill = fills.find(f => f.type === 'SOLID');
  if (solidFill) {
    return convertColor(solidFill.color, solidFill.opacity);
  }
  return 'transparent';
}

/**
 * Get primary stroke from strokes array
 */
function getPrimaryStroke(strokes) {
  if (!strokes || strokes.length === 0) return null;
  const solidStroke = strokes.find(s => s.type === 'SOLID');
  return solidStroke ? solidStroke.color : null;
}

/**
 * Convert text alignment from Pixso to fabric.js
 */
function convertTextAlign(pixsoAlign) {
  const alignMap = {
    'LEFT': 'left',
    'CENTER': 'center',
    'RIGHT': 'right',
    'JUSTIFIED': 'justify'
  };
  return alignMap[pixsoAlign] || 'left';
}

/**
 * Convert a RECTANGLE node to fabric.js Rect
 */
function convertRect(node, parentOffset = { x: 0, y: 0 }) {
  return {
    type: 'rect',
    version: '5.3.0',
    originX: 'left',
    originY: 'top',
    left: node.x - parentOffset.x,
    top: node.y - parentOffset.y,
    width: node.width,
    height: node.height,
    fill: getPrimaryFill(node.fills),
    stroke: getPrimaryStroke(node.strokes),
    strokeWidth: node.strokeWeight || 0,
    rx: node.cornerRadius || node.topLeftRadius || 0,
    ry: node.cornerRadius || node.topLeftRadius || 0,
    angle: node.rotation || 0,
    opacity: node.opacity || 1,
    visible: node.visible !== false,
    name: node.name,
    id: node.id
  };
}

/**
 * Convert an ELLIPSE node to fabric.js Ellipse/Circle
 */
function convertEllipse(node, parentOffset = { x: 0, y: 0 }) {
  const isCircle = node.width === node.height;

  if (isCircle) {
    return {
      type: 'circle',
      version: '5.3.0',
      originX: 'left',
      originY: 'top',
      left: node.x - parentOffset.x,
      top: node.y - parentOffset.y,
      radius: node.width / 2,
      fill: getPrimaryFill(node.fills),
      stroke: getPrimaryStroke(node.strokes),
      strokeWidth: node.strokeWeight || 0,
      angle: node.rotation || 0,
      opacity: node.opacity || 1,
      visible: node.visible !== false,
      name: node.name,
      id: node.id
    };
  }

  return {
    type: 'ellipse',
    version: '5.3.0',
    originX: 'left',
    originY: 'top',
    left: node.x - parentOffset.x,
    top: node.y - parentOffset.y,
    rx: node.width / 2,
    ry: node.height / 2,
    fill: getPrimaryFill(node.fills),
    stroke: getPrimaryStroke(node.strokes),
    strokeWidth: node.strokeWeight || 0,
    angle: node.rotation || 0,
    opacity: node.opacity || 1,
    visible: node.visible !== false,
    name: node.name,
    id: node.id
  };
}

/**
 * Convert a TEXT node to fabric.js IText
 */
function convertText(node, parentOffset = { x: 0, y: 0 }) {
  return {
    type: 'i-text',
    version: '5.3.0',
    originX: 'left',
    originY: 'top',
    left: node.x - parentOffset.x,
    top: node.y - parentOffset.y,
    width: node.width,
    height: node.height,
    fill: getPrimaryFill(node.fills),
    stroke: getPrimaryStroke(node.strokes),
    strokeWidth: node.strokeWeight || 0,
    text: node.characters || '',
    fontSize: node.fontSize || 16,
    fontFamily: node.fontName?.family || 'Arial',
    fontWeight: node.fontName?.style?.includes('Bold') ? 'bold' : 'normal',
    fontStyle: node.fontName?.style?.includes('Italic') ? 'italic' : 'normal',
    textAlign: convertTextAlign(node.textAlignHorizontal),
    angle: node.rotation || 0,
    opacity: node.opacity || 1,
    visible: node.visible !== false,
    name: node.name,
    id: node.id
  };
}

/**
 * Convert an IMAGE fill to fabric.js Image
 */
function convertImage(node, parentOffset = { x: 0, y: 0 }) {
  // Find image fill
  const imageFill = node.fills?.find(f => f.type === 'IMAGE');
  const imageBase64 = imageFill?.imageBase64 || node.exportedImage;

  if (!imageBase64) {
    // Fallback to rect if no image data
    return convertRect(node, parentOffset);
  }

  return {
    type: 'image',
    version: '5.3.0',
    originX: 'left',
    originY: 'top',
    left: node.x - parentOffset.x,
    top: node.y - parentOffset.y,
    width: node.width,
    height: node.height,
    scaleX: 1,
    scaleY: 1,
    angle: node.rotation || 0,
    opacity: node.opacity || 1,
    visible: node.visible !== false,
    name: node.name,
    id: node.id,
    src: imageBase64,
    crossOrigin: 'anonymous'
  };
}

/**
 * Convert VECTOR/PATH to fabric.js Path
 */
function convertVector(node, parentOffset = { x: 0, y: 0 }) {
  // Try to extract path data
  let pathData = '';
  if (node.vectorPaths && node.vectorPaths.length > 0) {
    pathData = node.vectorPaths.map(vp => vp.data).join(' ');
  }

  if (!pathData) {
    // Fallback: create a simple rect as placeholder
    return convertRect(node, parentOffset);
  }

  return {
    type: 'path',
    version: '5.3.0',
    originX: 'left',
    originY: 'top',
    left: node.x - parentOffset.x,
    top: node.y - parentOffset.y,
    width: node.width,
    height: node.height,
    fill: getPrimaryFill(node.fills),
    stroke: getPrimaryStroke(node.strokes),
    strokeWidth: node.strokeWeight || 0,
    path: pathData,
    angle: node.rotation || 0,
    opacity: node.opacity || 1,
    visible: node.visible !== false,
    name: node.name,
    id: node.id
  };
}

/**
 * Convert GROUP/FRAME to fabric.js Group
 */
function convertGroup(node, parentOffset = { x: 0, y: 0 }) {
  const groupOffset = { x: node.x, y: node.y };
  const objects = [];

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      const converted = convertNode(child, groupOffset);
      if (converted) {
        objects.push(converted);
      }
    }
  }

  const group = {
    type: 'group',
    version: '5.3.0',
    originX: 'left',
    originY: 'top',
    left: node.x - parentOffset.x,
    top: node.y - parentOffset.y,
    width: node.width,
    height: node.height,
    angle: node.rotation || 0,
    opacity: node.opacity || 1,
    visible: node.visible !== false,
    name: node.name,
    id: node.id,
    objects: objects
  };

  // If FRAME has a background fill, add it
  if (node.type === 'FRAME' && node.fills && node.fills.length > 0) {
    const bgRect = {
      type: 'rect',
      version: '5.3.0',
      originX: 'left',
      originY: 'top',
      left: 0,
      top: 0,
      width: node.width,
      height: node.height,
      fill: getPrimaryFill(node.fills),
      stroke: null,
      strokeWidth: 0,
      rx: node.cornerRadius || 0,
      ry: node.cornerRadius || 0,
      name: `${node.name}_bg`,
      id: `${node.id}_bg`
    };
    group.objects.unshift(bgRect);
  }

  return group;
}

/**
 * Convert a single node based on its type
 */
function convertNode(node, parentOffset = { x: 0, y: 0 }) {
  if (!node) return null;

  // Check if has image fill
  const hasImageFill = node.fills?.some(f => f.type === 'IMAGE');
  if (hasImageFill || node.exportedImage) {
    return convertImage(node, parentOffset);
  }

  switch (node.type) {
    case 'RECTANGLE':
      return convertRect(node, parentOffset);
    case 'ELLIPSE':
      return convertEllipse(node, parentOffset);
    case 'TEXT':
      return convertText(node, parentOffset);
    case 'VECTOR':
    case 'LINE':
    case 'POLYGON':
    case 'STAR':
    case 'BOOLEAN_OPERATION':
      return convertVector(node, parentOffset);
    case 'FRAME':
    case 'GROUP':
    case 'COMPONENT':
    case 'INSTANCE':
      return convertGroup(node, parentOffset);
    default:
      // Try to convert as rect for unknown types
      if (node.width && node.height) {
        return convertRect(node, parentOffset);
      }
      return null;
  }
}

/**
 * Convert array of Pixso nodes to fabric.js canvas JSON
 */
export function convertToFabricJSON(pixsoNodes) {
  const objects = [];

  for (const node of pixsoNodes) {
    const converted = convertNode(node, { x: 0, y: 0 });
    if (converted) {
      objects.push(converted);
    }
  }

  // Return fabric.js canvas JSON structure
  return {
    version: '5.3.0',
    objects: objects,
    background: '#ffffff'
  };
}

export default { convertToFabricJSON };
