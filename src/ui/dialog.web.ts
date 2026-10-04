export function notify(title: string, message: string): void {
  if (typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
  }
}

export function confirmAction(title: string, message: string, onConfirm: () => void): void {
  if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) {
    onConfirm();
  }
}
