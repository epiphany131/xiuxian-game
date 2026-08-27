'use strict';
// 修仙问道 · 后端服务：静态资源 + 云端存档备份 API
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SAVE_DIR = path.join(__dirname, 'data');
// 存档版本号：与客户端 public/js/game.js 中 SAVE_VERSION 保持一致
const SAVE_VERSION = 1;
// 玩家 ID 安全格式（客户端生成 p<base36时间戳><随机串>），防路径穿越
const PID_RE = /^[A-Za-z0-9_-]{4,64}$/;

if (!fs.existsSync(SAVE_DIR)) {
  fs.mkdirSync(SAVE_DIR, { recursive: true });
}

app.use(express.json({ limit: '1mb' }));
app.use(express.static(PUBLIC_DIR));

// 按玩家 ID 定位存档文件；非法 ID 一律返回 null
function savePathFor(pid) {
  if (typeof pid !== 'string' || !PID_RE.test(pid)) return null;
  return path.join(SAVE_DIR, 'save_' + pid + '.json');
}

// 读取本玩家云端存档备份
app.get('/api/save', (req, res) => {
  const file = savePathFor(req.query.pid);
  if (!file) return res.status(400).json({ ok: false, error: 'pid 缺失或非法' });
  if (fs.existsSync(file)) {
    try {
      return res.json(JSON.parse(fs.readFileSync(file, 'utf-8')));
    } catch (e) {
      // 存档损坏则忽略，返回空
    }
  }
  res.json(null);
});

// 写入本玩家云端存档备份（版本不符时拒绝覆盖，防止旧档覆盖新档）
app.post('/api/save', (req, res) => {
  const body = req.body || {};
  const file = savePathFor(body._pid);
  if (!file) return res.status(400).json({ ok: false, error: 'pid 缺失或非法' });
  if (body._v !== SAVE_VERSION) {
    return res.status(409).json({ ok: false, error: '存档版本不匹配，请刷新页面后重试' });
  }
  try {
    const data = Object.assign({}, body);
    delete data._pid;
    delete data._v;
    const serialized = JSON.stringify(data);
    if (serialized.length > 900000) return res.status(413).json({ ok: false, error: '存档过大' });
    const temp = file + '.tmp';
    fs.writeFileSync(temp, serialized, 'utf-8');
    fs.renameSync(temp, file);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

// 删除本玩家云端存档备份（重置进度时清理远端）
app.delete('/api/save', (req, res) => {
  const file = savePathFor(req.query.pid);
  if (!file) return res.status(400).json({ ok: false, error: 'pid 缺失或非法' });
  try {
    if (fs.existsSync(file)) fs.unlinkSync(file);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

app.listen(PORT, () => {
  console.log(`[修仙问道] 服务已启动: http://localhost:${PORT}`);
});