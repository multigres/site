'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useCopyButton(onCopy: () => void | Promise<void>) {
  const [checked, setChecked] = useState(false);
  const callbackRef = useRef(onCopy);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  callbackRef.current = onCopy;

  const onClick = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    void Promise.resolve(callbackRef.current()).then(() => {
      setChecked(true);
      timeoutRef.current = setTimeout(() => {
        setChecked(false);
      }, 1500);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return [checked, onClick] as const;
}
