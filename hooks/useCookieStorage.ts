import { useState, useEffect, Dispatch, SetStateAction } from 'react';

function setCookie<T>(key: string, value: T, days: number = 365) {
  try {
    const stringValue = JSON.stringify(value);
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = `${key}=${encodeURIComponent(stringValue || "")}${expires}; path=/; SameSite=Lax`;
  } catch (error) {
    console.error(`Error setting cookie key "${key}":`, error);
  }
}

function getCookie<T>(key: string): T | null {
  try {
    const nameEQ = key + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        const value = c.substring(nameEQ.length, c.length);
        if (value) {
            return JSON.parse(decodeURIComponent(value));
        }
      }
    }
  } catch (e) {
    console.error(`Error parsing cookie value for key "${key}":`, e);
  }
  return null;
}

export function useCookieStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = getCookie<T>(key);
      return item !== null ? item : initialValue;
    } catch (error) {
        console.error(error);
        return initialValue;
    }
  });

  useEffect(() => {
    setCookie(key, storedValue);
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
