<template>
  <div class="home-container">
    <div class="card secret-card">
      <div class="card-header">
        <span class="icon">💫</span>
        <h2>今日被宽恕的秘密</h2>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>正在寻找一段温暖的秘密...</p>
      </div>

      <div v-else-if="!hasSecret" class="empty-state">
        <span class="empty-icon">🌸</span>
        <p>{{ message }}</p>
        <button class="btn btn-primary" @click="goToConfess">
          分享第一个秘密
        </button>
      </div>

      <transition name="fade" v-else>
        <div class="secret-content" :key="secret?.id">
          <p class="secret-text">"{{ secret.content }}"</p>

          <div v-if="secret?.emotion" class="emotion-tag-section" @click="goToEmotionSecrets">
            <span class="emotion-tag" :style="{ backgroundColor: emotionColor + '20', color: emotionColor, borderColor: emotionColor + '40' }">
              <span class="tag-emoji">{{ emotionEmoji }}</span>
              <span class="tag-name">{{ emotionName }}</span>
              <span class="tag-intensity">
                <span
                  v-for="level in 5"
                  :key="level"
                  class="intensity-dot"
                  :style="{ backgroundColor: level <= secret.intensity ? emotionColor : emotionColor + '30' }"
                ></span>
              </span>
            </span>
            <span class="click-hint">查看更多 →</span>
          </div>

          <div class="secret-footer">
            <span class="status-badge">{{ secret.status }}</span>
            <button class="btn btn-secondary refresh-btn" @click="fetchRandomSecret">
              🔄 换一个
            </button>
          </div>
        </div>
      </transition>

      <div class="card-actions">
        <button class="btn btn-primary" @click="goToConfess">
          我也想倾诉
        </button>
        <button class="btn btn-secondary map-btn" @click="goToEmotionMap">
          🗺️ 探索情绪地图
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(true)
const hasSecret = ref(false)
const secret = ref(null)
const message = ref('')
const emotions = ref({})

const emotionName = computed(() => {
  if (!secret.value?.emotion) return ''
  return emotions.value[secret.value.emotion]?.name || secret.value.emotion
})

const emotionEmoji = computed(() => {
  if (!secret.value?.emotion) return '💭'
  return emotions.value[secret.value.emotion]?.emoji || '💭'
})

const emotionColor = computed(() => {
  if (!secret.value?.emotion) return '#667eea'
  return emotions.value[secret.value.emotion]?.color || '#667eea'
})

async function fetchEmotions() {
  try {
    const response = await fetch('/api/emotions')
    const data = await response.json()
    data.emotions.forEach(e => {
      emotions.value[e.key] = e
    })
  } catch (err) {
    console.error('获取情绪类型失败:', err)
  }
}

async function fetchRandomSecret() {
  loading.value = true
  try {
    const response = await fetch('/api/secrets/random')
    const data = await response.json()
    hasSecret.value = data.hasSecret
    secret.value = data.secret
    message.value = data.message
  } catch (error) {
    console.error('获取秘密失败:', error)
    hasSecret.value = false
    message.value = '暂时无法连接到服务器'
  } finally {
    loading.value = false
  }
}

function goToConfess() {
  router.push('/confess')
}

function goToEmotionMap() {
  router.push('/emotions')
}

function goToEmotionSecrets() {
  if (secret.value?.emotion) {
    router.push(`/emotions/${secret.value.emotion}`)
  }
}

onMounted(async () => {
  await fetchEmotions()
  fetchRandomSecret()
})
</script>

<style scoped>
.home-container {
  width: 100%;
  max-width: 600px;
}

.secret-card {
  animation: slideUp 0.6s ease;
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

.card-header {
  text-align: center;
  margin-bottom: 30px;
}

.icon {
  font-size: 48px;
  display: block;
  margin-bottom: 10px;
}

.card-header h2 {
  color: #333;
  font-size: 24px;
  font-weight: 600;
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

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 20px;
}

.empty-state p {
  color: #666;
  font-size: 16px;
  margin-bottom: 30px;
}

.secret-content {
  padding: 20px 0;
}

.secret-text {
  font-size: 20px;
  line-height: 1.8;
  color: #333;
  font-style: italic;
  text-align: center;
  margin-bottom: 20px;
  padding: 0 10px;
}

.emotion-tag-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 25px;
  cursor: pointer;
  padding: 10px 15px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.emotion-tag-section:hover {
  background: #f8f9ff;
}

.emotion-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid;
}

.tag-emoji {
  font-size: 18px;
}

.tag-intensity {
  display: inline-flex;
  gap: 3px;
  margin-left: 4px;
  padding-left: 8px;
  border-left: 1px solid rgba(0, 0, 0, 0.1);
}

.intensity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.click-hint {
  font-size: 12px;
  color: #999;
  opacity: 0;
  transform: translateX(-5px);
  transition: all 0.3s ease;
}

.emotion-tag-section:hover .click-hint {
  opacity: 1;
  transform: translateX(0);
}

.secret-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.status-badge {
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  color: #2d5a4a;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.refresh-btn {
  padding: 8px 20px;
  font-size: 14px;
  color: #666;
  background: #f0f0f0;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.refresh-btn:hover {
  background: #e0e0e0;
  transform: translateY(-1px);
}

.card-actions {
  margin-top: 35px;
  text-align: center;
  padding-top: 30px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.map-btn {
  background: white;
  color: #667eea;
  border: 1px solid #667eea;
  backdrop-filter: none;
}

.map-btn:hover {
  background: #667eea;
  color: white;
}
</style>
