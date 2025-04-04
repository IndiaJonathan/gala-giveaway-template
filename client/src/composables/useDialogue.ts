import { reactive } from 'vue'
import { useDialog as useAlertDialog } from './useDialog'

interface DialogOptions {
  title: string
  body: string
  ctaPrimary: string
  onClickPrimary: () => void | Promise<void>
}
interface DialogSettings extends DialogOptions {
  visible: boolean
}

const dialog = reactive<DialogSettings>({
  visible: false,
  body: '',
  title: '',
  ctaPrimary: '',
  onClickPrimary: function (): void | Promise<void> {
    throw new Error('Function not implemented.')
  }
})

// Define the function to show the toast
function openDialog(options: DialogOptions) {
  dialog.title = options.title
  dialog.body = options.body
  dialog.ctaPrimary = options.ctaPrimary
  dialog.onClickPrimary = options.onClickPrimary
  dialog.visible = true
}

export function useDialog() {
  return { openDialog }
}

function openMetamask() {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
  const metaMaskDeeplink = 'metamask://'
  const metaMaskDownloadPage = 'https://metamask.io/download/' // General download page

  // Check for iOS
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    // Try deep link first
    window.location.href = metaMaskDeeplink
    // Fallback to App Store after a delay
    setTimeout(() => {
      window.open('https://apps.apple.com/app/metamask/id1438144202', '_blank')
    }, 1000)
  }
  // Check for Android
  else if (/android/i.test(userAgent)) {
    // Use intent for potentially better handling on Android
    const intentUrl = 'intent://#Intent;package=io.metamask;scheme=metamask;end;'
    try {
      // Try opening the intent URL
      const intentWindow = window.open(intentUrl, '_blank')
      // If the intent fails immediately (e.g., browser blocks it), intentWindow might be null or closed quickly
      // Set a timeout fallback just in case the intent doesn't switch apps
      setTimeout(() => {
        // Check if the window we tried to open is still around and didn't navigate
        if (intentWindow && !intentWindow.closed) {
          intentWindow.location.href = 'https://play.google.com/store/apps/details?id=io.metamask'
        } else {
          // If intentWindow failed to open or was closed, open play store in new tab
          window.open('https://play.google.com/store/apps/details?id=io.metamask', '_blank')
        }
      }, 1500) // Slightly longer timeout for intent handling
    } catch (e) {
      console.warn('Android intent failed, falling back to direct link/Play Store:', e)
      // Fallback 1: Try direct deep link
      window.location.href = metaMaskDeeplink
      // Fallback 2: Go to Play Store after a delay
      setTimeout(() => {
        window.open('https://play.google.com/store/apps/details?id=io.metamask', '_blank')
      }, 1000)
    }
  }
  // Otherwise (Desktop or other OS)
  else {
    window.open(metaMaskDownloadPage, '_blank')
  }
}

export function openNoWeb3WalletDialog() {
  console.log('called')
  const { openDialog } = useAlertDialog()
  openDialog('alert', {
    title: 'Web3 provider not found',
    body: 'Please install, or use a web3 wallet provider to connect a wallet. We recommend MetaMask, a popular and secure Web3 wallet that works as a browser extension or mobile app.',
    ctaPrimary: 'Get Metamask',
    onClickPrimary: openMetamask
  })
}
