import { Modal } from 'antd';

const DETAIL_MODIFIED_KEY = 'unfazed-admin:detail-modified';

export function markDetailModified() {
  sessionStorage.setItem(DETAIL_MODIFIED_KEY, '1');
}

export function clearDetailModified() {
  sessionStorage.removeItem(DETAIL_MODIFIED_KEY);
}

export function isDetailModified() {
  return sessionStorage.getItem(DETAIL_MODIFIED_KEY) === '1';
}

export function confirmUnsaved(onOk: () => void) {
  if (isDetailModified()) {
    Modal.confirm({
      title: 'Unsaved Changes',
      content:
        'If you leave this page, unsaved changes will be lost. Are you sure?',
      okText: 'Confirm',
      cancelText: 'Cancel',
      onOk,
    });
  } else {
    onOk();
  }
}
