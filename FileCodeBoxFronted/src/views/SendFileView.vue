<template>
  <div
    class="min-h-screen flex items-center justify-center p-4 overflow-hidden transition-colors duration-300"
    @paste.prevent="handlePaste"
  >
    <div
      class="rounded-3xl shadow-2xl overflow-hidden border w-full max-w-md transition-colors duration-300"
      :class="[
        isDarkMode
          ? 'bg-white bg-opacity-10 backdrop-filter backdrop-blur-xl border-gray-700'
          : 'bg-white border-gray-200'
      ]"
    >
      <div class="p-8">
        <h2
          class="text-3xl font-extrabold text-center mb-8 cursor-pointer transition-colors duration-300"
          :class="[
            isDarkMode
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300'
              : 'text-indigo-600'
          ]"
          @click="toRetrieve"
        >
          {{ config.name }}
        </h2>
        <form @submit.prevent="handleSubmit" class="space-y-8">
          <!-- 发送类型选择 -->
          <div class="flex justify-center space-x-2 mb-6">
            <button
              type="button"
              @click="sendType = 'file'"
              :class="[
                'px-3 py-2 rounded-lg text-sm',
                sendType === 'file' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'
              ]"
            >
              发送文件
            </button>
            <button
              type="button"
              @click="sendType = 'text'"
              :class="[
                'px-3 py-2 rounded-lg text-sm',
                sendType === 'text' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'
              ]"
            >
              发送文本
            </button>
            <button
              type="button"
              @click="sendType = 'audio'"
              :class="[
                'px-3 py-2 rounded-lg text-sm',
                sendType === 'audio' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'
              ]"
            >
              音频录制
            </button>
            <!-- <button
              type="button"
              @click="sendType = 'collect'"
              :class="[
                'px-4 py-2 rounded-lg',
                sendType === 'collect' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'
              ]"
            >
              收集文件
            </button> -->
          </div>

          <transition name="fade" mode="out-in">
            <div v-if="sendType === 'file'" key="file" class="grid grid-cols-1 gap-8">
              <!-- 文件上传区域 -->
              <div
                class="rounded-xl p-8 flex flex-col items-center justify-center border-2 border-dashed transition-all duration-300 group cursor-pointer relative"
                :class="[
                  isDarkMode
                    ? 'bg-gray-800 bg-opacity-50 border-gray-600 hover:border-indigo-500'
                    : 'bg-gray-100 border-gray-300 hover:border-indigo-500'
                ]"
                @click="triggerFileUpload"
                @dragover.prevent
                @drop.prevent="handleFileDrop"
              >
                <input
                  id="file-upload"
                  type="file"
                  class="hidden"
                  @change="handleFileUpload"
                  ref="fileInput"
                />
                <div class="absolute inset-0 w-full h-full" v-if="uploadProgress > 0">
                  <BorderProgressBar :progress="uploadProgress" />
                </div>
                <UploadCloudIcon
                  :class="[
                    'w-16 h-16 transition-colors duration-300',
                    isDarkMode
                      ? 'text-gray-400 group-hover:text-indigo-400'
                      : 'text-gray-600 group-hover:text-indigo-600'
                  ]"
                />
                <p
                  :class="[
                    'mt-4 text-sm transition-colors duration-300 w-full text-center',
                    isDarkMode
                      ? 'text-gray-400 group-hover:text-indigo-400'
                      : 'text-gray-600 group-hover:text-indigo-600'
                  ]"
                >
                  <span class="block truncate">
                    {{ selectedFile ? selectedFile.name : '点击或拖放文件到此处上传' }}
                  </span>
                </p>
                <p :class="['mt-2 text-xs', isDarkMode ? 'text-gray-500' : 'text-gray-400']">
                  支持各种常见格式，最大{{ getStorageUnit(config.uploadSize) }}
                </p>
              </div>
            </div>
            <div v-else-if="sendType === 'text'" key="text" class="grid grid-cols-1 gap-8">
              <!-- 文本输入区域 -->
              <div class="flex flex-col">
                <textarea
                  id="text-content"
                  v-model="textContent"
                  rows="7"
                  :class="[
                    'flex-grow px-4 py-3 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 resize-none',
                    isDarkMode
                      ? 'bg-gray-800 bg-opacity-50 text-white'
                      : 'bg-white text-gray-900 border border-gray-300'
                  ]"
                  placeholder="在此输入要发送的文本..."
                ></textarea>
              </div>
            </div>
            <div v-else-if="sendType === 'audio'" key="audio" class="grid grid-cols-1 gap-8">
              <!-- 音频录制区域 -->
              <div class="text-center">
                <!-- 浏览器兼容性检查 -->
                <div v-if="!isAudioSupported" class="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
                  <p class="text-yellow-800 text-sm">
                    ⚠️ 音频录制功能需要在HTTPS环境下运行，或在支持的浏览器中使用。
                  </p>
                </div>

                <!-- 手机录音指导 -->
                <div v-if="isAudioSupported" class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div class="text-blue-800 text-sm space-y-2">
                    <p class="font-medium">📱 手机录音提示：</p>
                    <ul class="list-disc list-inside space-y-1 text-left">
                      <li>确保网站使用HTTPS协议</li>
                      <li>点击录音按钮时允许麦克风权限</li>
                      <li>如果权限被拒绝，点击地址栏的🔒或🎤图标重新授权</li>
                      <li>关闭其他可能占用麦克风的应用</li>
                    </ul>
                  </div>
                </div>

                <!-- 录制按钮 - 支持重新录制 -->
                <button
                  type="button"
                  @click="toggleRecording"
                  :disabled="!isAudioSupported"
                  class="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="[
                    isRecording 
                      ? 'bg-gradient-to-br from-green-500 to-green-600 animate-pulse' 
                      : audioBlob 
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600' 
                        : 'bg-gradient-to-br from-red-500 to-red-600'
                  ]"
                >
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path 
                      v-if="!isRecording"
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      stroke-width="2" 
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                    <path 
                      v-else
                      stroke-linecap="round" 
                      stroke-linejoin="round" 
                      stroke-width="2" 
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10h6v4H9z"
                    />
                  </svg>
                </button>

                <!-- 录制状态提示 -->
                <div class="text-center mb-4">
                  <div v-if="isRecording" class="text-2xl font-mono font-bold text-green-600 mb-2">{{ formatTime(recordingTime) }}</div>
                  <p class="text-sm text-gray-600" :class="[isDarkMode ? 'text-gray-400' : 'text-gray-600']">
                    <span v-if="isRecording">正在录制... 点击停止</span>
                    <span v-else-if="audioBlob">录制完成，点击重新录制</span>
                    <span v-else>点击开始录制</span>
                  </p>
                </div>

                <!-- 音频播放器 -->
                <audio 
                  v-if="audioBlob" 
                  :src="audioBlobUrl" 
                  controls 
                  class="w-full rounded-lg mb-4"
                ></audio>

                <!-- 音频文件名输入 -->
                <div class="mt-6">
                  <label :class="['block text-sm font-medium mb-2', isDarkMode ? 'text-gray-300' : 'text-gray-700']">
                    录音文件名
                  </label>
                  <input
                    v-model="audioFileName"
                    type="text"
                    placeholder="我的录音"
                    :class="[
                      'w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300',
                      isDarkMode
                        ? 'bg-gray-800 bg-opacity-50 text-white border border-gray-600'
                        : 'bg-white text-gray-900 border border-gray-300'
                    ]"
                  />
                </div>


              </div>
            </div>
          </transition>
          
          <!-- 过期方式选择 -->
          <div class="flex flex-col space-y-3">
            <label :class="['text-sm font-medium', isDarkMode ? 'text-gray-300' : 'text-gray-700']">
              过期时间
            </label>
            <div class="relative flex-grow group">
              <div
                :class="[
                  'relative h-11 rounded-xl border transition-all duration-300',
                  isDarkMode
                    ? 'bg-gray-800/50 border-gray-700/50 group-hover:border-gray-600'
                    : 'bg-white border-gray-200 group-hover:border-gray-300'
                ]"
              >
                <template v-if="expirationMethod !== 'forever'">
                  <input
                    v-model="expirationValue"
                    type="number"
                    :placeholder="getPlaceholder()"
                    min="1"
                    :class="[
                      'w-full h-full px-4 pr-32 rounded-xl placeholder-gray-400 transition-all duration-300',
                      'focus:outline-none focus:ring-2 focus:ring-offset-0',
                      '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                      'bg-transparent',
                      isDarkMode
                        ? 'text-gray-100 focus:ring-indigo-500/70 placeholder-gray-500'
                        : 'text-gray-900 focus:ring-indigo-500/50 placeholder-gray-400'
                    ]"
                  />
                  <div
                    class="absolute right-24 top-0 h-full flex flex-col border-l"
                    :class="[isDarkMode ? 'border-gray-700/50' : 'border-gray-200']"
                  >
                    <button
                      type="button"
                      @click="incrementValue(1)"
                      class="flex-1 px-2 flex items-center justify-center transition-all duration-200"
                      :class="[
                        isDarkMode
                          ? 'hover:bg-gray-700/50 text-gray-400 hover:text-gray-200'
                          : 'hover:bg-gray-50 text-gray-500 hover:text-gray-700'
                      ]"
                    >
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      @click="incrementValue(-1)"
                      class="flex-1 px-2 flex items-center justify-center transition-all duration-200"
                      :class="[
                        isDarkMode
                          ? 'hover:bg-gray-700/50 text-gray-400 hover:text-gray-200'
                          : 'hover:bg-gray-50 text-gray-500 hover:text-gray-700'
                      ]"
                    >
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>
                </template>
                <select
                  v-model="expirationMethod"
                  :class="[
                    'absolute right-0 top-0 h-full appearance-none cursor-pointer',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    expirationMethod === 'forever' ? 'w-full px-4' : 'w-24 pl-3 pr-8 border-l',
                    isDarkMode
                      ? 'text-gray-100 border-gray-700/50 focus:ring-indigo-500/70 bg-gray-800/50'
                      : 'text-gray-900 border-gray-200 focus:ring-indigo-500/50 bg-white'
                  ]"
                >
                  <option
                    v-for="item in config.expireStyle"
                    :value="item"
                    :key="item"
                    :class="[isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900']"
                  >
                    {{ getUnit(item) }}
                  </option>
                </select>
                <div
                  class="absolute pointer-events-none"
                  :class="[
                    expirationMethod === 'forever' ? 'right-3' : 'right-2',
                    'top-1/2 -translate-y-1/2'
                  ]"
                >
                  <svg
                    class="w-4 h-4 transition-colors duration-300"
                    :class="[isDarkMode ? 'text-gray-400' : 'text-gray-500']"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <!-- 提交按钮 -->
          <button
            type="submit"
            :disabled="!canSubmit"
            class="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold py-4 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span
              class="absolute top-0 left-0 w-full h-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"
            ></span>
            <span class="relative z-10 flex items-center justify-center text-lg">
              <SendIcon class="w-6 h-6 mr-2" />
              <span>安全寄送</span>
            </span>
          </button>
        </form>
        <div class="mt-6 text-center">
          <router-link to="/" class="text-indigo-400 hover:text-indigo-300 transition duration-300">
            需要取件？点击这里
          </router-link>
        </div>
      </div>

      <div
        class="px-8 py-4 bg-opacity-50 flex justify-between items-center"
        :class="[isDarkMode ? 'bg-gray-800' : 'bg-gray-100']"
      >
        <span
          class="text-sm flex items-center"
          :class="[isDarkMode ? 'text-gray-300' : 'text-gray-800']"
        >
          <ShieldCheckIcon class="w-4 h-4 mr-1 text-green-400" />
          安全加密
        </span>
        <button
          @click="toggleDrawer"
          class="text-sm hover:text-indigo-300 transition duration-300 flex items-center"
          :class="[isDarkMode ? 'text-indigo-400' : 'text-indigo-600']"
        >
          发件记录
          <ClipboardListIcon class="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>

    <!-- 抽屉式发件记录 -->
    <transition name="drawer">
      <div
        v-if="showDrawer"
        class="fixed inset-y-0 right-0 w-full sm:w-120 bg-opacity-70 backdrop-filter backdrop-blur-xl shadow-2xl z-50 overflow-hidden flex flex-col"
        :class="[isDarkMode ? 'bg-gray-900' : 'bg-white']"
      >
        <div
          class="flex justify-between items-center p-6 border-b"
          :class="[isDarkMode ? 'border-gray-700' : 'border-gray-200']"
        >
          <h3
            class="text-xl font-semibold"
            :class="[isDarkMode ? 'text-white' : 'text-gray-900']"
          >
            发件记录
          </h3>
          <button
            @click="toggleDrawer"
            class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <XIcon
              class="w-6 h-6"
              :class="[isDarkMode ? 'text-gray-400' : 'text-gray-500']"
            />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6">
          <transition-group name="list" tag="div" class="space-y-4">
            <div
              v-for="record in sendRecords"
              :key="record.id"
              class="rounded-xl p-4 border transition-all duration-300 hover:shadow-md"
              :class="[
                isDarkMode
                  ? 'bg-gray-800 bg-opacity-50 border-gray-700 hover:border-gray-600'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              ]"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <h4
                    class="font-medium text-sm truncate"
                    :class="[isDarkMode ? 'text-white' : 'text-gray-900']"
                  >
                    {{ record.filename }}
                  </h4>
                  <p
                    class="text-xs mt-1 truncate"
                    :class="[isDarkMode ? 'text-gray-400' : 'text-gray-500']"
                  >
                    {{ record.size }} · {{ record.date }}
                  </p>
                  <p
                    class="text-xs mt-1 truncate"
                    :class="[isDarkMode ? 'text-gray-400' : 'text-gray-500']"
                  >
                    {{ record.expiration }}
                  </p>
                </div>
                <div class="flex space-x-2 ml-3">
                  <button
                    @click="viewDetails(record)"
                    class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <EyeIcon
                      class="w-4 h-4"
                      :class="[isDarkMode ? 'text-gray-400' : 'text-gray-500']"
                    />
                  </button>
                  <button
                    @click="deleteRecord(record.id)"
                    class="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                  >
                    <TrashIcon class="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          </transition-group>

          <div
            v-if="sendRecords.length === 0"
            class="text-center py-12"
          >
            <FileIcon
              class="w-16 h-16 mx-auto mb-4"
              :class="[isDarkMode ? 'text-gray-600' : 'text-gray-300']"
            />
            <p :class="[isDarkMode ? 'text-gray-400' : 'text-gray-500']">
              暂无发件记录
            </p>
          </div>
        </div>
      </div>
    </transition>

    <!-- 文件详情弹窗 -->
    <transition name="fade">
      <div
        v-if="selectedRecord"
        class="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-md flex items-center justify-center z-50 p-4"
        @click.self="selectedRecord = null"
      >
        <div
          class="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300"
          :class="[isDarkMode ? 'bg-gray-900' : 'bg-white']"
        >
          <!-- 头部 -->
          <div
            class="px-4 sm:px-6 py-3 sm:py-4 border-b flex justify-between items-center"
            :class="[isDarkMode ? 'border-gray-800 bg-gray-800' : 'border-gray-100 bg-gray-50']"
          >
            <div class="min-w-0 flex-1">
              <h3
                class="text-base sm:text-lg font-semibold truncate"
                :class="[isDarkMode ? 'text-white' : 'text-gray-900']"
              >
                文件详情
              </h3>
              <button
                @click="selectedRecord = null"
                class="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <XIcon
                  class="w-4 h-4 sm:w-5 sm:h-5"
                  :class="[isDarkMode ? 'text-gray-400' : 'text-gray-500']"
                />
              </button>
            </div>
          </div>

          <!-- 主要内容区域 -->
          <div class="p-4 sm:p-6">
            <!-- 文件信息卡片 -->
            <div
              class="rounded-xl p-3 sm:p-4 mb-4 sm:mb-6"
              :class="[isDarkMode ? 'bg-gray-800 bg-opacity-50' : 'bg-gray-50 bg-opacity-95']"
            >
              <div class="flex items-center mb-3 sm:mb-4">
                <div
                  class="p-2 sm:p-3 rounded-lg"
                  :class="[isDarkMode ? 'bg-gray-800' : 'bg-white']"
                >
                  <FileIcon
                    class="w-5 h-5 sm:w-6 sm:h-6"
                    :class="[isDarkMode ? 'text-indigo-400' : 'text-indigo-600']"
                  />
                </div>
                <div class="ml-3 sm:ml-4 min-w-0 flex-1">
                  <h4
                    class="font-medium text-sm sm:text-base truncate"
                    :class="[isDarkMode ? 'text-white' : 'text-gray-900']"
                  >
                    {{ selectedRecord.filename }}
                  </h4>
                  <p
                    class="text-xs sm:text-sm truncate"
                    :class="[isDarkMode ? 'text-gray-400' : 'text-gray-500']"
                  >
                    {{ selectedRecord.size }} · {{ selectedRecord.date }}
                  </p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3 sm:gap-4">
                <div class="flex items-center min-w-0">
                  <ClockIcon
                    class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0"
                    :class="[isDarkMode ? 'text-gray-400' : 'text-gray-500']"
                  />
                  <span
                    class="text-xs sm:text-sm truncate"
                    :class="[isDarkMode ? 'text-gray-300' : 'text-gray-600']"
                  >
                    {{ selectedRecord.expiration }}
                  </span>
                </div>
                <div class="flex items-center min-w-0">
                  <ShieldCheckIcon
                    class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0"
                    :class="[isDarkMode ? 'text-gray-400' : 'text-gray-500']"
                  />
                  <span
                    class="text-xs sm:text-sm truncate"
                    :class="[isDarkMode ? 'text-gray-300' : 'text-gray-600']"
                  >
                    安全加密
                  </span>
                </div>
              </div>
            </div>

            <!-- 取件码和二维码区域 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <!-- 左侧取件码 -->
              <div class="space-y-3 sm:space-y-4">
                <div
                  class="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 sm:p-5 text-white"
                >
                  <div class="flex items-center justify-between mb-3 sm:mb-4">
                    <h4 class="font-medium text-sm sm:text-base">取件码</h4>
                    <button
                      @click="copyRetrieveCode(selectedRecord.retrieveCode)"
                      class="p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                      <ClipboardCopyIcon class="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                  <p class="text-2xl sm:text-3xl font-bold tracking-wider text-center break-all">
                    {{ selectedRecord.retrieveCode }}
                  </p>
                </div>

                <div
                  class="rounded-xl p-3 sm:p-4"
                  :class="[isDarkMode ? 'bg-gray-800 bg-opacity-50' : 'bg-gray-50 bg-opacity-95']"
                >
                  <div class="flex items-center justify-between mb-2 sm:mb-3">
                    <h4
                      class="font-medium text-sm sm:text-base flex items-center min-w-0"
                      :class="[isDarkMode ? 'text-white' : 'text-gray-900']"
                    >
                      <TerminalIcon
                        class="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-indigo-500 flex-shrink-0"
                      />
                      <span class="truncate">wget下载</span>
                    </h4>
                    <button
                      @click="copyWgetCommand(selectedRecord.retrieveCode, selectedRecord.filename)"
                      class="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                    >
                      <ClipboardCopyIcon
                        class="w-4 h-4 sm:w-5 sm:h-5"
                        :class="[isDarkMode ? 'text-gray-400' : 'text-gray-500']"
                      />
                    </button>
                  </div>
                  <p
                    class="text-xs sm:text-sm font-mono break-all line-clamp-2"
                    :class="[isDarkMode ? 'text-gray-300' : 'text-gray-600']"
                  >
                    点击复制wget命令
                  </p>
                </div>
              </div>

              <!-- 右侧二维码 -->
              <div
                class="rounded-xl p-4 sm:p-5 flex flex-col items-center"
                :class="[isDarkMode ? 'bg-gray-800 bg-opacity-50' : 'bg-gray-50 bg-opacity-95']"
              >
                <div class="bg-white p-3 sm:p-4 rounded-lg shadow-sm mb-3 sm:mb-4">
                  <QRCode
                    :value="getQRCodeValue(selectedRecord)"
                    :size="140"
                    level="M"
                    class="sm:w-[160px] sm:h-[160px]"
                  />
                </div>
                <p
                  class="text-xs sm:text-sm truncate max-w-full"
                  :class="[isDarkMode ? 'text-gray-400' : 'text-gray-500']"
                >
                  扫描二维码快速取件
                </p>
              </div>
            </div>
          </div>

          <!-- 底部操作栏 -->
          <div
            class="px-4 sm:px-6 py-3 sm:py-4 border-t"
            :class="[isDarkMode ? 'border-gray-800' : 'border-gray-100']"
          >
            <button
              @click="copyRetrieveLink(selectedRecord.retrieveCode)"
              class="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors"
            >
              复制取件链接
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted, computed, onUnmounted } from 'vue'
import {
  UploadCloudIcon,
  SendIcon,
  ClipboardListIcon,
  XIcon,
  TrashIcon,
  FileIcon,
  ClockIcon,
  EyeIcon,
  ShieldCheckIcon,
  ClipboardCopyIcon,
  TerminalIcon
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import BorderProgressBar from '@/components/common/BorderProgressBar.vue'
import QRCode from 'qrcode.vue'
import { useFileDataStore } from '@/stores/fileData'
import api from '@/utils/api'
import { copyRetrieveLink, copyRetrieveCode, copyWgetCommand } from '@/utils/clipboard'
import { getStorageUnit } from '@/utils/convert'

const config: any = JSON.parse(localStorage.getItem('config') || '{}')

const router = useRouter()
const isDarkMode = inject('isDarkMode')
const fileDataStore = useFileDataStore()

const sendType = ref('file')
const selectedFile = ref<File | null>(null)
const textContent = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const expirationMethod = ref('day')
const expirationValue = ref('1')
const uploadProgress = ref(0)
const showDrawer = ref(false)
const selectedRecord = ref<any>(null)

// 音频录制相关的响应式数据
const isRecording = ref(false)
const recordingTime = ref(0)
const audioBlob = ref<Blob | null>(null)
const audioBlobUrl = ref<string>('')
const audioFileName = ref('我的录音')
const audioActualMimeType = ref<string>('') // 🎯 存储实际录制的MIME类型
// 追踪是否需要在获得取件码后立即复制（音频录制完成时设置）
const shouldAutoCopyAfterUpload = ref(false)
const mediaRecorder = ref<MediaRecorder | null>(null)
const recordingStartTime = ref<number>(0)
const recordingTimer = ref<number | null>(null)
const audioChunks = ref<Blob[]>([])

// 音频支持检查
const isAudioSupported = computed(() => {
  if (typeof window === 'undefined') return false
  
  const hasMediaDevices = !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function')
  const hasMediaRecorder = typeof window.MediaRecorder !== 'undefined'
  const isSecureContext = window.isSecureContext || 
                          location.hostname === 'localhost' || 
                          location.hostname === '127.0.0.1' ||
                          location.protocol === 'https:'
  
  return hasMediaDevices && hasMediaRecorder && isSecureContext
})

// 提交按钮状态 - 录制时禁用
const canSubmit = computed(() => {
  // 录制过程中禁用提交按钮
  if (isRecording.value) {
    return false
  }
  
  if (sendType.value === 'file') {
    return selectedFile.value !== null
  } else if (sendType.value === 'text') {
    return textContent.value.trim() !== ''
  } else if (sendType.value === 'audio') {
    return audioBlob.value !== null
  }
  return false
})

import { useAlertStore } from '@/stores/alertStore'

const alertStore = useAlertStore()
const sendRecords = computed(() => fileDataStore.shareData)

const fileHash = ref('')

// 检查设备音频录制兼容性，完全避免WebM格式
const getMimeTypeForDevice = () => {
  // 检测设备类型
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
  
  // 🚫 完全不使用WebM格式，优先使用MP4/MP3/WAV
  const types = isMobile ? [
    'audio/mp4',                    // MP4容器，通常包含AAC编码，移动端最佳
    'audio/mp4;codecs=mp4a.40.2',   // 明确指定AAC-LC编码
    'audio/mpeg',                   // MP3格式，广泛支持
    'audio/mp3',                    // MP3格式的另一种MIME类型
    'audio/wav',                    // WAV格式，通用但文件较大
    'audio/ogg;codecs=opus'         // 仅作为最后备选
  ] : [
    'audio/mp4',                    // 桌面端也优先MP4
    'audio/mp4;codecs=mp4a.40.2',   // AAC编码
    'audio/mpeg',                   // MP3
    'audio/mp3',                    // MP3的另一种MIME类型
    'audio/wav',                    // WAV格式
    'audio/ogg;codecs=opus'         // 仅作为最后备选，不使用WebM
  ]
  
  console.log(`🎵 检测音频格式支持 (${isMobile ? '移动端' : '桌面端'}) - 不使用WebM:`)
  
  for (const type of types) {
    const isSupported = MediaRecorder.isTypeSupported(type)
    console.log(`${type}: ${isSupported ? '✅支持' : '❌不支持'}`)
    if (isSupported) {
      console.log(`🎯 选择音频格式: ${type}`)
      
      // 对于移动端，特别是iOS，给出格式说明
      if (isMobile) {
        if (type.includes('mp4') || type.includes('aac')) {
          console.log('📱 使用移动端优化的AAC格式，确保最佳兼容性和播放支持')
        } else if (type.includes('mpeg') || type.includes('mp3')) {
          console.log('📱 使用MP3格式，移动端广泛支持且播放兼容性好')
        } else if (type.includes('wav')) {
          console.log('📱 使用WAV格式，通用性好但文件较大')
        }
      }
      
      return type
    }
  }
  
  console.log('⚠️ 未找到首选的音频格式')
  console.log('🔄 强制使用兼容性最好的格式')
  
  // 🎯 如果都不支持，强制使用最兼容的格式
  // 不返回空字符串避免浏览器选择WebM
  return 'audio/wav' // 使用WAV作为最后的回退格式
}

// 音频录制相关方法 - 支持重新录制
const toggleRecording = async () => {
  if (!isAudioSupported.value) {
    alertStore.showAlert('您的浏览器不支持音频录制功能，请使用HTTPS协议或支持的浏览器', 'error')
    return
  }

  if (isRecording.value) {
    // 如果正在录制，则停止录制
    stopRecording()
  } else {
    // 如果不在录制状态，检查是否有已录制的内容
    if (audioBlob.value) {
      // 如果有录音，则重新开始录制（重置之前的录音）
      resetRecording()
    }
    // 开始新的录制
    await startRecording()
  }
}

const startRecording = async () => {
  try {
    // 开始新录制时，重置自动复制标志
    shouldAutoCopyAfterUpload.value = false
    
    // 检查权限状态 (在支持的浏览器中)
    if (navigator.permissions) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        if (permissionStatus.state === 'denied') {
          alertStore.showAlert('麦克风权限被拒绝，请在浏览器设置中允许麦克风访问权限', 'error')
          return
        }
      } catch (error) {
        console.log('无法查询权限状态，继续尝试录音')
      }
    }

    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        // 针对手机优化的设置
        sampleRate: { ideal: 44100, min: 16000 },
        channelCount: { ideal: 1 },
        sampleSize: { ideal: 16 }
      } 
    })
    
    // 获取适合当前设备的MIME类型
    const mimeType = getMimeTypeForDevice()
    const options = mimeType ? { mimeType } : {}
    
    mediaRecorder.value = new MediaRecorder(stream, options)
    
    audioChunks.value = []
    
    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.value.push(event.data)
      }
    }
    
    mediaRecorder.value.onstop = () => {
      // 使用实际录制的格式，不进行强制转换
      let finalMimeType = mimeType
      
      // 如果预设格式为空，检测实际录制格式
      if (!finalMimeType && mediaRecorder.value && mediaRecorder.value.mimeType) {
        finalMimeType = mediaRecorder.value.mimeType
        console.log('📋 检测到实际录制格式:', finalMimeType)
      }
      
      // 如果仍然无法确定格式，使用回退方案
      if (!finalMimeType) {
        finalMimeType = 'audio/wav'
        console.log('⚠️ 无法检测格式，使用WAV作为回退格式')
      }
      
      audioBlob.value = new Blob(audioChunks.value, { type: finalMimeType })
      audioBlobUrl.value = URL.createObjectURL(audioBlob.value)
      
      // 保存实际录制的MIME类型用于上传
      audioActualMimeType.value = finalMimeType
      
      // 根据实际录制的格式更新文件名后缀
      updateAudioFileName(finalMimeType)
      
      // 停止所有音频轨道
      stream.getTracks().forEach(track => track.stop())
      
      // 显示录制完成的格式信息
      console.log('🎤 录制完成！')
      console.log(`📁 实际录制格式: ${finalMimeType}`)
      console.log(`📏 文件大小: ${(audioBlob.value.size / 1024).toFixed(2)} KB`)
      console.log(`⏱️ 录制时长: ${recordingTime.value} 秒`)
      console.log(`📝 文件名: ${audioFileName.value}`)
      
      // 🎯 录制完成时，标记需要在上传成功后立即复制（移动端优化）
      shouldAutoCopyAfterUpload.value = true
      console.log('📋 已设置自动复制标志，将在上传成功后立即复制链接')
    }
    
    mediaRecorder.value.onerror = (event: Event) => {
      console.error('MediaRecorder错误:', event)
      alertStore.showAlert(`录音过程中发生错误`, 'error')
      // 清理资源
      stream.getTracks().forEach(track => track.stop())
    }
    
    mediaRecorder.value.start(1000)
    isRecording.value = true
    recordingStartTime.value = Date.now()
    
    // 开始计时
    recordingTimer.value = setInterval(() => {
      recordingTime.value = Math.floor((Date.now() - recordingStartTime.value) / 1000)
    }, 1000)
    
  } catch (error: any) {
    console.error('录音启动失败:', error)
    let errorMessage = '录音启动失败'
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMessage = '麦克风权限被拒绝。请在Chrome浏览器地址栏点击🔒或🎤图标，选择"允许"麦克风访问权限，然后刷新页面重试。'
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      errorMessage = '未找到麦克风设备，请确保您的设备已连接麦克风并在系统设置中启用'
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      errorMessage = '麦克风被其他应用占用，请关闭其他正在使用麦克风的应用程序，然后重试'
    } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
      errorMessage = '麦克风不支持所需的录音格式，请尝试使用其他设备'
    } else if (error.name === 'SecurityError') {
      errorMessage = '安全限制：请确保页面在HTTPS环境下运行'
    } else if (error.name === 'AbortError') {
      errorMessage = '录音请求被中断，请重试'
    } else {
      errorMessage = `录音启动失败: ${error.message || '未知错误'}`
    }
    
    alertStore.showAlert(errorMessage, 'error')
  }
}

const stopRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop()
    isRecording.value = false
    
    if (recordingTimer.value) {
      clearInterval(recordingTimer.value)
      recordingTimer.value = null
    }
  }
}

const resetRecording = () => {
  if (isRecording.value) {
    stopRecording()
  }
  
  audioBlob.value = null
  audioBlobUrl.value = ''
  audioChunks.value = []
  recordingTime.value = 0
  recordingStartTime.value = 0
  
  // 重置文件名为默认值
  audioFileName.value = '我的录音'
  
  // 🎯 重置保存的MIME类型和自动复制标志
  audioActualMimeType.value = ''
  shouldAutoCopyAfterUpload.value = false
  
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
    recordingTimer.value = null
  }
}

// 根据音频格式更新文件名后缀
const updateAudioFileName = (mimeType: string) => {
  const baseName = audioFileName.value.replace(/\.(mp3|mp4|wav|webm|ogg|m4a|aac)$/i, '')
  
  // 根据实际MIME类型确定对应的文件扩展名
  let extension = '.wav' // 默认扩展名
  
  if (mimeType.includes('mp4') || mimeType.includes('aac')) {
    extension = '.m4a'
  } else if (mimeType.includes('mpeg') || mimeType.includes('mp3')) {
    extension = '.mp3'
  } else if (mimeType.includes('webm')) {
    extension = '.webm'
  } else if (mimeType.includes('ogg')) {
    extension = '.ogg'
  } else if (mimeType.includes('wav')) {
    extension = '.wav'
  }
  
  audioFileName.value = baseName + extension
  console.log(`📝 文件名已更新为: ${audioFileName.value} (MIME: ${mimeType})`)
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 组件卸载时清理定时器
onUnmounted(() => {
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
  }
  if (audioBlobUrl.value) {
    URL.revokeObjectURL(audioBlobUrl.value)
  }
})

const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    selectedFile.value = file
    if (!checkUpload()) return
    fileHash.value = await calculateFileHash(file)
    console.log(fileHash.value)
  }
}

const handleFileDrop = async (event: DragEvent) => {
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    const file = event.dataTransfer.files[0]
    selectedFile.value = file
    if (!checkUpload()) return
    fileHash.value = await calculateFileHash(file)
  }
}

const handlePaste = async (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items) return

  for (const item of Array.from(items)) {
    if (item.kind === 'file') {
      const file = item.getAsFile()
      if (file) {
        // 检查文件是否为空
        if (file.size === 0) {
          alertStore.showAlert('无法读取空文件', 'error')
          return
        }

        selectedFile.value = file
        if (!checkUpload()) return

        try {
          fileHash.value = await calculateFileHash(file)
          alertStore.showAlert('已从剪贴板添加文件：' + file.name, 'success')
        } catch (error) {
          alertStore.showAlert('文件处理失败', 'error')
          console.error('File hash calculation failed:', error)
        }
        break
      }
    } else {
      sendType.value = 'text'
      items[0].getAsString((str: string) => {
        textContent.value += str
      })
    }
  }
}

const calculateFileHash = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const chunkSize = 2097152 // 保持 2MB 的切片大小用于计算哈希
    const fileReader = new FileReader()
    let currentChunk = 0
    const chunks = Math.ceil(file.size / chunkSize)

    fileReader.onload = async (e) => {
      const chunk = new Uint8Array(e.target!.result as ArrayBuffer)

      try {
        // 尝试使用 crypto.subtle.digest
        if (window.isSecureContext) {
          const hashBuffer = await crypto.subtle.digest('SHA-256', chunk)
          const hashArray = Array.from(new Uint8Array(hashBuffer))
          const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

          currentChunk++
          if (currentChunk < chunks) {
            loadNext()
          } else {
            resolve(hashHex)
          }
        } else {
          // 如果不是安全上下文（HTTP），则返回一个基于文件信息的替代哈希
          const fallbackHash = generateFallbackHash(file)
          resolve(fallbackHash)
        }
      } catch (error) {
        // 如果 crypto.subtle.digest 失败，使用替代方案
        const fallbackHash = generateFallbackHash(file)
        resolve(fallbackHash)
      }
    }

    const loadNext = () => {
      const start = currentChunk * chunkSize
      const end = start + chunkSize >= file.size ? file.size : start + chunkSize
      fileReader.readAsArrayBuffer(file.slice(start, end))
    }

    loadNext()
  })
}

// 生成替代哈希的函数
const generateFallbackHash = (file: File): string => {
  // 使用文件名、大小和最后修改时间生成一个简单的哈希
  const fileInfo = `${file.name}-${file.size}-${file.lastModified}`
  let hash = 0
  for (let i = 0; i < fileInfo.length; i++) {
    const char = fileInfo.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  // 转换为16进制字符串并填充到64位
  return Math.abs(hash).toString(16).padStart(64, '0')
}

const getPlaceholder = (value: string = expirationMethod.value) => {
  switch (value) {
    case 'day':
      return '输入天数'
    case 'hour':
      return '输入小时数'
    case 'minute':
      return '输入分钟数'
    case 'count':
      return '输入查看次数'
    case 'forever':
      return '永久'
    default:
      return '输入值'
  }
}

const getUnit = (value: string = expirationMethod.value) => {
  switch (value) {
    case 'day':
      return '天'
    case 'hour':
      return '小时'
    case 'minute':
      return '分钟'
    case 'count':
      return '次'
    case 'forever':
      return '永久'
    default:
      return ''
  }
}

const handleChunkUpload = async (file: File) => {
  try {
    // 默认切片大小为5MB
    const chunkSize = 5 * 1024 * 1024
    const chunks = Math.ceil(file.size / chunkSize)
    // 1. 初始化切片上传
    const initResponse: any = await api.post('chunk/upload/init/', {
      file_name: file.name,
      file_size: file.size,
      chunk_size: chunkSize,
      file_hash: fileHash.value
    })

    if (initResponse.code !== 200) {
      throw new Error('初始化切片上传失败')
    }
    if (initResponse.detail.existed) {
      return initResponse
    }
    const uploadId = initResponse.detail.upload_id

    // 2. 上传切片
    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunk = file.slice(start, end)

      const chunkFormData = new FormData()
      chunkFormData.append('chunk', new Blob([chunk], { type: file.type })) // 确保以Blob形式添加

      // 使用 application/x-www-form-urlencoded 格式
      const chunkResponse: any = await api.post(
        `chunk/upload/chunk/${uploadId}/${i}`,
        chunkFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent: any) => {
            const percentCompleted = Math.round(
              ((i * chunkSize + progressEvent.loaded) * 100) / file.size
            )
            uploadProgress.value = percentCompleted
          }
        }
      )

      if (chunkResponse.code !== 200) {
        throw new Error(`切片 ${i} 上传失败`)
      }
    }

    // 3. 完成上传
    const completeResponse: any = await api.post(`chunk/upload/complete/${uploadId}`, {
      expire_value: expirationValue.value ? parseInt(expirationValue.value) : 1,
      expire_style: expirationMethod.value
    })

    if (completeResponse.code !== 200) {
      throw new Error('完成上传失败')
    }

    return completeResponse
  } catch (error: any) {
    console.error('切片上传失败:', error)
    if (error.response?.data?.detail) {
      alertStore.showAlert(error.response.data.detail, 'error')
    } else {
      alertStore.showAlert('上传失败,请稍后重试', 'error')
    }
    throw error
  }
}

const handleDefaultFileUpload = async (file: File) => {
  const formData = new FormData()
  // 添加上传进度监听
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent: any) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      uploadProgress.value = percentCompleted
    }
  }
  formData.append('file', file)
  formData.append('expire_value', expirationValue.value)
  formData.append('expire_style', expirationMethod.value)
  const response: any = await api.post('share/file/', formData, config)
  return response
}

const handleAudioUpload = async () => {
  if (!audioBlob.value) {
    throw new Error('音频文件为空')
  }

  const fileName = audioFileName.value.trim() || '我的录音'
  const duration = recordingTime.value

  try {
    // 🎯 获取实际音频格式信息（优先使用保存的格式）
    const actualMimeType = audioActualMimeType.value || audioBlob.value.type || 'audio/wav'
    console.log('🔍 上传音频实际格式:', actualMimeType)
    console.log('📋 保存的格式:', audioActualMimeType.value)
    console.log('📦 Blob格式:', audioBlob.value.type)
    
    // 🎯 根据实际格式确定文件扩展名和format参数
    let fileExtension = '.wav'
    let formatParam = 'wav'
    
    if (actualMimeType.includes('mp4') || actualMimeType.includes('aac')) {
      fileExtension = '.m4a'
      formatParam = 'm4a'
    } else if (actualMimeType.includes('mpeg') || actualMimeType.includes('mp3')) {
      fileExtension = '.mp3'
      formatParam = 'mp3'
    } else if (actualMimeType.includes('wav')) {
      fileExtension = '.wav'
      formatParam = 'wav'
    } else if (actualMimeType.includes('ogg')) {
      fileExtension = '.ogg'
      formatParam = 'ogg'
         } else if (actualMimeType.includes('webm')) {
       fileExtension = '.webm'
       formatParam = 'webm'
     }
    
    // 🎯 确保文件名包含正确的扩展名
    const baseFileName = fileName.replace(/\.(mp3|mp4|wav|webm|ogg|m4a|aac)$/i, '')
    const fullFileName = baseFileName + fileExtension
    
    console.log('📤 上传参数:')
    console.log(`📁 文件名: ${fullFileName}`)
    console.log(`🎵 格式参数: ${formatParam}`)
    console.log(`🔖 MIME类型: ${actualMimeType}`)

    const formData = new FormData()
    formData.append('audio_file', audioBlob.value, fullFileName)
    formData.append('name', baseFileName) // 不包含扩展名的基础名称
    formData.append('duration', duration.toString())
    formData.append('format', formatParam) // 🎯 使用实际格式而非硬编码webm
    formData.append('expire_value', expirationValue.value)
    formData.append('expire_style', expirationMethod.value)

    const response: any = await api.post('share/audio/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent: any) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        uploadProgress.value = percentCompleted
      }
    })

    console.log('✅ 音频上传成功，实际使用格式:', formatParam)
    return response
  } catch (error: any) {
    console.error('❌ 音频上传失败:', error)
    throw error
  }
}

const checkOpenUpload = () => {
  if (config.openUpload === 0 && localStorage.getItem('token') === null) {
    alertStore.showAlert('游客上传功能已关闭', 'error')
    return false
  }
  return true
}

const checkFileSize = (file: File) => {
  if (file.size > config.uploadSize) {
    alertStore.showAlert(`文件大小超过限制 (${getStorageUnit(config.uploadSize)})`, 'error')
    selectedFile.value = null
    return false
  }
  return true
}

const checkExpirationTime = (method: string, value: string): boolean => {
  if (method === 'forever' || method === 'count') return true

  const maxSaveSeconds = config.max_save_seconds || 0
  if (maxSaveSeconds === 0) return true // 如果没有限制，直接返回true

  let totalSeconds = 0
  switch (method) {
    case 'minute':
      totalSeconds = parseInt(value) * 60
      break
    case 'hour':
      totalSeconds = parseInt(value) * 3600
      break
    case 'day':
      totalSeconds = parseInt(value) * 86400
      break
    default:
      return false
  }

  return totalSeconds <= maxSaveSeconds
}

const checkUpload = () => {
  if (!checkOpenUpload()) return false
  if (sendType.value === 'file' && selectedFile.value && !checkFileSize(selectedFile.value)) return false
  if (!checkExpirationTime(expirationMethod.value, expirationValue.value)) return false
  return true
}

const handleSubmit = async () => {
  if (sendType.value === 'file' && !selectedFile.value) {
    alertStore.showAlert('请选择要上传的文件', 'error')
    return
  }
  if (sendType.value === 'text' && !textContent.value.trim()) {
    alertStore.showAlert('请输入要发送的文本', 'error')
    return
  }
  if (sendType.value === 'audio' && !audioBlob.value) {
    alertStore.showAlert('请先录制音频', 'error')
    return
  }
  if (expirationMethod.value !== 'forever' && !expirationValue.value) {
    alertStore.showAlert('请输入过期值', 'error')
    return
  }

  // 添加过期时间验证
  if (!checkExpirationTime(expirationMethod.value, expirationValue.value)) {
    const maxDays = Math.floor(config.max_save_seconds / 86400)
    alertStore.showAlert(`过期时间不能超过${maxDays}天`, 'error')
    return
  }

  try {
    let response: any

    if (sendType.value === 'file') {
      // 使用切片上传替代原来的直接上传
      if (config.enableChunk) {
        response = await handleChunkUpload(selectedFile.value!)
      } else {
        response = await handleDefaultFileUpload(selectedFile.value!)
      }
    } else if (sendType.value === 'text') {
      // 文本上传保持不变
      const formData = new FormData()
      formData.append('text', textContent.value)
      formData.append('expire_value', expirationValue.value)
      formData.append('expire_style', expirationMethod.value)
      response = await api.post('share/text/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    } else if (sendType.value === 'audio') {
      // 音频上传
      response = await handleAudioUpload()
    }

    if (response && response.code === 200) {
      const retrieveCode = response.detail.code
      const fileName = response.detail.name
      
      // 🚀 统一复制策略：所有类型都尝试自动复制，针对iOS优化
      console.log(`📋 开始执行${sendType.value}类型的自动复制`)
      
      try {
        let copySuccess = false
        
        if (sendType.value === 'audio') {
          // 音频：使用特殊的重试策略
          console.log('🎵 音频上传成功，开始执行自动复制')
          copySuccess = await copyRetrieveLink(retrieveCode, 2) // 音频减少重试次数，因为时机更好
          if (copySuccess) {
            console.log('✅ 音频录制后自动复制成功')
          } else {
            console.log('❌ 音频录制后自动复制失败，已提供手动复制方案')
          }
          // 重置标志
          shouldAutoCopyAfterUpload.value = false
        } else if (sendType.value === 'file') {
          // 文件：立即尝试复制，iOS Chrome兼容性处理
          console.log('📁 文件上传成功，开始执行自动复制')
          copySuccess = await copyRetrieveLink(retrieveCode, 3) // 文件上传后可能需要更多重试
          if (copySuccess) {
            console.log('✅ 文件上传后自动复制成功')
          } else {
            console.log('❌ 文件上传后自动复制失败，已提供手动复制方案')
          }
        } else if (sendType.value === 'text') {
          // 文本：最佳时机，iOS Chrome通常支持良好
          console.log('📝 文本发送成功，开始执行自动复制')
          copySuccess = await copyRetrieveLink(retrieveCode, 1) // 文本只需1次尝试通常就能成功
          if (copySuccess) {
            console.log('✅ 文本发送后自动复制成功')
          } else {
            console.log('❌ 文本发送后自动复制失败，已提供手动复制方案')
          }
        }
        
      } catch (error) {
        console.error('复制链接时发生错误:', error)
      }
      
      // 根据不同类型计算大小和类型标识
      let size = ''
      let typeIndicator = ''
      
      if (sendType.value === 'text') {
        size = `${(textContent.value.length / 1024).toFixed(2)} KB`
        typeIndicator = '📝'
      } else if (sendType.value === 'audio') {
        const audioSize = audioBlob.value ? audioBlob.value.size : 0
        size = `${(audioSize / 1024).toFixed(2)} KB`
        typeIndicator = '🎵'
      } else {
        size = `${(selectedFile.value!.size / (1024 * 1024)).toFixed(1)} MB`
        typeIndicator = '📁'
      }
      
      // 添加新的发送记录
      const newRecord = {
        id: Date.now(),
        filename: `${typeIndicator} ${fileName}`,
        date: new Date().toISOString().split('T')[0],
        size: size,
        expiration:
          expirationMethod.value === 'forever'
            ? '永久'
            : `${expirationValue.value}${getUnit()}后过期`,
        retrieveCode: retrieveCode
      }
      fileDataStore.addShareData(newRecord)

      // 显示发送成功消息 - 针对iOS Chrome优化
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const isIOSChrome = /iPhone|iPad|iPod/i.test(navigator.userAgent) && /CriOS/i.test(navigator.userAgent)
      
      let successMessage = ''
      let displayTime = 4000 // 默认显示时间
      
      if (sendType.value === 'audio') {
        if (isMobile && !shouldAutoCopyAfterUpload.value) {
          // 移动端且自动复制失败时，显示可点击的链接
          successMessage = `🎵 音频发送成功！\n⏱️ 时长: ${formatTime(recordingTime.value)}\n📋 取件码：${retrieveCode}\n🔗 完整链接：${window.location.origin}/#/?code=${retrieveCode}`
          displayTime = 10000
        } else {
          successMessage = `🎵 音频发送成功！时长: ${formatTime(recordingTime.value)}，取件码：${retrieveCode}`
          displayTime = isMobile ? 6000 : 4000
        }
      } else if (sendType.value === 'file') {
        if (isIOSChrome) {
          // iOS Chrome用户需要更详细的信息
          successMessage = `📁 文件发送成功！\n📋 取件码：${retrieveCode}\n🔗 完整链接：${window.location.origin}/#/?code=${retrieveCode}`
          displayTime = 8000
        } else {
          successMessage = `📁 文件发送成功！取件码：${retrieveCode}`
          displayTime = isMobile ? 6000 : 4000
        }
      } else if (sendType.value === 'text') {
        if (isIOSChrome) {
          // iOS Chrome用户需要更详细的信息  
          successMessage = `📝 文本发送成功！\n📋 取件码：${retrieveCode}\n🔗 完整链接：${window.location.origin}/#/?code=${retrieveCode}`
          displayTime = 8000
        } else {
          successMessage = `📝 文本发送成功！取件码：${retrieveCode}`
          displayTime = isMobile ? 6000 : 4000
        }
      }
      
      alertStore.showAlert(successMessage, 'success', displayTime)
      
      // 显示详情
      selectedRecord.value = newRecord
      
      // 基本状态重置
      selectedFile.value = null
      textContent.value = ''
      uploadProgress.value = 0
      
      // 音频特定的资源清理延迟处理
      if (sendType.value === 'audio') {
        setTimeout(() => {
          resetRecording()
        }, 200)
      }
    } else {
      throw new Error('服务器响应异常')
    }
  } catch (error: any) {
    console.error('发送失败:', error)
    if (error.response?.data?.detail) {
      alertStore.showAlert(error.response.data.detail, 'error')
    } else {
      alertStore.showAlert('发送失败,请稍后重试', 'error')
    }
  } finally {
    uploadProgress.value = 0
  }
}

const toRetrieve = () => {
  router.push('/')
}

const toggleDrawer = () => {
  showDrawer.value = !showDrawer.value
}

const viewDetails = (record: any) => {
  selectedRecord.value = record
}

const deleteRecord = (id: number) => {
  const index = fileDataStore.shareData.findIndex((record: any) => record.id === id)
  if (index !== -1) {
    fileDataStore.deleteShareData(index)
  }
}
const baseUrl = window.location.origin + '/#/'
const getQRCodeValue = (record: any) => {
  return `${baseUrl}?code=${record.retrieveCode}`
}

const incrementValue = (delta: number) => {
  const currentValue = parseInt(expirationValue.value) || 0
  const newValue = currentValue + delta
  if (newValue >= 1) {
    expirationValue.value = newValue.toString()
  }
}

// 使用 onMounted 钩子延迟加载一些非关键资源或初始化
onMounted(() => {
  // 这里可以放置一些非立即需要的初始化代码
  console.log('SendFileView mounted')
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (min-width: 640px) {
  .sm\:w-120 {
    width: 30rem;
    /* 480px */
  }
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}

.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

select option {
  padding: 8px;
  margin: 4px;
  border-radius: 6px;
}

select option:checked {
  background: linear-gradient(to right, rgb(99 102 241 / 0.5), rgb(168 85 247 / 0.5)) !important;
  color: white !important;
}

.dark select option:checked {
  background: linear-gradient(to right, rgb(99 102 241 / 0.7), rgb(168 85 247 / 0.7)) !important;
}

select option:hover {
  background-color: rgb(99 102 241 / 0.1);
}

.dark select option:hover {
  background-color: rgb(99 102 241 / 0.2);
}
</style>
