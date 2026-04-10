import { useState, useEffect } from "react";
import { getLogs } from "../utils/api";

export default function useWorkoutLogs() {
  const [logs, setLogs] = useState([]);

  const fetchLogs = async () => {
    const data = await getLogs();
    setLogs(data);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return {
    logs,
    fetchLogs,
  };
}
