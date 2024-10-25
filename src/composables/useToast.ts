// useToast.ts
import { reactive } from 'vue'

interface ToastOptions {
  visible: boolean
  message: string
  timeout: number
  isError: boolean
}

// Define the singleton toast state
const toast = reactive<ToastOptions>({
  visible: false,
  message: '',
  timeout: 6000,
  isError: false
})

// Define the function to show the toast
function showToast(message: string, isError = false, timeout = 6000) {
  toast.message = message
  toast.isError = isError
  toast.timeout = timeout
  toast.visible = true
}

export function useToast() {
  return { toast, showToast }
}
