import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

export interface Checkin {
  id: string;
  date: string; // ISO date
  time: string; // HH:MM
  emotion: string;
  sentiment: string;
  emoji?: string;
}

interface CheckinContextValue {
  checkins: Checkin[];
  addCheckin: (c: Omit<Checkin, "id">) => void;
  setAllCheckins: (c: Checkin[]) => void;
  clearCheckins: () => void;
}

const CheckinContext = createContext<CheckinContextValue | undefined>(undefined);

const STORAGE_KEY = "app_checkins_v1";

export const CheckinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [checkins, setCheckins] = useState<Checkin[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Checkin[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checkins));
    } catch { }
  }, [checkins]);

  const addCheckin = useCallback((c: Omit<Checkin, "id">) => {
    const newCheckin: Checkin = {
      id: Date.now().toString(),
      ...c,
    };
    setCheckins((s) => [...s, newCheckin]);
  }, []);

  const setAllCheckins = useCallback((c: Checkin[]) => setCheckins(c), []);
  const clearCheckins = useCallback(() => setCheckins([]), []);

  const value = useMemo(() => ({
    checkins,
    addCheckin,
    setAllCheckins,
    clearCheckins
  }), [checkins, addCheckin, setAllCheckins, clearCheckins]);

  return (
    <CheckinContext.Provider value={value}>
      {children}
    </CheckinContext.Provider>
  );
};

export const useCheckins = () => {
  const ctx = useContext(CheckinContext);
  if (!ctx) throw new Error("useCheckins must be used within CheckinProvider");
  return ctx;
};

export default CheckinContext;
