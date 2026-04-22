import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const DataContext = createContext();

export function DataProvider({ children }) {
  const [records, setRecords] = useState([]);
  const [modelInfo, setModelInfo] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = useCallback(() => {
    fetch("/recent?limit=100")
      .then(r => r.json())
      .then(d => { setRecords(Array.isArray(d) ? d : []); setLastUpdated(new Date()); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/info").then(r => r.json()).then(setModelInfo).catch(() => {});
    refresh();
  }, []);

  return (
    <DataContext.Provider value={{ records, modelInfo, refresh, lastUpdated }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
