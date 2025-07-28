<template>
  <div class="min-h-screen flex items-center justify-center p-4 overflow-hidden transition-colors duration-300">
    <div class="w-full max-w-md relative z-10">
      <div class="rounded-3xl shadow-2xl overflow-hidden border transform transition-all duration-300" :class="[
        isDarkMode
          ? 'bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-xl border-gray-700'
          : 'bg-white border-gray-200'
      ]">
        <div class="p-8">
          <div class="flex justify-center mb-8">
            <div class="rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1 animate-spin-slow">
              <div class="rounded-full bg-gray-900 p-2">
                <BoxIcon class="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <h2 @click="toSend" class="text-3xl cursor-pointer font-extrabold text-center mb-6" :class="[
            isDarkMode
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300'
              : 'text-indigo-600'
          ]">
            {{ config.name }}
          </h2>
          <form @submit.prevent="handleSubmit">
            <div class="mb-6 relative">
              <label for="code" class="block text-sm font-medium mb-2"
                :class="[isDarkMode ? 'text-gray-300' : 'text-gray-800']">取件码</label>
              <div class="relative">
                <input id="code" v-model="code" type="text" ref="codeInput"
                       class="w-full px-4 py-3 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 pr-10"
                  :class="[
                    isDarkMode ? 'bg-gray-700 bg-opacity-50' : 'bg-gray-100',
                    { 'ring-2 ring-red-500': error },
                    isDarkMode ? 'text-gray-300' : 'text-gray-800'
                  ]" placeholder="请输入5位取件码" required :readonly="inputStatus.readonly" maxlength="5"
                  @focus="isInputFocused = true" @blur="isInputFocused = false" />
                <div v-if="inputStatus.loading" class="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span class="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></span>
                </div>
              </div>
              <div
                class="absolute -bottom-0.5 left-2 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 ease-in-out"
                :class="{ 'w-97-100': isInputFocused, 'w-0': !isInputFocused }"></div>
            </div>
            <button type="submit"
              class="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-lg hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition duration-300 transform hover:scale-105 hover:shadow-lg relative overflow-hidden group"
              :disabled="inputStatus.loading">
              <span class="flex items-center justify-center relative z-10">
                <span>{{ inputStatus.loading ? '处理中...' : '提取文件' }}</span>
                <ArrowRightIcon
                  class="w-5 h-5 ml-2 transition-transform duration-300 transform group-hover:translate-x-1" />
              </span>
              <span
                class="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </button>
          </form>

          <div class="mt-6 text-center">
            <router-link to="/send" class="text-indigo-400 hover:text-indigo-300 transition duration-300">
              需要发送文件？点击这里
            </router-link>
          </div>
        </div>
        <div class="px-8 py-4 bg-opacity-50 flex justify-between items-center"
          :class="[isDarkMode ? 'bg-gray-800' : 'bg-gray-100']">
          <span class="text-sm flex items-center" :class="[isDarkMode ? 'text-gray-300' : 'text-gray-800']">
            <ShieldCheckIcon class="w-4 h-4 mr-1 text-green-400" />
            安全加密
          </span>
          <button @click="toggleDrawer" class="text-sm hover:text-indigo-300 transition duration-300 flex items-center"
            :class="[isDarkMode ? 'text-indigo-400' : 'text-indigo-600']">
            取件记录
            <ClipboardListIcon class="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>

    <transition name="drawer">
      <div v-if="showDrawer"
        class="fixed inset-y-0 right-0 w-full sm:w-120 bg-opacity-70 backdrop-filter backdrop-blur-xl shadow-2xl z-50 overflow-hidden flex flex-col"
        :class="[isDarkMode ? 'bg-gray-900' : 'bg-white']">
        <div class="flex justify-between items-center p-6 border-b"
          :class="[isDarkMode ? 'border-gray-700' : 'border-gray-200']">
          <h3 class="text-2xl font-bold" :class="[isDarkMode ? 'text-white' : 'text-gray-800']">
            取件记录
          </h3>
          <button @click="toggleDrawer" class="hover:text-white transition duration-300"
            :class="[isDarkMode ? 'text-gray-400' : 'text-gray-800']">
            <XIcon class="w-6 h-6" />
          </button>
        </div>
        <div class="flex-grow overflow-y-auto p-6">
          <transition-group name="list" tag="div" class="space-y-4">
            <div v-for="record in records" :key="record.id"
              class="bg-opacity-50 rounded-lg p-4 flex items-center shadow-md hover:shadow-lg transition duration-300 transform hover:scale-102"
              :class="[isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-white']">
              <div class="flex-shrink-0 mr-4">
                <FileIcon class="w-10 h-10" :class="[isDarkMode ? 'text-indigo-400' : 'text-indigo-600']" />
              </div>
              <div class="flex-grow min-w-0 mr-4">
                <p class="font-medium text-lg truncate" :class="[isDarkMode ? 'text-white' : 'text-gray-800']">
                  {{ record.filename }}
                </p>
                <p class="text-sm truncate" :class="[isDarkMode ? 'text-gray-400' : 'text-gray-600']">
                  {{ record.date }} · {{ record.size }}
                </p>
              </div>
              <div class="flex-shrink-0 flex space-x-2">
                <button @click="viewDetails(record)"
                  class="p-2 rounded-full hover:bg-opacity-20 transition duration-300" :class="[
                    isDarkMode
                      ? 'hover:bg-indigo-400 text-indigo-400'
                      : 'hover:bg-indigo-100 text-indigo-600'
                  ]">
                  <EyeIcon class="w-5 h-5" />
                </button>
                <button @click="downloadRecord(record)"
                  class="p-2 rounded-full hover:bg-opacity-20 transition duration-300" :class="[
                    isDarkMode
                      ? 'hover:bg-green-400 text-green-400'
                      : 'hover:bg-green-100 text-green-600'
                  ]">
                  <DownloadIcon class="w-5 h-5" />
                </button>
                <button @click="deleteRecord(record.id)"
                  class="p-2 rounded-full hover:bg-opacity-20 transition duration-300" :class="[
                    isDarkMode ? 'hover:bg-red-400 text-red-400' : 'hover:bg-red-100 text-red-600'
                  ]">
                  <TrashIcon class="w-5 h-5" />
                </button>
              </div>
            </div>
          </transition-group>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="selectedRecord" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div
          class="rounded-2xl max-w-md w-full shadow-2xl transform transition-all duration-300 ease-out backdrop-filter backdrop-blur-lg max-h-[90vh] flex flex-col"
          :class="[
            isDarkMode 
              ? 'bg-gray-800 bg-opacity-70' 
              : 'bg-white bg-opacity-95'
          ]">
          <!-- 固定头部 -->
          <div class="flex-shrink-0 flex justify-between items-center p-6 border-b" :class="[isDarkMode ? 'border-gray-700' : 'border-gray-200']">
            <h3 class="text-2xl font-bold truncate" :class="[isDarkMode ? 'text-white' : 'text-gray-800']">
              文件详情
            </h3>
            <button @click="() => { resetAudioState(); selectedRecord = null }"
              class="p-2 rounded-lg transition duration-300 hover:bg-opacity-10"
              :class="[
                isDarkMode 
                  ? 'text-gray-400 hover:text-white hover:bg-white' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-black'
              ]">
              <XIcon class="w-6 h-6" />
            </button>
          </div>

          <!-- 可滚动内容区域 -->
          <div class="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            <div class="flex items-center">
              <FileIcon class="w-6 h-6 mr-3 flex-shrink-0"
                :class="[isDarkMode ? 'text-indigo-400' : 'text-indigo-600']" />
              <p :class="[isDarkMode ? 'text-gray-300' : 'text-gray-800']" class="truncate flex-grow">
                <span class="font-medium">文件名：</span>{{ selectedRecord.filename }}
              </p>
            </div>
            <div class="flex items-center">
              <CalendarIcon class="w-6 h-6 mr-3 flex-shrink-0"
                :class="[isDarkMode ? 'text-indigo-400' : 'text-indigo-600']" />
              <p :class="[isDarkMode ? 'text-gray-300' : 'text-gray-800']" class="truncate flex-grow">
                <span class="font-medium">取件日期：</span>{{ selectedRecord.date }}
              </p>
            </div>
            <div class="flex items-center">
              <HardDriveIcon class="w-6 h-6 mr-3 flex-shrink-0"
                :class="[isDarkMode ? 'text-indigo-400' : 'text-indigo-600']" />
              <p :class="[isDarkMode ? 'text-gray-300' : 'text-gray-800']" class="truncate flex-grow">
                <span class="font-medium">文件大小：</span>{{ selectedRecord.size }}
              </p>
            </div>
            <!-- 音频文件专用播放界面 -->
            <div v-if="selectedRecord.isAudio" class="flex flex-col items-center py-6">
              <h4 class="text-lg font-semibold mb-6" :class="[isDarkMode ? 'text-white' : 'text-gray-800']">
                音频播放器
              </h4>
              
              <!-- 圆形播放按钮 -->
              <button
                type="button"
                @click="toggleAudioPlayback"
                :disabled="audioError"
                class="w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                :class="[
                  isPlaying 
                    ? 'bg-gradient-to-br from-green-500 to-green-600' 
                    : 'bg-gradient-to-br from-indigo-500 to-indigo-600'
                ]"
              >
                <PlayIcon v-if="!isPlaying" class="w-8 h-8 text-white ml-1" />
                <PauseIcon v-else class="w-8 h-8 text-white" />
              </button>

              <!-- 时间显示 -->
              <div class="text-lg font-mono font-bold mb-4" :class="[isDarkMode ? 'text-gray-300' : 'text-gray-900']">
                {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
              </div>

              <!-- 错误提示 -->
              <div v-if="audioError" class="text-red-500 text-sm mb-4">
                音频加载失败，请尝试直接下载
              </div>

              <!-- 隐藏的音频元素 -->
              <audio 
                v-if="selectedRecord.downloadUrl"
                ref="audioRef"
                :src="getDownloadUrl(selectedRecord)"
                @loadedmetadata="onAudioLoadedMetadata"
                @timeupdate="onAudioTimeUpdate"
                @play="onAudioPlay"
                @pause="onAudioPause"
                @ended="onAudioEnded"
                @error="onAudioError"
                preload="metadata"
                crossorigin="anonymous"
                class="hidden"
              ></audio>

              <!-- 下载按钮 -->
              <a :href="getDownloadUrl(selectedRecord)" target="_blank" rel="noopener noreferrer"
                class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-300 text-sm">
                下载音频文件
              </a>
            </div>

            <!-- 非音频文件的原有界面 -->
            <div v-else class="flex items-center">
              <DownloadIcon class="w-6 h-6 mr-3" :class="[isDarkMode ? 'text-indigo-400' : 'text-indigo-600']" />
              <p :class="[isDarkMode ? 'text-gray-300' : 'text-gray-800']">
                <span class="font-medium">文件内容：</span>
              </p>
              <div v-if="selectedRecord.filename === 'Text'" class="ml-2">
                <button @click="showContentPreview"
                  class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-300">
                  预览内容
                </button>
              </div>
              <div v-else>
                <a :href="getDownloadUrl(selectedRecord)" target="_blank" rel="noopener noreferrer"
                  class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-300">
                  点击下载
                </a>
              </div>
            </div>

            <div class="mt-6 flex flex-col items-center">
              <h4 class="text-lg font-semibold mb-3" :class="[isDarkMode ? 'text-white' : 'text-gray-800']">
                取件二维码
              </h4>
              <div class="bg-white p-2 rounded-lg shadow-md">
                <QRCode :value="getQRCodeValue(selectedRecord)" :size="128" level="M" />
              </div>
              <p class="mt-2 text-sm" :class="[isDarkMode ? 'text-gray-400' : 'text-gray-600']">
                扫描二维码快速取件
              </p>
            </div>
          </div>

          <!-- 固定底部区域（可选） -->
          <div class="flex-shrink-0 p-6 border-t" :class="[isDarkMode ? 'border-gray-700' : 'border-gray-200']">
            <p class="text-center text-sm" :class="[isDarkMode ? 'text-gray-400' : 'text-gray-600']">
              点击右上角 ✕ 关闭窗口
            </p>
          </div>
        </div>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="showPreview" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div
          class="p-6 rounded-2xl max-w-3xl w-full mx-4 shadow-2xl transform transition-all duration-300 ease-out backdrop-filter backdrop-blur-lg bg-opacity-70 max-h-[85vh] overflow-hidden flex flex-col"
          :class="[isDarkMode ? 'bg-gray-800' : 'bg-white']">
          <div class="flex justify-between items-center mb-4 flex-shrink-0">
            <h3 class="text-2xl font-bold" :class="[isDarkMode ? 'text-white' : 'text-gray-800']">
              内容预览
            </h3>
            <div class="flex items-center gap-3">
              <button @click="copyContent" 
                class="px-4 py-1.5 rounded-lg transition duration-300 flex items-center gap-2 text-sm font-medium"
                :class="[
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900'
                ]">
                <CopyIcon class="w-4 h-4" />
                复制
              </button>
              <button @click="showPreview = false" 
                class="p-1.5 rounded-lg transition duration-300 hover:bg-opacity-10"
                :class="[
                  isDarkMode 
                    ? 'text-gray-400 hover:text-white hover:bg-white' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-black'
                ]">
                <XIcon class="w-5 h-5" />
              </button>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto custom-scrollbar">
            <div class="prose max-w-none p-6 rounded-xl" 
              :class="[
                isDarkMode 
                  ? 'prose-invert bg-gray-900 bg-opacity-50' 
                  : 'bg-gray-50'
              ]" 
              v-html="renderedContent">
            </div>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, inject, onMounted, watch, computed, onUnmounted } from 'vue'
import {
  BoxIcon,
  EyeIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  ClipboardListIcon,
  XIcon,
  TrashIcon,
  FileIcon,
  CalendarIcon,
  HardDriveIcon,
  DownloadIcon,
  CopyIcon,
  PlayIcon,
  PauseIcon
} from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'
import QRCode from 'qrcode.vue'
import { useFileDataStore } from '@/stores/fileData'
import { storeToRefs } from 'pinia'
import api from '@/utils/api'
import { saveAs } from 'file-saver'
import { marked } from 'marked'
import { useAlertStore } from '@/stores/alertStore'
import { copyToClipboard } from '@/utils/clipboard'

const alertStore = useAlertStore()
const baseUrl = window.location.origin

const router = useRouter()
const isDarkMode = inject('isDarkMode')
const fileStore = useFileDataStore()
const { receiveData } = storeToRefs(fileStore)
const code = ref('')
const inputStatus = ref({
  readonly: false,
  loading: false
})
const isInputFocused = ref(false)
const error = ref('')
const selectedRecord = ref(null)
const showDrawer = ref(false)
const route = useRoute()

// 使用 receiveData 替代原来的 records
const records = receiveData
const config = JSON.parse(localStorage.getItem('config') || '{}')
const codeInput = ref(null)

onMounted(() => {
  codeInput.value && codeInput.value.focus()
  const query_code = route.query.code
  if (query_code) {
    code.value = query_code
  }
})

onUnmounted(() => {
  // 清理音频资源
  resetAudioState()
})
watch(code, (newVal) => {
  if (newVal.length === 5) {
    handleSubmit()
  }
})

const getDownloadUrl = (record) => {
  let url = ''
  if (record.downloadUrl.startsWith('http')) {
    url = record.downloadUrl
  } else {
    url = `${baseUrl}${record.downloadUrl}`
  }
  
  // 添加调试信息
  console.log('音频文件URL:', url)
  console.log('原始downloadUrl:', record.downloadUrl)
  console.log('baseUrl:', baseUrl)
  
  return url
}
// 在其他代码后添加复制功能
const copyContent = async () => {
  if (selectedRecord.value && selectedRecord.value.content) {
    await copyToClipboard(selectedRecord.value.content, {
      successMsg: '内容已复制到剪贴板',
      errorMsg: '复制失败，请重试'
    })
  }
}
const handleSubmit = async () => {
  if (code.value.length !== 5) {
    alertStore.showAlert('请输入5位取件码', 'error')
    return
  }

  inputStatus.value.readonly = true
  inputStatus.value.loading = true

  try {
    const res = await api.post('/share/select/', {
      code: code.value
    })

    if (res.code === 200) {
      if (res.detail) {
        const isFile = res.detail.text.startsWith('/share/download') || res.detail.name !== 'Text'
        const isAudio = isFile && isAudioFile(res.detail.name)
        const newFileData = {
          id: Date.now(),
          code: res.detail.code,
          filename: res.detail.name,
          size: formatFileSize(res.detail.size),
          downloadUrl: isFile ? res.detail.text : null,
          content: isFile ? null : res.detail.text,
          date: new Date().toLocaleString(),
          isAudio: isAudio
        }
        let flag = true
        fileStore.receiveData.forEach((file) => {
          if (file.code === newFileData.code) {
            flag = false
          }
        })
        if (flag) {
          fileStore.addReceiveData(newFileData)
        }
        
        selectedRecord.value = newFileData
        
        if (isAudio) {
          // 音频文件直接显示详情并自动加载音频
          setTimeout(async () => {
            if (audioRef.value) {
              console.log('开始加载音频文件:', newFileData.filename)
              audioRef.value.load()
              
              // 如果10秒后仍未加载成功，尝试fetch方案
              setTimeout(async () => {
                if (audioError.value || duration.value === 0) {
                  console.log('音频加载超时，尝试fetch方案')
                  await loadAudioWithFetch(getDownloadUrl(newFileData))
                }
              }, 10000)
            }
          }, 100)
        } else if (!isFile) {
          // 文本内容显示预览
          showPreview.value = true
        }
        
        alertStore.showAlert('文件获取成功', 'success')
      } else {
        alertStore.showAlert('无效的取件码', 'error')
      }
    } else {
      alertStore.showAlert(res.detail || '获取文件失败', 'error')
    }
  } catch (err) {
    console.error('取件失败:', err)
    alertStore.showAlert('取件失败，请稍后重试', 'error')
  } finally {
    inputStatus.value.readonly = false
    inputStatus.value.loading = false
    code.value = ''
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const viewDetails = (record) => {
  resetAudioState()
  selectedRecord.value = record
  
  // 如果是音频文件，延迟加载音频
  if (record.isAudio) {
    setTimeout(async () => {
      if (audioRef.value) {
        console.log('重新加载音频文件:', record.filename)
        audioRef.value.load()
        
        // 如果10秒后仍未加载成功，尝试fetch方案
        setTimeout(async () => {
          if (audioError.value || duration.value === 0) {
            console.log('音频加载超时，尝试fetch方案')
            await loadAudioWithFetch(getDownloadUrl(record))
          }
        }, 10000)
      }
    }, 100)
  }
}

// 重置音频状态
const resetAudioState = () => {
  isPlaying.value = false
  currentTime.value = 0
  duration.value = 0
  audioError.value = false
  
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value.currentTime = 0
  }
  
  // 清理对象URL
  if (audioObjectUrl.value) {
    URL.revokeObjectURL(audioObjectUrl.value)
    audioObjectUrl.value = null
  }
}

const deleteRecord = (id) => {
  const index = records.value.findIndex((record) => record.id === id)
  if (index !== -1) {
    fileStore.deleteReceiveData(index)
  }
}

const toggleDrawer = () => {
  showDrawer.value = !showDrawer.value
}

const toSend = () => {
  router.push('/send')
}

const getQRCodeValue = (record) => {
  if (record.downloadUrl) {
    return `${baseUrl}${record.downloadUrl}`
  } else {
    return `${baseUrl}?code=${record.code}`
  }
}

const downloadRecord = (record) => {
  console.log(record)

  if (record.downloadUrl) {
    // 如果是文件,直接下载
    window.open(
      `${record.downloadUrl.startsWith('http') ? '' : baseUrl}${record.downloadUrl}`,
      '_blank'
    )
  } else if (record.content) {
    // 如果是文本,转成txt下载
    const blob = new Blob([record.content], { type: 'text/plain;charset=utf-8' })
    saveAs(blob, `${record.filename}.txt`)
  }
}

const showPreview = ref(false)
const renderedContent = computed(() => {
  if (selectedRecord.value && selectedRecord.value.content) {
    return marked(selectedRecord.value.content)
  }
  return ''
})

const showContentPreview = () => {
  showPreview.value = true
}

// 音频播放相关状态
const audioRef = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const audioError = ref(false)
const audioObjectUrl = ref(null)

// 检查是否为音频文件
const isAudioFile = (filename) => {
  if (!filename) return false
  
  // 扩展音频格式支持，包括移动端常见格式
  const audioExtensions = [
    '.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', 
    '.webm', '.mp4', '.3gp', '.amr', '.opus'
  ]
  
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'))
  const isAudio = audioExtensions.includes(ext)
  
  // 特殊处理：即使文件名没有音频扩展名，也要检查是否是音频内容
  // 例如录制的音频可能被命名为其他格式
  if (!isAudio && filename) {
    // 检查文件名中是否包含音频相关关键词
    const audioKeywords = ['录音', '音频', 'audio', 'voice', 'record', '🎵', '🎤']
    const hasAudioKeyword = audioKeywords.some(keyword => 
      filename.toLowerCase().includes(keyword.toLowerCase())
    )
    if (hasAudioKeyword) {
      console.log('🎵 通过关键词检测到音频文件:', filename)
      return true
    }
  }
  
  console.log(`🔍 文件格式检测: ${filename} -> ${isAudio ? '音频文件' : '非音频文件'}`)
  return isAudio
}

// 格式化时间显示
const formatTime = (seconds) => {
  if (isNaN(seconds) || !isFinite(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 加载音频的回退方案
const loadAudioWithFetch = async (url) => {
  try {
    console.log('尝试使用fetch加载音频:', url)
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    const blob = await response.blob()
    
    // 清理之前的对象URL
    if (audioObjectUrl.value) {
      URL.revokeObjectURL(audioObjectUrl.value)
    }
    
    audioObjectUrl.value = URL.createObjectURL(blob)
    
    if (audioRef.value) {
      audioRef.value.src = audioObjectUrl.value
      audioRef.value.load()
    }
    
    console.log('音频通过fetch加载成功')
    return true
  } catch (error) {
    console.error('fetch加载音频失败:', error)
    return false
  }
}

// 音频播放控制
const toggleAudioPlayback = async () => {
  if (!audioRef.value) return
  
  if (isPlaying.value) {
    audioRef.value.pause()
  } else {
    try {
      await audioRef.value.play()
    } catch (error) {
      console.error('播放失败，尝试重新加载:', error)
      // 如果播放失败，尝试重新加载音频
      const success = await loadAudioWithFetch(getDownloadUrl(selectedRecord.value))
      if (success) {
        setTimeout(async () => {
          try {
            await audioRef.value.play()
          } catch (retryError) {
            console.error('重试播放仍然失败:', retryError)
            alertStore.showAlert('音频播放失败，请尝试直接下载', 'error')
          }
        }, 500)
      }
    }
  }
}

// 音频事件处理
const onAudioLoadedMetadata = () => {
  if (audioRef.value) {
    duration.value = audioRef.value.duration || 0
    audioError.value = false
    console.log('音频元数据加载成功，时长:', duration.value)
  }
}

const onAudioTimeUpdate = () => {
  if (audioRef.value) {
    currentTime.value = audioRef.value.currentTime || 0
  }
}

const onAudioPlay = () => {
  isPlaying.value = true
  console.log('音频开始播放')
}

const onAudioPause = () => {
  isPlaying.value = false
  console.log('音频暂停播放')
}

const onAudioEnded = () => {
  isPlaying.value = false
  currentTime.value = 0
  if (audioRef.value) {
    audioRef.value.currentTime = 0
  }
  console.log('音频播放结束')
}

const onAudioError = async (event) => {
  console.error('音频加载失败:', event)
  console.error('音频元素错误:', audioRef.value?.error)
  console.error('当前音频URL:', audioRef.value?.src)
  console.error('音频文件信息:', selectedRecord.value)
  
  // 如果还没有尝试过fetch方案，先尝试
  if (!audioObjectUrl.value && selectedRecord.value) {
    console.log('🔄 尝试使用fetch方案重新加载音频')
    const success = await loadAudioWithFetch(getDownloadUrl(selectedRecord.value))
    if (success) {
      // 成功加载，不显示错误
      console.log('✅ fetch方案加载成功')
      return
    }
    
    // 如果fetch也失败，尝试不同的URL变体
    console.log('🔄 尝试直接访问原始URL')
    const originalUrl = selectedRecord.value.downloadUrl
    if (originalUrl && originalUrl !== getDownloadUrl(selectedRecord.value)) {
      const directSuccess = await loadAudioWithFetch(originalUrl)
      if (directSuccess) {
        console.log('✅ 直接URL访问成功')
        return
      }
    }
  }
  
  // 如果所有方案都失败了，才显示错误
  audioError.value = true
  isPlaying.value = false
  
  // 提供更详细的错误信息
  let errorMessage = '音频加载失败'
  if (audioRef.value?.error) {
    switch (audioRef.value.error.code) {
      case 1:
        errorMessage = '音频加载被中止'
        break
      case 2:
        errorMessage = '网络错误，无法加载音频'
        break
      case 3:
        errorMessage = '音频解码失败，可能是格式兼容性问题'
        break
      case 4:
        errorMessage = `音频格式不受支持 (${selectedRecord.value?.filename || '未知格式'})`
        break
      default:
        errorMessage = '未知音频错误'
    }
  }
  
  // 针对webm格式提供特殊提示
  if (selectedRecord.value?.filename?.toLowerCase().includes('.webm')) {
    errorMessage += '\n\n💡 WebM音频在某些移动设备上可能不支持，建议直接下载'
  }
  
  alertStore.showAlert(errorMessage + '\n\n请尝试直接下载音频文件', 'error', 8000)
}
</script>

<style scoped>
@keyframes blob {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  25% {
    transform: translate(20px, -50px) scale(1.1);
  }

  50% {
    transform: translate(-20px, 20px) scale(0.9);
  }

  75% {
    transform: translate(50px, 50px) scale(1.05);
  }
}

@media (min-width: 640px) {
  .sm\:w-120 {
    width: 30rem;
    /* 480px */
  }
}

.animate-spin-slow {
  animation: spin 8s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.w-97-100 {
  width: 97%;
}

/* 添加 Markdown 样式 */
:deep(.prose) {
  text-align: left;
}

:deep(.prose h1),
:deep(.prose h2),
:deep(.prose h3),
:deep(.prose h4),
:deep(.prose h5),
:deep(.prose h6) {
  color: rgb(79, 70, 229);
  /* text-indigo-600 */
}

@media (prefers-color-scheme: dark) {

  :deep(.prose h1),
  :deep(.prose h2),
  :deep(.prose h3),
  :deep(.prose h4),
  :deep(.prose h5),
  :deep(.prose h6) {
    color: rgb(129, 140, 248);
    /* text-indigo-400 */
  }
}

/* 添加新的宽度类 */
@media (min-width: 640px) {
  .sm\:w-120 {
    width: 30rem;
    /* 480px */
  }
}

/* 自定义滚动条样式 */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 3px;
  transition: background-color 0.3s;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.5);
}

/* 深色模式下的滚动条样式 */
:deep([class*='dark']) .custom-scrollbar {
  scrollbar-color: rgba(75, 85, 99, 0.3) transparent;
}

:deep([class*='dark']) .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(75, 85, 99, 0.3);
}

:deep([class*='dark']) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(75, 85, 99, 0.5);
}
</style>
