import { reactive } from 'vue'

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
  window.open('https://metamask.io/', '_blank')
}

export function openNoWeb3WalletDialog() {
  console.log("called")
  openDialog({
    title: 'Web3 provider not found',
    body: 'Please install a web3 wallet provider to connect a wallet. We recommend MetaMask, a popular and secure Web3 wallet that works as a browser extension or mobile app.',
    ctaPrimary: 'Get Metamask',
    onClickPrimary: openMetamask
  })
}
