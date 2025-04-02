import { ref } from 'vue';

interface DialogConfig {
  title: string;
  body: string;
  ctaPrimary: string;
  ctaSecondary?: string;
  onClickPrimary?: () => void;
  onClickSecondary?: () => void;
}

// Create refs outside the function to make them singleton
const showDialog = ref(false);
const dialogConfig = ref<DialogConfig | null>(null);
const dialogType = ref<string>('');

export function useDialog() {
  const openDialog = (type: string, config: DialogConfig) => {
    dialogType.value = type;
    dialogConfig.value = config;
    showDialog.value = true;
  };

  const closeDialog = () => {
    showDialog.value = false;
    dialogConfig.value = null;
  };

  const handlePrimaryClick = () => {
    if (dialogConfig.value?.onClickPrimary) {
      dialogConfig.value.onClickPrimary();
    }
    closeDialog();
  };

  const handleSecondaryClick = () => {
    if (dialogConfig.value?.onClickSecondary) {
      dialogConfig.value.onClickSecondary();
    }
    closeDialog();
  };

  return {
    showDialog,
    dialogConfig,
    dialogType,
    openDialog,
    closeDialog,
    handlePrimaryClick,
    handleSecondaryClick,
  };
} 