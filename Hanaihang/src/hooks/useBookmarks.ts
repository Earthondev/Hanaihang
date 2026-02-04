import { useState, useEffect, useCallback } from 'react';

const BOOKMARKS_KEY = 'hanaihang_bookmarks';

export interface BookmarkedMall {
  id: string;
  name: string;
  displayName: string;
  address?: string;
  district?: string;
  bookmarkedAt: number;
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkedMall[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // โหลด bookmarks จาก localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setBookmarks(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      setBookmarks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // บันทึก bookmarks ลง localStorage
  const saveBookmarks = useCallback((newBookmarks: BookmarkedMall[]) => {
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks));
      setBookmarks(newBookmarks);
    } catch (error) {
      console.error('Error saving bookmarks:', error);
    }
  }, []);

  // เพิ่ม bookmark
  const addBookmark = useCallback((mall: {
    id: string;
    name: string;
    displayName: string;
    address?: string;
    district?: string;
  }) => {
    const newBookmark: BookmarkedMall = {
      ...mall,
      bookmarkedAt: Date.now()
    };

    const newBookmarks = [...bookmarks, newBookmark];
    saveBookmarks(newBookmarks);
  }, [bookmarks, saveBookmarks]);

  // ลบ bookmark
  const removeBookmark = useCallback((mallId: string) => {
    const newBookmarks = bookmarks.filter(b => b.id !== mallId);
    saveBookmarks(newBookmarks);
  }, [bookmarks, saveBookmarks]);

  // ตรวจสอบว่า bookmark แล้วหรือยัง
  const isBookmarked = useCallback((mallId: string) => {
    return bookmarks.some(b => b.id === mallId);
  }, [bookmarks]);

  // Toggle bookmark
  const toggleBookmark = useCallback((mall: {
    id: string;
    name: string;
    displayName: string;
    address?: string;
    district?: string;
  }) => {
    if (isBookmarked(mall.id)) {
      removeBookmark(mall.id);
    } else {
      addBookmark(mall);
    }
  }, [isBookmarked, addBookmark, removeBookmark]);

  // ล้าง bookmarks ทั้งหมด
  const clearBookmarks = useCallback(() => {
    saveBookmarks([]);
  }, [saveBookmarks]);

  return {
    bookmarks,
    isLoading,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    isBookmarked,
    clearBookmarks
  };
}

export default useBookmarks;
