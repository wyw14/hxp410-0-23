const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 41123;

const DATA_DIR = path.join(__dirname, 'data');
const SECRETS_FILE = path.join(DATA_DIR, 'secrets.json');

const EMOTIONS = {
  regret: { name: '愧疚', color: '#6366f1', emoji: '😔' },
  relief: { name: '释然', color: '#10b981', emoji: '😌' },
  sadness: { name: '伤心', color: '#3b82f6', emoji: '😢' },
  anxiety: { name: '焦虑', color: '#f59e0b', emoji: '😰' },
  anger: { name: '愤怒', color: '#ef4444', emoji: '😠' },
  peace: { name: '平静', color: '#8b5cf6', emoji: '🧘' },
  complex: { name: '复杂', color: '#ec4899', emoji: '🤔' }
};

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(SECRETS_FILE)) {
  fs.writeFileSync(SECRETS_FILE, JSON.stringify([]));
}

app.use(cors());
app.use(express.json());

function readSecrets() {
  const data = fs.readFileSync(SECRETS_FILE, 'utf8');
  return JSON.parse(data);
}

function writeSecrets(secrets) {
  fs.writeFileSync(SECRETS_FILE, JSON.stringify(secrets, null, 2));
}

app.post('/api/secrets', (req, res) => {
  try {
    const { content, emotion, intensity } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: '秘密内容不能为空' });
    }

    if (!emotion || !EMOTIONS[emotion]) {
      return res.status(400).json({ error: '请选择心情' });
    }

    if (!intensity || intensity < 1 || intensity > 5) {
      return res.status(400).json({ error: '请选择心情强度（1-5级）' });
    }

    const secrets = readSecrets();
    const newSecret = {
      id: uuidv4(),
      content: content.trim(),
      emotion,
      intensity: parseInt(intensity),
      status: '已宽恕',
      createdAt: new Date().toISOString()
    };

    secrets.push(newSecret);
    writeSecrets(secrets);

    res.json({
      success: true,
      message: '你的秘密已被宽恕',
      secret: newSecret
    });
  } catch (error) {
    console.error('保存秘密时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/secrets/random', (req, res) => {
  try {
    const secrets = readSecrets();
    const forgivenSecrets = secrets.filter(s => s.status === '已宽恕');

    if (forgivenSecrets.length === 0) {
      return res.json({
        hasSecret: false,
        message: '还没有被宽恕的秘密，成为第一个分享的人吧'
      });
    }

    const randomIndex = Math.floor(Math.random() * forgivenSecrets.length);
    const randomSecret = forgivenSecrets[randomIndex];

    res.json({
      hasSecret: true,
      secret: {
        id: randomSecret.id,
        content: randomSecret.content,
        emotion: randomSecret.emotion,
        intensity: randomSecret.intensity,
        status: randomSecret.status
      }
    });
  } catch (error) {
    console.error('获取随机秘密时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/emotions', (req, res) => {
  try {
    res.json({
      emotions: Object.entries(EMOTIONS).map(([key, value]) => ({
        key,
        ...value
      }))
    });
  } catch (error) {
    console.error('获取情绪类型时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/emotions/stats', (req, res) => {
  try {
    const secrets = readSecrets();
    const forgivenSecrets = secrets.filter(s => s.status === '已宽恕');

    const stats = {};
    Object.keys(EMOTIONS).forEach(key => {
      stats[key] = {
        count: 0,
        avgIntensity: 0,
        ...EMOTIONS[key]
      };
    });

    forgivenSecrets.forEach(secret => {
      if (stats[secret.emotion]) {
        stats[secret.emotion].count++;
        stats[secret.emotion].avgIntensity += secret.intensity || 0;
      }
    });

    Object.keys(stats).forEach(key => {
      if (stats[key].count > 0) {
        stats[key].avgIntensity = Math.round((stats[key].avgIntensity / stats[key].count) * 10) / 10;
      }
    });

    const sortedStats = Object.entries(stats)
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => b.count - a.count);

    const totalCount = forgivenSecrets.length;

    res.json({
      total: totalCount,
      stats: sortedStats
    });
  } catch (error) {
    console.error('获取情绪统计时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/secrets/emotion/:emotion', (req, res) => {
  try {
    const { emotion } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!EMOTIONS[emotion]) {
      return res.status(400).json({ error: '无效的情绪类型' });
    }

    const secrets = readSecrets();
    const filteredSecrets = secrets
      .filter(s => s.status === '已宽恕' && s.emotion === emotion)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;
    const paginatedSecrets = filteredSecrets.slice(start, end);

    res.json({
      emotion,
      emotionInfo: EMOTIONS[emotion],
      total: filteredSecrets.length,
      page: pageNum,
      limit: limitNum,
      hasMore: end < filteredSecrets.length,
      secrets: paginatedSecrets.map(s => ({
        id: s.id,
        content: s.content,
        emotion: s.emotion,
        intensity: s.intensity,
        status: s.status,
        createdAt: s.createdAt
      }))
    });
  } catch (error) {
    console.error('获取情绪秘密列表时出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`忏悔室后端服务运行在 http://localhost:${PORT}`);
});
