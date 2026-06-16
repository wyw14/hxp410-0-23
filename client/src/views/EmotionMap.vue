<template>
  <div class="emotion-map-container">
    <div class="card map-card">
      <div class="card-header">
        <span class="icon">🗺️</span>
        <h2>情绪地图</h2>
        <p class="subtitle">探索被宽恕秘密背后的情绪轮廓</p>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>正在绘制情绪地图...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="fetchStats">重新加载</button>
      </div>

      <div v-else>
        <div class="stats-overview">
          <div class="total-card">
            <span class="total-number">{{ total }}</span>
            <span class="total-label">段被宽恕的心声</span>
          </div>
        </div>

        <div class="emotion-chart-section">
          <h3 class="section-title">
            <span class="title-icon">📊</span>
            情绪分布
          </h3>

          <div class="emotion-bars">
            <div
              v-for="(stat, index) in sortedStats"
              :key="stat.key"
              class="emotion-bar-item"
              @click="goToEmotionSecrets(stat.key)"
              :style="{ animationDelay: index * 0.08 + 's' }"
            >
              <div class="bar-header">
                <div class="bar-info">
                  <span class="emoji">{{ stat.emoji }}</span>
                  <span class="name">{{ stat.name }}</span>
                </div>
                <div class="bar-stats">
                  <span class="count-badge" :style="{ backgroundColor: stat.color + '20', color: stat.color }">
                    {{ stat.count }} 条
                  </span>
                  <span v-if="stat.count > 0" class="avg-intensity">
                    平均强度 {{ stat.avgIntensity }}
                  </span>
                </div>
              </div>

              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{
                    width: getBarWidth(stat.count) + '%',
                    backgroundColor: stat.color,
                    boxShadow: `0 0 20px ${stat.color}40`
                  }"
                >
                  <span v-if="stat.count > 0 && getBarWidth(stat.count) > 15" class="bar-percent">
                    {{ getPercentage(stat.count) }}%
                  </span>
                </div>
              </div>

              <div class="intensity-indicator" v-if="stat.count > 0">
                <span class="indicator-label">强度分布</span>
                <div class="intensity-dots">
                  <span
                    v-for="level in 5"
                    :key="level"
                    class="dot"
                    :class="{ filled: level <= Math.round(stat.avgIntensity) }"
                    :style="{ backgroundColor: level <= Math.round(stat.avgIntensity) ? stat.color : '#e5e7eb' }"
                  ></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="emotion-grid-section">
          <h3 class="section-title">
            <span class="title-icon">🌈</span>
            点击探索
          </h3>

          <div class="emotion-tiles">
            <div
              v-for="stat in sortedStats"
              :key="stat.key"
              class="emotion-tile"
              :class="{ empty: stat.count === 0 }"
              :style="{
                '--tile-color': stat.color,
                background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}30 100%)`,
                borderColor: stat.count > 0 ? stat.color + '40' : '#e5e7eb'
              }"
              @click="stat.count > 0 && goToEmotionSecrets(stat.key)"
            >
              <span class="tile-emoji">{{ stat.emoji }}</span>
              <span class="tile-name">{{ stat.name }}</span>
              <span class="tile-count" :style="{ color: stat.count > 0 ? stat.color : '#999' }">
                {{ stat.count }}
              </span>
            </div>
          </div>
        </div>

        <div class="action-section">
          <button class="btn btn-primary" @click="goToConfess">
            💭 我也想分享
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(true)
const error = ref('')
const total = ref(0)
const stats = ref([])

const maxCount = computed(() => {
  if (stats.value.length === 0) return 1
  return Math.max(...stats.value.map(s => s.count), 1)
})

const sortedStats = computed(() => {
  return stats.value
})

function getBarWidth(count) {
  if (count === 0) return 0
  return Math.max(5, (count / maxCount.value) * 100)
}

function getPercentage(count) {
  if (total.value === 0) return 0
  return Math.round((count / total.value) * 100)
}

async function fetchStats() {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch('/api/emotions/stats')
    const data = await response.json()
    if (response.ok) {
      total.value = data.total
      stats.value = data.stats
    } else {
      error.value = data.error || '加载失败，请稍后重试'
    }
  } catch (err) {
    console.error('获取情绪统计失败:', err)
    error.value = '无法连接到服务器，请稍后重试'
  } finally {
    loading.value = false
  }
}

function goToEmotionSecrets(emotionKey) {
  router.push(`/emotions/${emotionKey}`)
}

function goToConfess() {
  router.push('/confess')
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.emotion-map-container {
  width: 100%;
  max-width: 720px;
}

.map-card {
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
  margin-bottom: 35px;
}

.icon {
  font-size: 56px;
  display: block;
  margin-bottom: 15px;
}

.card-header h2 {
  color: #333;
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 10px;
}

.subtitle {
  color: #666;
  font-size: 15px;
  line-height: 1.6;
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
  padding: 40px 20px;
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

.stats-overview {
  margin-bottom: 35px;
}

.total-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 25px;
  border-radius: 18px;
  text-align: center;
  color: white;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.total-number {
  font-size: 48px;
  font-weight: 700;
  display: block;
  line-height: 1;
  margin-bottom: 8px;
}

.total-label {
  font-size: 15px;
  opacity: 0.9;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.title-icon {
  font-size: 20px;
}

.emotion-chart-section {
  margin-bottom: 35px;
}

.emotion-bars {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.emotion-bar-item {
  background: #fafbfc;
  padding: 18px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: fadeInUp 0.5s ease forwards;
  opacity: 0;
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

.emotion-bar-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  background: #f5f7fa;
}

.bar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 10px;
}

.bar-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.emoji {
  font-size: 26px;
}

.name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.bar-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.count-badge {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.avg-intensity {
  font-size: 13px;
  color: #888;
}

.bar-track {
  height: 28px;
  background: #f0f0f0;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 12px;
}

.bar-fill {
  height: 100%;
  border-radius: 14px;
  transition: width 1s ease;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 10px;
  min-width: 0;
}

.bar-percent {
  font-size: 12px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.intensity-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
}

.indicator-label {
  font-size: 12px;
  color: #888;
}

.intensity-dots {
  display: flex;
  gap: 5px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.emotion-grid-section {
  margin-bottom: 35px;
}

.emotion-tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  gap: 12px;
}

.emotion-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 18px 10px;
  border-radius: 14px;
  border: 2px solid;
  cursor: pointer;
  transition: all 0.3s ease;
}

.emotion-tile:not(.empty):hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.emotion-tile.empty {
  cursor: not-allowed;
  opacity: 0.5;
}

.tile-emoji {
  font-size: 30px;
}

.tile-name {
  font-size: 13px;
  font-weight: 500;
  color: #555;
}

.tile-count {
  font-size: 18px;
  font-weight: 700;
}

.action-section {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
</style>
