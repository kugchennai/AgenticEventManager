"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface AppSettingsContextValue {
  meetupName: string;
  setMeetupName: (name: string) => void;
  minVolunteerTasks: number;
  setMinVolunteerTasks: (n: number) => void;
  loading: boolean;
}

const AppSettingsContext = createContext<AppSettingsContextValue>({
  meetupName: "Meetup Manager",
  setMeetupName: () => {},
  minVolunteerTasks: 7,
  setMinVolunteerTasks: () => {},
  loading: true,
});

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [meetupName, setMeetupName] = useState("Meetup Manager");
  const [minVolunteerTasks, setMinVolunteerTasks] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: Record<string, string>) => {
        if (data.meetup_name) {
          setMeetupName(data.meetup_name);
        }
        if (data.min_volunteer_tasks) {
          const parsed = parseInt(data.min_volunteer_tasks, 10);
          if (!isNaN(parsed) && parsed > 0) setMinVolunteerTasks(parsed);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateMeetupName = useCallback((name: string) => {
    setMeetupName(name);
  }, []);

  const updateMinVolunteerTasks = useCallback((n: number) => {
    setMinVolunteerTasks(n);
  }, []);

  return (
    <AppSettingsContext.Provider value={{ meetupName, setMeetupName: updateMeetupName, minVolunteerTasks, setMinVolunteerTasks: updateMinVolunteerTasks, loading }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  return useContext(AppSettingsContext);
}
