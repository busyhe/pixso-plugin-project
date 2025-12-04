pixso.showUI(__html__, { width: 360, height: 450 });

/**
 * Convert RGBA color object to hex string
 * @param {Object} color - {r, g, b, a?}
 */
function rgbaToHex(color) {
  if (!color) return null;
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Convert RGBA color object to rgba() CSS string
 */
function rgbaToRgbaString(color) {
  if (!color) return null;
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = color.a !== undefined ? color.a : 1;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Export node as base64 image
 * @param {SceneNode} node
 * @param {Object} options
 */
async function exportNodeAsBase64(node, options = {}) {
  try {
    const format = options.format || 'PNG';
    const scale = options.scale || 1;
    const bytes = await node.exportAsync({
      format: format,
      constraint: { type: 'SCALE', value: scale }
    });
    const base64 = pixso.base64Encode(bytes);
    return `data:image/${format.toLowerCase()};base64,${base64}`;
  } catch (error) {
    console.error('Export error:', error);
    return null;
  }
}

/**
 * Extract fill data from node
 * @param {SceneNode} node
 */
async function extractFills(node) {
  if (!node.fills || node.fills.length === 0) return null;

  const fills = [];
  for (const fill of node.fills) {
    if (!fill.visible) continue;

    const fillData = {
      type: fill.type,
      opacity: fill.opacity !== undefined ? fill.opacity : 1
    };

    if (fill.type === 'SOLID') {
      fillData.color = rgbaToHex(fill.color);
      fillData.rgba = rgbaToRgbaString({ ...fill.color, a: fill.opacity });
    } else if (fill.type === 'IMAGE') {
      // Export the node as image to get the actual rendered image
      const base64 = await exportNodeAsBase64(node);
      fillData.imageBase64 = base64;
      fillData.scaleMode = fill.scaleMode;
    } else if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL') {
      fillData.gradientStops = fill.gradientStops?.map(stop => ({
        position: stop.position,
        color: rgbaToHex(stop.color),
        rgba: rgbaToRgbaString(stop.color)
      }));
      fillData.gradientTransform = fill.gradientTransform;
    }

    fills.push(fillData);
  }

  return fills.length > 0 ? fills : null;
}

/**
 * Extract stroke data from node
 * @param {SceneNode} node
 */
function extractStrokes(node) {
  if (!node.strokes || node.strokes.length === 0) return null;

  return node.strokes.filter(s => s.visible !== false).map(stroke => ({
    type: stroke.type,
    color: stroke.type === 'SOLID' ? rgbaToHex(stroke.color) : null,
    opacity: stroke.opacity
  }));
}

/**
 * Extract text properties
 * @param {TextNode} node
 */
function extractTextProperties(node) {
  if (node.type !== 'TEXT') return null;

  return {
    characters: node.characters,
    fontSize: node.fontSize,
    fontName: node.fontName,
    textAlignHorizontal: node.textAlignHorizontal,
    textAlignVertical: node.textAlignVertical,
    letterSpacing: node.letterSpacing,
    lineHeight: node.lineHeight,
    textCase: node.textCase,
    textDecoration: node.textDecoration
  };
}

/**
 * Extract vector path data if available
 * @param {VectorNode} node
 */
function extractVectorData(node) {
  if (node.type !== 'VECTOR' && node.type !== 'BOOLEAN_OPERATION') return null;

  return {
    vectorPaths: node.vectorPaths,
    vectorNetwork: node.vectorNetwork
  };
}

/**
 * Recursively extract node data
 * @param {SceneNode} node
 * @param {Object} options
 */
async function extractNodeData(node, options = {}) {
  // Basic properties
  const data = {
    id: node.id,
    name: node.name,
    type: node.type,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    rotation: node.rotation || 0,
    opacity: node.opacity !== undefined ? node.opacity : 1,
    visible: node.visible !== undefined ? node.visible : true
  };

  // Fill properties
  const fills = await extractFills(node);
  if (fills) {
    data.fills = fills;
    // For convenience, also provide the primary fill color
    const solidFill = fills.find(f => f.type === 'SOLID');
    if (solidFill) {
      data.fill = solidFill.color;
    }
  }

  // Stroke properties
  const strokes = extractStrokes(node);
  if (strokes) {
    data.strokes = strokes;
    data.strokeWeight = node.strokeWeight;
    data.strokeAlign = node.strokeAlign;
  }

  // Corner radius
  if (node.cornerRadius !== undefined) {
    data.cornerRadius = node.cornerRadius;
  }
  if (node.topLeftRadius !== undefined) {
    data.topLeftRadius = node.topLeftRadius;
    data.topRightRadius = node.topRightRadius;
    data.bottomLeftRadius = node.bottomLeftRadius;
    data.bottomRightRadius = node.bottomRightRadius;
  }

  // Text properties
  const textProps = extractTextProperties(node);
  if (textProps) {
    Object.assign(data, textProps);
  }

  // Vector path data
  const vectorData = extractVectorData(node);
  if (vectorData) {
    data.vectorPaths = vectorData.vectorPaths;
    data.vectorNetwork = vectorData.vectorNetwork;
  }

  // Effects (drop shadow, blur, etc.)
  if (node.effects && node.effects.length > 0) {
    data.effects = node.effects.filter(e => e.visible !== false).map(effect => ({
      type: effect.type,
      color: effect.color ? rgbaToHex(effect.color) : null,
      offset: effect.offset,
      radius: effect.radius,
      spread: effect.spread,
      visible: effect.visible
    }));
  }

  // Blend mode
  if (node.blendMode) {
    data.blendMode = node.blendMode;
  }

  // Constraints
  if (node.constraints) {
    data.constraints = node.constraints;
  }

  // Export as image if requested
  if (options.exportImages && (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE')) {
    data.exportedImage = await exportNodeAsBase64(node, { scale: options.imageScale || 1 });
  }

  // Children
  if (node.children && node.children.length > 0) {
    data.children = [];
    for (const child of node.children) {
      if (child.visible === false && !options.includeHidden) continue;
      const childData = await extractNodeData(child, options);
      data.children.push(childData);
    }
  }

  return data;
}

/**
 * Get selection or current page data
 * @param {Object} options
 */
async function getExportData(options = {}) {
  const selection = pixso.currentPage.selection;

  if (selection.length === 0) {
    // If nothing selected, export current page
    pixso.ui.postMessage({
      type: 'error',
      message: '请先选择要导出的元素或 Frame'
    });
    return null;
  }

  const exportedNodes = [];
  const totalNodes = selection.length;
  let processedNodes = 0;

  for (const node of selection) {
    const nodeData = await extractNodeData(node, options);
    exportedNodes.push(nodeData);

    processedNodes++;
    pixso.ui.postMessage({
      type: 'progress',
      current: processedNodes,
      total: totalNodes,
      nodeName: node.name
    });
  }

  return exportedNodes;
}

// Message handler
pixso.ui.onmessage = async (msg) => {
  if (msg.type === 'export-pixso') {
    // Export as raw Pixso JSON
    const data = await getExportData({
      exportImages: msg.exportImages || false,
      imageScale: msg.imageScale || 1,
      includeHidden: msg.includeHidden || false
    });

    if (data) {
      pixso.ui.postMessage({
        type: 'export-result',
        format: 'pixso',
        data: data
      });
    }
  } else if (msg.type === 'export-fabric') {
    // Export as fabric.js JSON (conversion happens in UI)
    const data = await getExportData({
      exportImages: true,
      imageScale: msg.imageScale || 1,
      includeHidden: msg.includeHidden || false
    });

    if (data) {
      pixso.ui.postMessage({
        type: 'export-result',
        format: 'fabric',
        data: data
      });
    }
  } else if (msg.type === 'cancel') {
    pixso.closePlugin();
  }
};
