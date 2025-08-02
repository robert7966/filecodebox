/**
 * 剪贴板工具函数
 */

import { useAlertStore } from '@/stores/alertStore'
interface CopyOptions {
  successMsg?: string
  errorMsg?: string
  showMsg?: boolean
}

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @param options 配置选项
 * @returns Promise<boolean> 是否复制成功
 */
export const copyToClipboard = async (
  text: string,
  options: CopyOptions = {}
): Promise<boolean> => {
  const { successMsg = '复制成功', errorMsg = '复制失败，请手动复制', showMsg = true } = options
  const alertStore = useAlertStore()
  
  // 检测设备类型
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
  const isIOSChrome = isIOS && /CriOS/i.test(navigator.userAgent)
  
  try {
    // iOS Chrome特殊兼容性处理
    if (isIOSChrome) {
      console.log('🍎 iOS Chrome复制优化策略')
      // iOS Chrome对用户激活状态要求更严格，但我们仍然尝试
    } else if (isMobile) {
      // 其他移动端兼容性检查 - 放宽用户激活检查
      if (navigator.userActivation && navigator.userActivation.hasBeenActive === false) {
        console.warn('用户激活状态检查: 用户尚未激活页面')
        // 不要直接返回失败，而是继续尝试其他方法
      }
    }
    
    // 检查安全上下文，但允许localhost开发环境
    if (!window.isSecureContext && !location.hostname.includes('localhost') && !location.hostname.includes('127.0.0.1') && !location.hostname.includes('192.168.1.102')) {
      if (showMsg) {
        alertStore.showAlert('需要HTTPS环境才能使用复制功能', 'error')
      }
      return false
    }
    
    // 方案1: 现代 Clipboard API - 增加重试机制
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        // 增加短暂延迟确保用户操作完成
        await new Promise(resolve => setTimeout(resolve, 10))
        await navigator.clipboard.writeText(text)
        if (showMsg) alertStore.showAlert(successMsg, 'success')
        return true
      } catch (clipboardErr: any) {
        console.warn('Clipboard API 失败，尝试回退方案:', clipboardErr)
        
        // 如果是权限问题，在移动设备上给出更友好的提示
        if (clipboardErr.name === 'NotAllowedError' && isMobile) {
          console.log('移动端权限被拒绝，尝试fallback方法')
          // 继续尝试其他方案，不直接失败
        }
      }
    }
    
    // 方案2: 改进的 execCommand 方法 - 增强移动端处理
    const success = await fallbackCopyTextToClipboard(text)
    if (success) {
      if (showMsg) alertStore.showAlert(successMsg, 'success')
      return true
    }
    
    // 方案3: 创建可选择的临时元素
    const tempSuccess = createSelectableElement(text)
    if (tempSuccess) {
      if (showMsg) alertStore.showAlert(successMsg, 'success')
      return true
    }
    
    throw new Error('所有复制方案都失败')
  } catch (err) {
    console.error('复制失败:', err)
    
    // 改进的错误处理 - 提供更好的用户体验
    let detailedErrorMsg = errorMsg
    
    if (isMobile) {
      // 移动端专用的友好提示
      if (text.includes('://') || text.startsWith('/')) {
        detailedErrorMsg = `自动复制失败。请长按链接手动复制：${text}`
      } else {
        detailedErrorMsg = `自动复制失败。请长按取件码手动复制：${text}\n完整链接：${window.location.origin}/#/?code=${text}`
      }
    } else {
      // 桌面端的错误提示
      if (text.includes('://') || text.startsWith('/')) {
        detailedErrorMsg = `${errorMsg}。链接：${text}`
      } else {
        detailedErrorMsg = `${errorMsg}。取件码：${text}\n完整链接：${window.location.origin}/#/?code=${text}`
      }
    }
    
    if (showMsg) {
      alertStore.showAlert(detailedErrorMsg, 'warning', 8000) // 改为warning类型，时间更长
    }
    return false
  }
}

/**
 * 生成并复制取件链接 - iOS Chrome优化版本
 * @param code 取件码
 * @param maxRetries 最大重试次数
 * @returns Promise<boolean> 是否复制成功
 */
export const copyRetrieveLink = async (code: string, maxRetries: number = 3): Promise<boolean> => {
  const link = `${window.location.origin}/#/?code=${code}`
  
  // 检测设备类型
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
  const isIOSChrome = isIOS && /CriOS/i.test(navigator.userAgent)
  
  // iOS Chrome特殊处理
  if (isIOSChrome) {
    console.log('🍎 检测到iOS Chrome，使用优化策略')
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`🍎 iOS Chrome复制尝试 ${attempt}/${maxRetries}`)
      
      // iOS Chrome需要更短的延迟
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      const success = await copyToClipboard(link, {
        successMsg: '✅ 取件链接已复制到剪贴板',
        errorMsg: ``,
        showMsg: true // iOS Chrome成功时总是显示提示
      })
      
      if (success) {
        console.log(`✅ iOS Chrome复制成功 (第${attempt}次尝试)`)
        return true
      }
      
      console.log(`❌ iOS Chrome复制失败 (第${attempt}次尝试)`)
    }
    
    // iOS Chrome失败时的特殊提示
    const alertStore = useAlertStore()
    alertStore.showAlert(
      `📋 iOS Chrome自动复制失败\n取件码：${code}\n💡 请手动选择并复制下方链接：\n${link}`, 
      'warning', 
      12000
    )
    return false
  }
  // 其他移动设备
  else if (isMobile) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`📱 移动端复制尝试 ${attempt}/${maxRetries}`)
      
      // 每次尝试前确保有足够的延迟
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, attempt * 200))
      }
      
      const success = await copyToClipboard(link, {
        successMsg: '✅ 取件链接已复制到剪贴板',
        errorMsg: ``,
        showMsg: attempt === maxRetries // 最后一次尝试时显示错误，成功时copyToClipboard内部会显示成功消息
      })
      
      if (success) {
        console.log(`✅ 移动端复制成功 (第${attempt}次尝试)`)
        return true
      }
      
      console.log(`❌ 移动端复制失败 (第${attempt}次尝试)`)
    }
    
    // 所有重试都失败，显示移动端友好的错误提示
    const alertStore = useAlertStore()
    alertStore.showAlert(
      `📋 自动复制失败\n取件码：${code}\n🔗 完整链接：\n${link}\n💡 提示：长按上方链接手动复制`, 
      'warning', 
      10000
    )
    return false
  } else {
    // 桌面端使用原有逻辑
    return copyToClipboard(link, {
      successMsg: '✅ 取件链接已复制到剪贴板',
      errorMsg: `复制失败，请手动复制取件链接`
    })
  }
}

/**
 * 复制取件码
 * @param code 取件码
 * @returns Promise<boolean> 是否复制成功
 */
export const copyRetrieveCode = async (code: string): Promise<boolean> => {
  return copyToClipboard(code, {
    successMsg: '取件码已复制到剪贴板',
    errorMsg: '复制失败，请手动复制取件码'
  })
}

/**
 * 改进的回退复制文本方法 - iOS Chrome优化支持
 * @param text 要复制的文本
 */
async function fallbackCopyTextToClipboard(text: string): Promise<boolean> {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
  const isIOSChrome = isIOS && /CriOS/i.test(navigator.userAgent)
  
  return new Promise((resolve) => {
    const textArea = document.createElement("textarea")
    textArea.value = text
    
    // 移动端优化的样式设置
    textArea.style.position = "fixed"
    textArea.style.top = "0"
    textArea.style.left = "0"
    textArea.style.width = "2em"
    textArea.style.height = "2em"
    textArea.style.padding = "0"
    textArea.style.border = "none"
    textArea.style.outline = "none"
    textArea.style.boxShadow = "none"
    textArea.style.background = "transparent"
    textArea.style.fontSize = "16px" // 防止iOS缩放
    textArea.style.zIndex = "-1" // 确保不影响页面交互
    
    // 移动端专用样式
    if (isMobile) {
      textArea.style.opacity = "0"
      textArea.style.pointerEvents = "none"
      textArea.readOnly = false // 确保可编辑
      
      // iOS Chrome特殊处理
      if (isIOSChrome) {
        textArea.style.position = "absolute" // iOS Chrome更喜欢absolute
        textArea.style.zIndex = "9999" // 确保在最前面
        textArea.contentEditable = 'true' // iOS Chrome需要这个
      }
    }
    
    document.body.appendChild(textArea)
    
    try {
      // 移动端需要更强制的焦点获取
      if (isMobile) {
        textArea.contentEditable = 'true'
        textArea.readOnly = false
      }
      
      textArea.focus()
      textArea.select()
      
      // 多次尝试选择文本，提高成功率
      if (textArea.setSelectionRange) {
        textArea.setSelectionRange(0, textArea.value.length)
      }
      
      // 再次确保焦点
      if (document.activeElement !== textArea) {
        textArea.focus()
        if (isMobile) {
          // 移动端可能需要触发触摸事件
          textArea.select()
        }
      }
      
      // 根据设备类型调整延迟
      const delay = isIOSChrome ? 30 : (isMobile ? 50 : 10) // iOS Chrome需要适中的延迟
      
      setTimeout(() => {
        try {
          const successful = document.execCommand("copy")
          const deviceType = isIOSChrome ? 'iOS Chrome' : (isMobile ? '移动端' : '桌面端')
          console.log(`execCommand 复制操作 ${successful ? "成功" : "失败"} (${deviceType})`)
          resolve(successful)
        } catch (err) {
          console.error("execCommand 复制操作失败：", err)
          resolve(false)
        } finally {
          try {
            document.body.removeChild(textArea)
          } catch (e) {
            console.warn('清理textArea失败:', e)
          }
        }
      }, delay)
    } catch (err) {
      console.error("fallback复制准备失败：", err)
      try {
        document.body.removeChild(textArea)
      } catch (e) {
        console.warn('清理textArea失败:', e)
      }
      resolve(false)
    }
  })
}

/**
 * 创建可选择的文本元素
 * @param text 要复制的文本
 */
function createSelectableElement(text: string): boolean {
  try {
    const span = document.createElement('span')
    span.textContent = text
    span.style.userSelect = 'all'
    span.style.webkitUserSelect = 'all'
    span.style.position = 'fixed'
    span.style.top = '0'
    span.style.left = '0'
    span.style.opacity = '0'
    span.style.pointerEvents = 'none'
    
    document.body.appendChild(span)
    
    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(span)
    selection?.removeAllRanges()
    selection?.addRange(range)
    
    const result = document.execCommand('copy')
    
    document.body.removeChild(span)
    selection?.removeAllRanges()
    
    return result
  } catch (error) {
    console.error('创建可选择元素失败:', error)
    return false
  }
}

/**
 * 移动端专用复制策略
 * @param text 要复制的文本
 */


const baseUrl = window.location.origin + '/'

export const copyWgetCommand = (retrieveCode: string, fileName: string) => {
  const command = `wget ${baseUrl}share/select?code=${retrieveCode} -O "${fileName}"`

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(command)
      .then(() => {
        console.log("命令已复制到剪贴板！")
      })
      .catch((err) => {
        console.error("复制失败，使用回退方法：", err)
        fallbackCopyTextToClipboard(command)
      })
  } else {
    console.warn("Clipboard API 不可用，使用回退方法。")
    fallbackCopyTextToClipboard(command)
  }
}