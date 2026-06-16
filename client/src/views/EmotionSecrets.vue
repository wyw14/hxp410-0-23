<template>
  <div class="emotion-secrets-container">
    <div class="card secrets-card">
      <div class="card-header-section" :style="{ background: `linear-gradient(135deg, ${emotionColor}25 0%, ${emotionColor}10 100%)` }">
        <button class="back-btn" @click="goBack">
          <span class="back-icon">←</span>
          返回情绪地图
        </button>

        <div class="emotion-header-content">
          <span class="big-emoji">{{ emotionEmoji }}</span>
          <h2 class="emotion-title" :style="{ color: emotionColor }">
            {{ emotionName }}
          </h2>
          <p class="emotion-desc">
            共有 <strong :style="{ color: emotionColor }">{{ total }}</strong> 段关于「{{ emotionName }}」的心声
          </p>
        </div>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>正在加载秘密...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="fetchSecrets">重新加载</button>
      </div>

      <div v-else-if="secrets.length === 0" class="empty-state">
        <span class="empty-emoji">{{ emotionEmoji }}</span>
        <h3>还没有「{{ emotionName }}」的秘密</h3>
        <p>成为第一个分享这种心情的人吧</p>
        <button class="btn btn-primary" @click="goToConfess">
          我来分享一个
        </button>
      </div>

      <div v-else class="secrets-list">
        <div
          v-for="(secret, index) in secrets"
          :key="secret.id"
          class="secret-item"
          :style="{ animationDelay: index * 0.06 + 's', borderLeftColor: emotionColor }"
        >
          <div class="secret-meta">
            <div class="intensity-display">
              <span class="intensity-label">强度</span>
              <div class="intensity-dots">
                <span
                  v-for="level in 5"
                  :key="level"
                  class="dot"
                  :style="{ backgroundColor: level <= secret.intensity ? emotionColor : '#e5e7eb' }"
                ></span>
              </div>
              <span class="intensity-num" :style="{ color: emotionColor }">
                {{ secret.intensity }}/5
              </span>
            </div>
            <span class="created-time">{{ formatTime(secret.createdAt) }}</span>
          </div>

          <p class="secret-text">"{{ secret.content }}"</p>

          <div class="secret-footer">
            <span class="status-badge" :style="{ background: `linear-gradient(135deg, ${emotionColor}30 0%, ${emotionColor}15 100%)`, color: emotionColor }">
              已宽恕
            </span>
          </div>
        </div>

        <div v-if="hasMore" class="load-more-section">
          <button
            class="btn btn-secondary load-more-btn"
            @click="loadMore"
            :disabled="loadingMore"
          >
            <span v-if="loadingMore">
              <span class="btn-spinner"></span>
              加载中...
            </span>
            <span v-else>加载更多</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const total = ref(0)
const secrets = ref([])
const page = ref(1)
const limit = 10
const hasMore = ref(false)
const emotionName = ref('')
const emotionEmoji = ref('💭')
const emotionColor = ref('#667eea')

async function fetchSecrets() {
  const emotionKey = route.params.emotion
  loading.value = true
  error.value = ''
  page.value = 1

  try {
    const response = await fetch(`/api/secrets/emotion/${emotionKey}?page=${page.value}&limit=${limit}`)
    const data = await response.json()

    if (response.ok) {
      emotionName.value = data.emotionInfo.name
      emotionEmoji.value = data.emotionInfo.emoji
      emotionColor.value = data.emotionInfo.color
      total.value = data.total
      secrets.value = data.secrets
      hasMore.value = data.hasMore
    } else {
      error.value = data.error || '加载失败，请稍后重试'
    }
  } catch (err) {
    console.error('获取秘密列表失败:', err)
    error.value = '无法连接到服务器，请稍后重试'
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  const emotionKey = route.params.emotion
  loadingMore.value = true
  page.value++

  try {
    const response = await fetch(`/api/secrets/emotion/${emotionKey}?page=${page.value}&limit=${limit}`)
    const data = await response.json()

    if (response.ok) {
      secrets.value = [...secrets.value, ...data.secrets]
      hasMore.value = data.hasMore
    }
  } catch (err) {
    console.error('加载更多失败:', err)
  } finally {
    loadingMore.value = false
  }
}

function formatTime(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor(diff / (1000 * 60))

  if (days > 30) {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  } else if (days > 0) {
    return `${days}天前`
  } else if (hours > 0) {
    return `${hours}小时前`
  } else if (minutes > 0) {
    return `${minutes}分钟前`
  } else {
    return '刚刚'
  }
}

function goBack() {
  router.push('/emotions')
}

function goToConfess() {
  router.push('/confess')
}

onMounted(() => {
  fetchSecrets()
})
</script>

<style scoped>
.emotion-secrets-container {
  width: 100%;
  max-width: 680px;
}

.secrets-card {
  animation: slideUp 0.6s ease;
  padding: 0;
  overflow: hidden;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-header-section {
  padding: 30px 25px;
  border-bottom: 1px solid #f0f0f0;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  font-family: inherit;
}

.back-btn:hover {
  transform: translateX(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  color: #333;
}

.back-icon {
  font-size: 16px;
  font-weight: 600;
}

.emotion-header-content {
  text-align: center;
}

.big-emoji {
  font-size: 64px;
  display: block;
  margin-bottom: 10px;
  animation: bounce 2s ease infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.emotion-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 10px;
}

.emotion-desc {
  color: #666;
  font-size: 15px;
}

.emotion-desc strong {
  font-size: 18px;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(102, 126, 234, 0.3);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  text-align: center;
  padding: 40px 25px;
}

.error-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 15px;
}

.error-state p {
  color: #666;
  margin-bottom: 20px;
}

.empty-state {
  text-align: center;
  padding: 50px 25px;
}

.empty-emoji {
  font-size: 56px;
  display: block;
  margin-bottom: 15px;
  opacity: 0.6;
}

.empty-state h3 {
  color: #333;
  font-size: 20px;
  margin-bottom: 10px;
}

.empty-state p {
  color: #888;
  margin-bottom: 25px;
}

.secrets-list {
  padding: 25px;
}

.secret-item {
  background: #fafbfc;
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 16px;
  border-left: 4px solid;
  animation: fadeInUp 0.5s ease forwards;
  opacity: 0;
  transition: all 0.3s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.secret-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
}

.secret-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  flex-wrap: wrap;
  gap: 10px;
}

.intensity-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.intensity-label {
  font-size: 12px;
  color: #888;
}

.intensity-dots {
  display: flex;
  gap: 4px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.intensity-num {
  font-size: 13px;
  font-weight: 600;
}

.created-time {
  font-size: 12px;
  color: #999;
}

.secret-text {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  margin-bottom: 14px;
  font-style: italic;
}

.secret-footer {
  display: flex;
  justify-content: flex-end;
}

.status-badge {
  padding: 6px 14px;
  border-radius: 15px;
  font-size: 13px;
  font-weight: 500;
}

.load-more-section {
  text-align: center;
  padding-top: 10px;
}

.load-more-btn {
  min-width: 160px;
}

.btn-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(102, 126, 234, 0.3);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}
</style>
