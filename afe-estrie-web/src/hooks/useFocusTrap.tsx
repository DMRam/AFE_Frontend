import { useEffect, type RefObject } from 'react';

export function useFocusTrap(ref: RefObject<HTMLElement | null>, isActive: boolean) {
    useEffect(() => {
        if (!isActive || !ref.current) return;

        const focusableElements = ref.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        firstElement.focus();

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isActive, ref]);
}