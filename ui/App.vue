<script setup>
import { ref, reactive } from 'vue';
import { convertToFabricJSON } from './fabricConverter.js';

// Export options
const options = reactive({
  format: 'pixso', // 'pixso' or 'fabric'
  exportImages: true,
  imageScale: 1,
  includeHidden: false,
});

// State
const loading = ref(false);
const progress = ref({ current: 0, total: 0, nodeName: '' });
const error = ref('');
const exportedData = ref(null);
const rawData = ref(null); // Store original Pixso data

// Handle export
const doExport = () => {
  loading.value = true;
  error.value = '';
  exportedData.value = null;
  progress.value = { current: 0, total: 0, nodeName: '' };

  parent.postMessage(
    {
      pluginMessage: {
        type: options.format === 'fabric' ? 'export-fabric' : 'export-pixso',
        exportImages: options.exportImages,
        imageScale: options.imageScale,
        includeHidden: options.includeHidden,
      },
    },
    '*'
  );
};

// Download JSON file
const downloadJSON = (data, filename) => {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Handle download
const handleDownload = () => {
  if (!exportedData.value) return;

  const filename =
    options.format === 'fabric' ? 'fabric-export.json' : 'pixso-export.json';
  downloadJSON(exportedData.value, filename);
};

// Handle download raw selection data
const handleDownloadRaw = () => {
  parent.postMessage(
    {
      pluginMessage: {
        type: 'export-raw',
      },
    },
    '*'
  );
};

// Cancel
const cancel = () => {
  parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*');
};

// Listen for messages from plugin
window.onmessage = (event) => {
  const msg = event.data.pluginMessage;
  if (!msg) return;

  if (msg.type === 'progress') {
    progress.value = {
      current: msg.current,
      total: msg.total,
      nodeName: msg.nodeName,
    };
  } else if (msg.type === 'export-result') {
    loading.value = false;
    rawData.value = msg.data; // Always store raw data

    if (msg.format === 'fabric') {
      // Convert to fabric.js format
      exportedData.value = convertToFabricJSON(msg.data);
    } else {
      exportedData.value = msg.data;
    }
  } else if (msg.type === 'raw-result') {
    // Directly download raw selection data
    downloadJSON(msg.data, 'pixso-selection-raw.json');
  } else if (msg.type === 'error') {
    loading.value = false;
    error.value = msg.message;
  }
};
</script>

<template>
  <div class="container">
    <!-- Export Format -->
    <div class="section">
      <label class="section-title">导出格式</label>
      <div class="radio-group">
        <label class="radio-item">
          <input type="radio" v-model="options.format" value="pixso" />
          <span>Pixso JSON</span>
        </label>
        <label class="radio-item">
          <input type="radio" v-model="options.format" value="fabric" />
          <span>fabric.js JSON</span>
        </label>
      </div>
    </div>

    <!-- Options -->
    <div class="section">
      <label class="section-title">选项</label>
      <div class="checkbox-group">
        <label class="checkbox-item">
          <input type="checkbox" v-model="options.exportImages" />
          <span>导出图片 (转为 base64)</span>
        </label>
        <label class="checkbox-item">
          <input type="checkbox" v-model="options.includeHidden" />
          <span>包含隐藏元素</span>
        </label>
      </div>

      <div class="input-group" v-if="options.exportImages">
        <label>图片缩放比例</label>
        <select v-model="options.imageScale">
          <option :value="0.5">0.5x</option>
          <option :value="1">1x</option>
          <option :value="2">2x</option>
          <option :value="3">3x</option>
        </select>
      </div>
    </div>

    <!-- Progress -->
    <div class="section" v-if="loading">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{
            width:
              progress.total > 0
                ? (progress.current / progress.total) * 100 + '%'
                : '0%',
          }"
        ></div>
      </div>
      <div class="progress-text">
        正在处理: {{ progress.nodeName }} ({{ progress.current }}/{{
          progress.total
        }})
      </div>
    </div>

    <!-- Error Message -->
    <div class="error" v-if="error">
      {{ error }}
    </div>

    <!-- Result Preview -->
    <div class="section" v-if="exportedData && !loading">
      <div class="success-message">✓ 导出成功！</div>
      <div class="preview">
        <pre>{{ JSON.stringify(exportedData, null, 2).slice(0, 500) }}...</pre>
      </div>
    </div>

    <!-- Actions -->
    <div class="actions">
      <button class="btn primary" @click="doExport" :disabled="loading">
        {{ loading ? '导出中...' : '开始导出' }}
      </button>
      <button
        class="btn success"
        @click="handleDownload"
        :disabled="!exportedData || loading"
      >
        下载 JSON
      </button>
      <button
        class="btn warning"
        @click="handleDownloadRaw"
        :disabled="loading"
      >
        下载 Selection 原始数据
      </button>
      <button class="btn" @click="cancel">取消</button>
    </div>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  color: #333;
  background: #f5f5f5;
}

.container {
  padding: 16px;
}

h2 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1a1a1a;
}

.section {
  margin-bottom: 16px;
}

.section-title {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #666;
}

.radio-group,
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-item,
.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.radio-item input,
.checkbox-item input {
  margin: 0;
}

.input-group {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-group label {
  flex-shrink: 0;
  color: #666;
}

.input-group select {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
}

.progress-bar {
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4f8cff, #6c5ce7);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #888;
}

.error {
  padding: 8px 12px;
  background: #ffebee;
  color: #c62828;
  border-radius: 4px;
  margin-bottom: 16px;
}

.success-message {
  color: #2e7d32;
  font-weight: 500;
  margin-bottom: 8px;
}

.preview {
  max-height: 120px;
  overflow: auto;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
}

.preview pre {
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.btn {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn:hover:not(:disabled) {
  background: #f0f0f0;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.primary {
  background: linear-gradient(135deg, #4f8cff, #6c5ce7);
  color: #fff;
  border: none;
}

.btn.primary:hover:not(:disabled) {
  filter: brightness(1.1);
}

.btn.success {
  background: linear-gradient(135deg, #43a047, #2e7d32);
  color: #fff;
  border: none;
}

.btn.success:hover:not(:disabled) {
  filter: brightness(1.1);
}

.btn.warning {
  background: linear-gradient(135deg, #ff9800, #f57c00);
  color: #fff;
  border: none;
}

.btn.warning:hover:not(:disabled) {
  filter: brightness(1.1);
}
</style>
