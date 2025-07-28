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
  
  // 检测移动设备
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const isChrome = /Chrome/i.test(navigator.userAgent)
  
  try {
    // 方案1: 现代 Clipboard API（对移动端添加更严格的检查）
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        // 移动端Chrome需要检查安全上下文和用户激活
        if (isMobile && isChrome) {
          // 检查是否在安全上下文中
          if (!window.isSecureContext) {
            throw new Error('移动端需要HTTPS环境')
          }
          
          // 检查用户激活状态（用户是否最近有交互）
          if (navigator.userActivation && !navigator.userActivation.hasBeenActive) {
            throw new Error('需要用户交互激活')
          }
        }
        
        await navigator.clipboard.writeText(text)
        if (showMsg) alertStore.showAlert(successMsg, 'success')
        return true
      } catch (clipboardErr) {
        console.warn('Clipboard API 失败，尝试回退方案:', clipboardErr)
        // 继续尝试其他方案
      }
    }
    
    // 方案2: 移动端特殊处理 - 使用用户手势触发的复制
    if (isMobile) {
      const mobileSuccess = await mobileCopyStrategy(text)
      if (mobileSuccess) {
        if (showMsg) alertStore.showAlert(successMsg, 'success')
        return true
      }
    }
    
    // 方案3: 改进的 execCommand 方法
    const success = await fallbackCopyTextToClipboard(text)
    if (success) {
      if (showMsg) alertStore.showAlert(successMsg, 'success')
      return true
    }
    
    // 方案4: 创建可选择的临时元素
    const tempSuccess = createSelectableElement(text)
    if (tempSuccess) {
      if (showMsg) alertStore.showAlert(successMsg, 'success')
      return true
    }
    
    throw new Error('所有复制方案都失败')
  } catch (err) {
    console.error('复制失败:', err)
    
    // 提供更详细的错误信息和解决方案
    let detailedErrorMsg = errorMsg
    
    // 如果传入的text看起来像是一个完整的URL，直接显示
    if (text.includes('://') || text.startsWith('/')) {
      detailedErrorMsg = `${errorMsg}。链接：${text}`
    } else {
      // 如果只是取件码，则构造完整链接
      detailedErrorMsg = `${errorMsg}。链接：${window.location.origin}/#/?code=${text}`
    }
    
    if (showMsg) {
      if (isMobile) {
        // 移动端提供更详细的操作指导
        detailedErrorMsg += '\n\n📱 移动端复制方法：\n1. 长按上方链接\n2. 选择"复制"\n3. 或在浏览器分享菜单中复制链接'
      } else {
        detailedErrorMsg += '。请手动选择并复制上方链接'
      }
      alertStore.showAlert(detailedErrorMsg, 'error', 12000) // 12秒显示时间
    }
    return false
  }
}

/**
 * 生成并复制取件链接
 * @param code 取件码
 * @returns Promise<boolean> 是否复制成功
 */
export const copyRetrieveLink = async (code: string): Promise<boolean> => {
  const link = `${window.location.origin}/#/?code=${code}`
  return copyToClipboard(link, {
    successMsg: '取件链接已复制到剪贴板',
    errorMsg: `复制失败，请手动复制取件链接`
  })
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
 * 改进的回退复制文本方法
 * @param text 要复制的文本
 */
async function fallbackCopyTextToClipboard(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    const textArea = document.createElement("textarea")
    textArea.value = text
    
    // 设置样式确保不影响布局
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
    
    document.body.appendChild(textArea)
    
    try {
      textArea.focus()
      textArea.select()
      
      // 对于移动设备，使用 setSelectionRange
      if (textArea.setSelectionRange) {
        textArea.setSelectionRange(0, textArea.value.length)
      }
      
      // 确保元素获得焦点
      if (document.activeElement !== textArea) {
        textArea.focus()
      }
      
      const successful = document.execCommand("copy")
      console.log("execCommand 复制操作", successful ? "成功" : "失败")
      resolve(successful)
    } catch (err) {
      console.error("execCommand 复制操作失败：", err)
      resolve(false)
    } finally {
      document.body.removeChild(textArea)
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
async function mobileCopyStrategy(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // 创建一个可见的输入框供用户交互
      const input = document.createElement('input')
      input.value = text
      input.style.position = 'fixed'
      input.style.top = '50%'
      input.style.left = '50%'
      input.style.transform = 'translate(-50%, -50%)'
      input.style.zIndex = '9999'
      input.style.fontSize = '16px' // 防止iOS缩放
      input.style.padding = '8px'
      input.style.border = '2px solid #3b82f6'
      input.style.borderRadius = '8px'
      input.style.background = 'white'
      input.style.color = 'black'
      input.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
      
      // 添加标签提示
      const label = document.createElement('div')
      label.textContent = '请全选并复制以下链接：'
      label.style.position = 'fixed'
      label.style.top = 'calc(50% - 50px)'
      label.style.left = '50%'
      label.style.transform = 'translateX(-50%)'
      label.style.zIndex = '9999'
      label.style.color = 'white'
      label.style.background = 'rgba(0,0,0,0.8)'
      label.style.padding = '8px 12px'
      label.style.borderRadius = '4px'
      label.style.fontSize = '14px'
      
      document.body.appendChild(label)
      document.body.appendChild(input)
      
      // 自动选择文本
      input.focus()
      input.select()
      input.setSelectionRange(0, input.value.length)
      
      // 尝试自动复制
      setTimeout(() => {
        try {
          const success = document.execCommand('copy')
          document.body.removeChild(input)
          document.body.removeChild(label)
          resolve(success)
        } catch (error) {
          // 如果自动复制失败，保持元素让用户手动复制
          setTimeout(() => {
            try {
              document.body.removeChild(input)
              document.body.removeChild(label)
            } catch (e) {
              // 元素可能已经被移除
            }
            resolve(false)
          }, 3000) // 3秒后自动清理
        }
      }, 100)
      
    } catch (error) {
      console.error('移动端复制策略失败:', error)
      resolve(false)
    }
  })
}

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