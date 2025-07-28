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
  
  try {
    // 优先尝试使用现代 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text)
        if (showMsg) alertStore.showAlert(successMsg, 'success')
        return true
      } catch (clipboardErr) {
        console.warn('Clipboard API 失败，尝试回退方案:', clipboardErr)
        // 如果 Clipboard API 失败，继续使用回退方案
      }
    }
    
    // 回退方案：使用传统的复制方法
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.opacity = '0'
    textarea.style.zIndex = '-1'
    document.body.appendChild(textarea)
    
    // 选择文本并尝试复制
    textarea.focus()
    textarea.select()
    
    // 对于移动设备，使用 setSelectionRange
    if (textarea.setSelectionRange) {
      textarea.setSelectionRange(0, textarea.value.length)
    }
    
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    
    if (success) {
      if (showMsg) alertStore.showAlert(successMsg, 'success')
      return true
    } else {
      throw new Error('execCommand copy failed')
    }
  } catch (err) {
    console.error('复制失败:', err)
    // 提供更详细的错误信息和解决方案
    const detailedErrorMsg = `${errorMsg}。链接已生成：${window.location.origin}/#/?code=${text.includes('code=') ? text.split('code=')[1] : text}`
    if (showMsg) alertStore.showAlert(detailedErrorMsg, 'error', 8000) // 8秒显示时间
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
 * 回退复制文本方法
 * @param text 要复制的文本
 */
function fallbackCopyTextToClipboard(text: string) {
  const textArea = document.createElement("textarea")
  textArea.value = text
  textArea.style.position = "fixed"
  textArea.style.left = "-9999px"
  textArea.style.opacity = "0"
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  
  try {
    const successful = document.execCommand("copy")
    console.log("回退复制操作", successful ? "成功" : "失败")
    return successful
  } catch (err) {
    console.error("回退复制操作失败：", err)
    return false
  } finally {
    document.body.removeChild(textArea)
  }
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