// useScrollLock.ts
import { useEffect } from 'react';

export function useScrollLock(shouldLock: boolean) {
    useEffect(() => {
        // If we shouldn't lock (e.g., isOpen is true), do nothing
        if (!shouldLock) return;

        // Save original styles
        const htmlOverflow = document.documentElement.style.overflow;
        const bodyOverflow = document.body.style.overflow;

        // Apply lock styles
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";

        // Clean up and restore original styles on unmount or change
        return () => {
            document.documentElement.style.overflow = htmlOverflow;
            document.body.style.overflow = bodyOverflow;
        };
    }, [shouldLock]);
}
