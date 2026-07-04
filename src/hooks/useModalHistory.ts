import { useEffect, useRef } from 'react';

/**
 * Custom hook to intercept physical/gesture back buttons on mobile
 * to close modal popups instead of navigating the application.
 * 
 * @param onClose Callback to close the modal
 * @param isOpen Optional flag, defaults to true
 */
export function useModalHistory(onClose: () => void, isOpen: boolean = true) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const modalStateKey = `modal-${Math.random().toString(36).substring(2, 9)}`;

    // Push a new entry to history stack. This entry is linked to our modal.
    window.history.pushState({ modalStateKey }, '');

    const handlePopState = (event: PopStateEvent) => {
      // If the state popped does not contain the key of this modal instance, close it
      if (event.state?.modalStateKey !== modalStateKey) {
        onCloseRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);

      // Clean up the virtual history state if the modal was closed via UI click (X or overlay)
      if (window.history.state?.modalStateKey === modalStateKey) {
        window.history.back();
      }
    };
  }, [isOpen]);
}
