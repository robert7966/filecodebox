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
  
  try {
    // 增强移动端兼容性检查
    if (isMobile) {
      // 检查用户激活状态
      if (navigator.userActivation && !navigator.userActivation.isActive) {
        if (showMsg) {
          alertStore.showAlert('请重新点击按钮以激活复制功能', 'warning', 3000)
        }
        return false
      }
      
      // 检查安全上下文
      if (!window.isSecureContext) {
        if (showMsg) {
          alertStore.showAlert('需要HTTPS环境才能使用复制功能', 'error')
        }
        return false
      }
    }
    
    // 方案1: 现代 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text)
        if (showMsg) alertStore.showAlert(successMsg, 'success')
        return true
      } catch (clipboardErr) {
        console.warn('Clipboard API 失败，尝试回退方案:', clipboardErr)
        // 继续尝试其他方案
      }
    }
    
    // 方案2: 改进的 execCommand 方法
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
      alertStore.showAlert(detailedErrorMsg, 'error', 6000)
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