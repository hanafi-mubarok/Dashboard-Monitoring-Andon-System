'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import type { JadwalRow, StatisticRow } from "@/lib/queries/jadwal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Filter, Search, Plus, Save, X, Pencil, Trash2, Layers, Eye, EyeOff, Target, Clock, CheckCircle2, AlertTriangle, Activity, Hourglass, AlertCircle, CheckCheck, Package, BookCheck, ClipboardList, Timer } from "lucide-react";

type JadwalKey = {
  id_jadwal: number;
};

type SortConfig = {
  column: string | null;
  direction: 'asc' | 'desc';
};

type JadwalForm = {
  id_product: string;
  product_name: string;
  project: string;
  trainset: string;
  jumlah_tiapts: string;
  total_personil: string;
  line: string;
  workshop: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
};

const trainsetOptions = Array.from({ length: 10 }, (_, i) => 47 + i);
const emptyForm: JadwalForm = {
  id_product: "",
  product_name: "",
  project: "",
  trainset: "",
  jumlah_tiapts: "",
  total_personil: "",
  line: "",
  workshop: "",
  tanggal_mulai: "",
  tanggal_selesai: "",
};

function toDateInputValue(value?: string | Date | null) {
  if (!value) return "";
  if (typeof value === "string") {
    const match = value.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
  }
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  return date.toISOString().slice(0, 10);
}

function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return String(value);
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatIdealTime(timeString: string | number | null | undefined): string {
  if (!timeString && timeString !== 0) return '-';
  const str = String(timeString).trim();
  const parts = str.split(':');
  if (parts.length === 3) {
    return `${parts[0]}j${parts[1]}m${parts[2]}d`;
  }
  return str;
}

function parseNumber(value: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function buildPayload(form: JadwalForm) {
  return {
    id_product: form.id_product.trim(),
    product_name: form.product_name.trim(),
    project: form.project.trim() || null,
    trainset: Number(form.trainset),
    jumlah_tiapts: parseNumber(form.jumlah_tiapts),
    total_personil: parseNumber(form.total_personil),
    line: form.line.trim() || null,
    workshop: form.workshop.trim() || null,
    tanggal_mulai: form.tanggal_mulai || null,
    tanggal_selesai: form.tanggal_selesai || null,
  };
}

function isValidForm(form: JadwalForm) {
  // All fields must be filled
  if (!form.id_product.trim()) return false;
  if (!form.product_name.trim()) return false;
  if (!form.project.trim()) return false;
  const trainset = Number(form.trainset);
  if (Number.isNaN(trainset) || trainset <= 0) return false;
  if (!form.jumlah_tiapts.trim()) return false;
  if (!form.total_personil.trim()) return false;
  if (!form.line.trim()) return false;
  if (!form.workshop.trim()) return false;
  if (!form.tanggal_mulai.trim()) return false;
  if (!form.tanggal_selesai.trim()) return false;
  return true;
}

function getUniqueValues(rows: JadwalRow[], field: keyof JadwalRow): string[] {
  const values = new Set<string>();
  rows.forEach((row) => {
    const val = row[field];
    if (val != null) {
      values.add(String(val));
    }
  });
  return Array.from(values).sort();
}

function getStatusColor(status: string | null | undefined): string {
  if (!status) return "bg-gray-600 text-white border-0 text-xs";
  
  // Check for dynamic "Kurang N Hari" status
  if (status.startsWith('Kurang') && status.endsWith('Hari')) {
    return "bg-amber-600 text-white border-0 text-xs";
  }
  
  switch(status) {
    case 'Terlambat / Tidak Tercatat':
      return "bg-red-600 text-white border-0 text-xs";
    case 'Tepat Waktu':
      return "bg-emerald-600 text-white border-0 text-xs";
    case 'On Progress':
      return "bg-blue-600 text-white border-0 text-xs";
    case 'Waiting List':
      return "bg-gray-600 text-white border-0 text-xs";
    default:
      return "bg-gray-600 text-white border-0 text-xs";
  }
}

function getMonthYearOptions(rows: JadwalRow[]): { value: string; label: string }[] {
  const monthYearSet = new Set<string>();
  rows.forEach((row) => {
    if (row.tanggal_selesai) {
      const date = new Date(row.tanggal_selesai);
      if (!Number.isNaN(date.valueOf())) {
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthYearSet.add(monthYear);
      }
    }
  });
  
  const options = Array.from(monthYearSet)
    .sort((a, b) => b.localeCompare(a)) // Sort descending (newest first)
    .map(value => {
      const [year, month] = value.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return {
        value,
        label: `${monthNames[parseInt(month) - 1]} ${year}`
      };
    });
  
  return options;
}

function getLineColor(line: string | null): string {
  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  
  if (!line) return 'bg-gray-500';
  
  // Simple hash function to assign consistent color per line
  let hash = 0;
  for (let i = 0; i < line.length; i++) {
    hash = line.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

function getProductColorByFloor(line: string | null): string {
  const searchText = (line || '').toLowerCase();
  
  // Check for floor in the line column
  if (searchText.includes('lantai 3') || searchText.includes('lt 3') || searchText.includes('lt3')) {
    return 'bg-blue-500'; // Lantai 3 - Biru
  } else if (searchText.includes('lantai 2') || searchText.includes('lt 2') || searchText.includes('lt2')) {
    return 'bg-amber-700'; // Lantai 2 - Tembaga/Kabel
  } else if (searchText.includes('lantai 1') || searchText.includes('lt 1') || searchText.includes('lt1')) {
    return 'bg-purple-500'; // Lantai 1 - Ungu
  }
  
  // Default color if no floor is specified
  return 'bg-gray-500';
}

function getProductColorByProcess(prosesProduk: string | null | undefined): string {
  const value = (prosesProduk || '').trim();
  if (!value) return 'bg-gray-500';

  const colors = [
    'bg-blue-600',
    'bg-red-600',
    'bg-violet-600',
    'bg-cyan-500',
    'bg-fuchsia-600',
    'bg-sky-500',
    'bg-rose-600',
    'bg-indigo-600',
    'bg-pink-600',
    'bg-purple-500',
  ];

  // Stable hash so the same proses_produk always gets the same color.
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

function getProductColorByProcessWithPalette(prosesProduk: string | null | undefined, palette: 'default' | 'dark' = 'default') {
  const value = (prosesProduk || '').trim();
  if (!value) return 'bg-gray-500';

  const defaultColors = [
    'bg-blue-600',
    'bg-red-600',
    'bg-violet-600',
    'bg-cyan-500',
    'bg-fuchsia-600',
    'bg-sky-500',
    'bg-rose-600',
    'bg-indigo-600',
    'bg-pink-600',
    'bg-purple-500',
  ];

  const darkColors = [
    'bg-blue-800',
    'bg-rose-800',
    'bg-violet-800',
    'bg-slate-800',
    'bg-fuchsia-800',
    'bg-sky-700',
    'bg-amber-800',
    'bg-indigo-800',
    'bg-pink-800',
    'bg-purple-800',
  ];

  const colors = palette === 'dark' ? darkColors : defaultColors;

  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

function isLantai12(line: string | null | undefined): boolean {
  const searchText = (line || '').toLowerCase();
  return (
    searchText.includes('lantai 2') ||
    searchText.includes('lt 2') ||
    searchText.includes('lt2') ||
    searchText.includes('lantai 1') ||
    searchText.includes('lt 1') ||
    searchText.includes('lt1')
  );
}

function matchesProcessNameFlexible(jadwalProcess: string | null | undefined, progressProcess: string | null | undefined): boolean {
  const left = (jadwalProcess || '').trim().toLowerCase();
  const right = (progressProcess || '').trim().toLowerCase();

  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;

  const splitPattern = /[\s\-_/(),.]+/;
  const leftTokens = left.split(splitPattern).filter(Boolean);
  const rightTokens = right.split(splitPattern).filter(Boolean);

  if (!leftTokens.length || !rightTokens.length) return false;

  const rightSet = new Set(rightTokens);
  return leftTokens.some((token) => rightSet.has(token));
}

function getDateRange(rows: JadwalRow[]): { minDate: Date; maxDate: Date; totalDays: number } {
  let minDate = new Date();
  let maxDate = new Date();
  
  rows.forEach((row) => {
    if (row.tanggal_mulai) {
      const start = new Date(row.tanggal_mulai);
      if (!Number.isNaN(start.valueOf()) && start < minDate) {
        minDate = start;
      }
    }
    if (row.tanggal_selesai) {
      const end = new Date(row.tanggal_selesai);
      if (!Number.isNaN(end.valueOf()) && end > maxDate) {
        maxDate = end;
      }
    }
  });
  
  // Add padding
  minDate.setDate(minDate.getDate() - 7);
  maxDate.setDate(maxDate.getDate() + 7);
  
  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return { minDate, maxDate, totalDays };
}

const holidayCalendarId = "id.indonesian#holiday@group.v.calendar.google.com";
const holidayApiKey = "AIzaSyD3w3fObkTfxEcowwCSXUW7NX0TusGcXbs";

function buildHolidayUrl(year: number) {
  const timeMin = `${year}-01-01T00:00:00Z`;
  const timeMax = `${year}-12-31T23:59:59Z`;
  const params = new URLSearchParams({
    key: holidayApiKey,
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
  });
  return `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(holidayCalendarId)}/events?${params.toString()}`;
}

export default function JadwalClient({
  initialRows,
  selectedLine = "Lantai 3",
  canManageSchedule = false,
  disableAutoRefresh = false,
  useProcessColor = false,
  processPalette = 'default',
}: {
  initialRows: JadwalRow[];
  selectedLine?: string;
  canManageSchedule?: boolean;
  disableAutoRefresh?: boolean;
  useProcessColor?: boolean;
  processPalette?: 'default' | 'dark';
}) {
  // Get current month-year as default filter
  const getCurrentMonthYear = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const [rows, setRows] = useState<JadwalRow[]>(initialRows);
  const [searchQuery, setSearchQuery] = useState("");
  const [monthYearFilter, setMonthYearFilter] = useState(getCurrentMonthYear());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [createForm, setCreateForm] = useState<JadwalForm>(emptyForm);
  const [editingKey, setEditingKey] = useState<JadwalKey | null>(null);
  const [editForm, setEditForm] = useState<JadwalForm>(emptyForm);
  const [showFormCard, setShowFormCard] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: null, direction: 'asc' });
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [originalEditForm, setOriginalEditForm] = useState<JadwalForm>(emptyForm);
  const [holidayData, setHolidayData] = useState<Array<{ date: string; summary: string; isCutiBersama: boolean }>>([]);
  const [processBarData, setProcessBarData] = useState<JadwalRow[]>([]);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [statistics, setStatistics] = useState<StatisticRow | null>(null);
  const statisticsUnitLabel = isLantai12(selectedLine) ? 'Produk' : 'Item';

  const currentYear = new Date().getFullYear();
  const holidaySet = useMemo(() => new Set(holidayData.map((item) => item.date)), [holidayData]);
  const cutiBersamaMap = useMemo(() => {
    const entries = holidayData
      .filter((item) => item.isCutiBersama)
      .map((item) => [item.date, item.summary] as const);
    return new Map(entries);
  }, [holidayData]);
  const holidayMap = useMemo(() => {
    const entries = holidayData.map((item) => [item.date, item.summary] as const);
    return new Map(entries);
  }, [holidayData]);

  useEffect(() => {
    let isMounted = true;

    const fetchHolidays = async () => {
      try {
        const response = await fetch(buildHolidayUrl(currentYear));
        if (!response.ok) throw new Error("Gagal mengambil data libur nasional");
        const data = await response.json();
        const items = Array.isArray(data.items) ? data.items : [];
        const normalized = items
          .map((item: any) => {
            const date = item?.start?.date;
            const summary = typeof item?.summary === "string" ? item.summary : "";
            const isCutiBersama = summary.toLowerCase().includes("cuti bersama") || summary.toLowerCase().includes("hari");
            if (typeof date !== "string") return null;
            return { date, summary: summary || "Libur nasional", isCutiBersama };
          })
          .filter((item: any) => item !== null);
        if (isMounted) {
          setHolidayData(normalized);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchHolidays();

    // Fetch process bar data
    const fetchProcessBar = async () => {
      try {
        const response = await fetch(`/api/process-bar?line=${encodeURIComponent(selectedLine)}`);
        if (!response.ok) throw new Error("Gagal mengambil data progress bar");
        const result = await response.json();
        //console.log("Process Bar Data:", result);
        if (isMounted && result.success) {
          setProcessBarData(result.data || []);
        } else if (isMounted && result.data) {
          setProcessBarData(result.data || []);
        }
      } catch (error) {
        console.error("Gagal mengambil data progress bar:", error);
        if (isMounted) {
          setProcessBarData([]);
        }
      }
    };

    fetchProcessBar();

    return () => {
      isMounted = false;
    };
  }, [currentYear]);

  // Fetch schedule statistics
  useEffect(() => {
    let isMounted = true;

    const fetchStatistics = async () => {
      try {
        const statisticsUrl =
          monthYearFilter !== "all"
            ? `/api/schedule/statistics?monthYear=${encodeURIComponent(monthYearFilter)}&line=${encodeURIComponent(selectedLine)}`
            : `/api/schedule/statistics?line=${encodeURIComponent(selectedLine)}`;

        const response = await fetch(statisticsUrl);
        if (!response.ok) throw new Error("Gagal mengambil data statistik");
        const data = await response.json();
        
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setStatistics(data[0]);
        }
      } catch (error) {
        console.error("Gagal mengambil statistik jadwal:", error);
        if (isMounted) {
          setStatistics(null);
        }
      }
    };

    fetchStatistics();

    return () => {
      isMounted = false;
    };
  }, [rows, monthYearFilter, selectedLine]); // Refetch when rows or month-year filter change

  // Auto-refresh data on page load (can be disabled when server provides initialRows)
  useEffect(() => {
    if (!disableAutoRefresh) refreshRows();
  }, [disableAutoRefresh]); // Run once on mount unless disabled

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let filtered = rows.filter((row) => {
      // Filter by month-year with overlap detection for cross-month schedules
      if (monthYearFilter !== "all") {
        if (!row.tanggal_mulai || !row.tanggal_selesai) return false;
        const [year, month] = monthYearFilter.split('-').map(Number);
        
        // Define range of selected month
        const filterStart = new Date(year, month - 1, 1);
        filterStart.setHours(0, 0, 0, 0);
        const filterEnd = new Date(year, month, 0);
        filterEnd.setHours(23, 59, 59, 999);
        
        // Get schedule date range
        const scheduleStart = new Date(row.tanggal_mulai);
        const scheduleEnd = new Date(row.tanggal_selesai);
        
        if (Number.isNaN(scheduleStart.valueOf()) || Number.isNaN(scheduleEnd.valueOf())) return false;
        
        // Check if schedule overlaps with selected month range
        const overlaps = scheduleStart <= filterEnd && scheduleEnd >= filterStart;
        if (!overlaps) return false;
      }
      // Filter by search query
      if (!query) return true;
      return (row.id_product || "").toLowerCase().includes(query) || (row.product_name || "").toLowerCase().includes(query);
    });

    // Apply sorting
    if (sortConfig.column) {
      filtered = [...filtered].sort((a, b) => {
        const column = sortConfig.column as string;
        let aVal: any = (a as any)[column];
        let bVal: any = (b as any)[column];

        // Handle null/undefined
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        // Convert to string for comparison if needed
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [rows, searchQuery, monthYearFilter, sortConfig]);

  const stats = useMemo(() => {
    const totalRows = rows.length;
    const totalTrainset = new Set(rows.map((row) => row.trainset).filter(Boolean)).size;
    const totalPersonil = rows.reduce((sum, row) => sum + (row.total_personil || 0), 0);
    const totalTiapts = rows.reduce((sum, row) => sum + (row.jumlah_tiapts || 0), 0);
    const totalTungguQc = rows.reduce((sum, row) => sum + (row.jumlah_tunggu_qc || 0), 0);
    const totalFinishGood = rows.reduce((sum, row) => sum + (row.jumlah_finish_good || 0), 0);
    const totalKekurangan = rows.reduce((sum, row) => sum + (row.jumlah_kekurangan || 0), 0);
    return { totalRows, totalTrainset, totalPersonil, totalTiapts, totalTungguQc, totalFinishGood, totalKekurangan };
  }, [rows]);

  // Computed value for current form and setter based on mode
  const currentForm = editingKey ? editForm : createForm;
  
  // Helper function to update the correct form state
  const updateFormField = (field: keyof JadwalForm, value: string) => {
    if (editingKey) {
      setEditForm(prev => ({ ...prev, [field]: value }));
    } else {
      setCreateForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const refreshRows = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/jadwal?line=${encodeURIComponent(selectedLine)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Gagal mengambil data jadwal");
      const data = await response.json();
      setRows(Array.isArray(data.rows) ? data.rows : []);
    } catch (error) {
      console.error(error);
      alert("Gagal mengambil data jadwal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = async () => {
    if (!canManageSchedule) {
      alert("Hanya user role PERENCANAAN atau ADMIN yang dapat menambah data jadwal.");
      return;
    }

    if (!isValidForm(createForm)) {
      alert("Lengkapi ID Product, Product Name, dan Trainset.");
      return;
    }
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const payload = buildPayload(createForm);
      const response = await fetch("/api/jadwal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setModalType('error');
        setShowModal(true);
        setTimeout(() => setShowModal(false), 3000);
        return;
      }
      setCreateForm(emptyForm);
      setShowFormCard(false);
      await refreshRows();
      setModalType('success');
      setShowModal(true);
      setTimeout(() => setShowModal(false), 2000);
    } catch (error) {
      console.error(error);
      setModalType('error');
      setShowModal(true);
      setTimeout(() => setShowModal(false), 3000);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const toggleCreateForm = () => {
    if (!canManageSchedule) return;

    if (editingKey) {
      setEditingKey(null);
      setEditForm(emptyForm);
      setOriginalEditForm(emptyForm);
    }
    setShowFormCard(!showFormCard);
    if (!showFormCard) {
      setCreateForm(emptyForm);
    }
  };

  const handleSort = (column: string) => {
    setSortConfig((prev) => {
      if (prev.column === column) {
        // Toggle direction if same column
        return {
          column,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      // New column, sort ascending
      return { column, direction: 'asc' };
    });
  };

  const getSortIndicator = (column: string) => {
    if (sortConfig.column !== column) return '';
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  const startEdit = (row: JadwalRow) => {
    if (!canManageSchedule) {
      alert("Hanya user role PERENCANAAN atau ADMIN yang dapat mengubah data jadwal.");
      return;
    }

    if (!row.id_jadwal) return;
    if (editingKey?.id_jadwal === row.id_jadwal && showFormCard) {
      setEditingKey(null);
      setEditForm(emptyForm);
      setOriginalEditForm(emptyForm);
      setShowFormCard(false);
      return;
    }
    const editData = {
      id_product: row.id_product || "",
      product_name: row.product_name || "",
      project: row.project || "",
      trainset: String(row.trainset ?? ""),
      jumlah_tiapts: String(row.jumlah_tiapts ?? ""),
      total_personil: String(row.total_personil ?? ""),
      line: row.line || "",
      workshop: row.workshop || "",
      tanggal_mulai: toDateInputValue(row.tanggal_mulai),
      tanggal_selesai: toDateInputValue(row.tanggal_selesai),
    };
    setEditingKey({ id_jadwal: Number(row.id_jadwal) });
    setEditForm(editData);
    setOriginalEditForm(editData);
    setShowFormCard(true);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditForm(emptyForm);
    setOriginalEditForm(emptyForm);
    setShowFormCard(false);
  };

  const handleUpdate = async () => {
    if (!canManageSchedule) {
      alert("Hanya user role PERENCANAAN atau ADMIN yang dapat mengubah data jadwal.");
      return;
    }

    if (!editingKey) return;
    if (!isValidForm(editForm)) {
      alert("Lengkapi semua field yang diperlukan (*)");
      return;
    }
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const payload = {
        key: editingKey,
        data: buildPayload(editForm),
      };
      const response = await fetch("/api/jadwal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setModalType('error');
        setShowModal(true);
        setTimeout(() => setShowModal(false), 3000);
        return;
      }
      setEditingKey(null);
      setEditForm(emptyForm);
      setShowFormCard(false);
      await refreshRows();
      setModalType('success');
      setShowModal(true);
      setTimeout(() => setShowModal(false), 2000);
    } catch (error) {
      console.error(error);
      setModalType('error');
      setShowModal(true);
      setTimeout(() => setShowModal(false), 3000);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (row: JadwalRow) => {
    if (!canManageSchedule) {
      alert("Hanya user role PERENCANAAN atau ADMIN yang dapat menghapus data jadwal.");
      return;
    }

    if (!row.id_jadwal) return;
    const confirmed = window.confirm("Hapus data jadwal ini?");
    if (!confirmed) return;
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const payload = { key: { id_jadwal: Number(row.id_jadwal) } };
      const response = await fetch("/api/jadwal", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Gagal menghapus data");
      await refreshRows();
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus data jadwal.");
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Calendar className="w-8 h-8 text-blue-400" />
          Jadwal Produksi
        </h1>
        <p className="text-gray-400">Dikelola oleh Tim Perencanaan Produksi</p>
      </div>




      {/* Gantt Chart */}
      {filteredRows.length > 0 && (() => {
        let { minDate, maxDate, totalDays } = getDateRange(filteredRows);
        
        // Override date range when month filter is active
        if (monthYearFilter !== "all") {
          const [year, month] = monthYearFilter.split('-').map(Number);
          minDate = new Date(year, month - 1, 1);
          minDate.setHours(0, 0, 0, 0);
          maxDate = new Date(year, month, 0); // Last day of the month
          maxDate.setHours(0, 0, 0, 0);
          totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const rangeStart = new Date(minDate);
        rangeStart.setHours(0, 0, 0, 0);
        const todayIndex = Math.floor((today.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
        const isTodayInRange = todayIndex >= 0 && todayIndex < totalDays && today >= minDate && today <= maxDate;
        
        // Generate months for header
        const months: { month: number; year: number; days: number; offset: number }[] = [];
        let currentDate = new Date(minDate);
        let dayOffset = 0;
        
        while (currentDate <= maxDate) {
          const month = currentDate.getMonth();
          const year = currentDate.getFullYear();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const startDay = currentDate.getDate();
          const remainingDays = daysInMonth - startDay + 1;
          const daysToShow = Math.min(remainingDays, Math.ceil((maxDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
          
          months.push({ month, year, days: daysToShow, offset: dayOffset });
          dayOffset += daysToShow;
          
          currentDate.setMonth(month + 1);
          currentDate.setDate(1);
        }
        
        // Get unique floors for legend
        const floorsSet = new Set<string>();
        const processSet = new Set<string>();
        filteredRows.forEach(row => {
          const searchText = (row.line || '').toLowerCase();
          if (searchText.includes('lantai 3') || searchText.includes('lt 3') || searchText.includes('lt3')) {
            floorsSet.add('Lantai 3');
          } else if (searchText.includes('lantai 2') || searchText.includes('lt 2') || searchText.includes('lt2')) {
            floorsSet.add('Lantai 2');
          } else if (searchText.includes('lantai 1') || searchText.includes('lt 1') || searchText.includes('lt1')) {
            floorsSet.add('Lantai 1');
          }

          if ((isLantai12(row.line) && row.proses_produk) || (useProcessColor && row.proses_produk)) {
            processSet.add(row.proses_produk);
          }
        });
        const uniqueFloors = Array.from(floorsSet).sort();
        const uniqueProcesses = Array.from(processSet).sort((a, b) => a.localeCompare(b));
        const showProcessLegend = useProcessColor || (
          uniqueProcesses.length > 0 &&
          uniqueFloors.length > 0 &&
          uniqueFloors.every((floor) => floor === 'Lantai 1' || floor === 'Lantai 2')
        );
        
        // Get today's date key for comparison
        const todayKey = toDateKey(today);
        const selectedMonthRange = (() => {
          if (monthYearFilter === 'all') return null;
          const [yearText, monthText] = monthYearFilter.split('-');
          const year = Number(yearText);
          const month = Number(monthText);

          if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
            return null;
          }

          const start = new Date(year, month - 1, 1);
          start.setHours(0, 0, 0, 0);

          const end = new Date(year, month, 0);
          end.setHours(23, 59, 59, 999);

          return { start, end };
        })();
        
        return (
          <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Gantt Chart - Timeline Produksi</h2>
                  <div className="flex items-center gap-4">
                    {/* Legend */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {showProcessLegend ? (
                        uniqueProcesses.map((proses) => (
                          <div key={proses} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${useProcessColor ? getProductColorByProcessWithPalette(proses, processPalette as 'default' | 'dark') : getProductColorByProcess(proses)}`}></div>
                            <span className="text-xs text-gray-300">{proses}</span>
                          </div>
                        ))
                      ) : (
                        uniqueFloors.map((floor) => {
                          const floorColor = floor === 'Lantai 3' ? 'bg-blue-500' : 
                                            floor === 'Lantai 2' ? 'bg-amber-700' : 
                                            floor === 'Lantai 1' ? 'bg-purple-500' : 'bg-gray-500';
                          return (
                            <div key={floor} className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded ${floorColor}`}></div>
                              <span className="text-xs text-gray-300">{floor}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {/* Toggle Progress Bar Button */}
                    <button
                      onClick={() => setShowProgressBar(!showProgressBar)}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                        showProgressBar
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-gray-700/50 text-gray-300 border-gray-600/50 hover:bg-gray-600/50'
                      }`}
                    >
                      {showProgressBar ? (
                        <>
                          <Eye className="w-4 h-4" />
                          Show Actual Progress
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Show Actual Progress
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    {/* Header - Months */}
                    <div className="flex border-b border-gray-700">
                      <div className="flex-1 flex">
                        {months.map((m, idx) => (
                          <div
                            key={`${m.year}-${m.month}-${idx}`}
                            className="border-l border-gray-700 px-2 py-2 text-center"
                            style={{ width: `${(m.days / totalDays) * 100}%` }}
                          >
                            <div className="text-xs font-semibold text-gray-300">
                              {monthNames[m.month]} {m.year}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Header - Days */}
                    <div className="flex border-b border-gray-700">
                      <div className="flex-1 flex">
                        {(() => {
                          const days = [];
                          let currentDay = new Date(minDate);
                          
                          for (let i = 0; i < totalDays; i++) {
                            const dayNum = currentDay.getDate();
                            const isWeekend = currentDay.getDay() === 0 || currentDay.getDay() === 6;
                            const dateKey = toDateKey(currentDay);
                            const isToday = dateKey === todayKey;
                            const isHoliday = holidaySet.has(dateKey);
                            const holidayName = holidayMap.get(dateKey);
                            
                            days.push(
                              <div
                                key={`day-${i}`}
                                className={`border-l ${isToday ? 'border-yellow-500 bg-yellow-500/50' : 'border-gray-800/50'} text-center flex items-center justify-center ${isWeekend ? 'bg-gray-700/20' : ''} ${isHoliday ? 'bg-red-500/25' : ''} ${holidayName ? 'cursor-help' : ''}`}
                                title={holidayName}
                                style={{ width: `${(1 / totalDays) * 100}%`, minWidth: '20px' }}
                              >
                                <span className={`text-[10px] ${isToday ? 'text-yellow-900 font-bold' : 'text-gray-400'}`}>{dayNum}</span>
                              </div>
                            );
                            
                            currentDay.setDate(currentDay.getDate() + 1);
                          }
                          
                          return days;
                        })()}
                      </div>
                    </div>
                    
                    {/* Rows - Products */}
                    <div>
                      {filteredRows.map((row, idx) => {
                        if (!row.tanggal_mulai || !row.tanggal_selesai) return null;
                        
                        const startDate = new Date(row.tanggal_mulai);
                        const endDate = new Date(row.tanggal_selesai);
                        
                        if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf())) return null;
                        
                        // Calculate position and width with clamping to visible range for cross-month schedules
                        // When month filter is active, schedule may span multiple months; clamp to visible range
                        const clampedStart = startDate < minDate ? minDate : startDate;
                        const clampedEnd = endDate > maxDate ? maxDate : endDate;
                        
                        // Only render bar if it overlaps with visible range
                        if (clampedStart > maxDate || clampedEnd < minDate) return null;
                        
                        const startOffset = (clampedStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
                        const duration = Math.max(1, ((clampedEnd.getTime() - clampedStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                        const leftPercent = (startOffset / totalDays) * 100;
                        const widthPercent = (duration / totalDays) * 100;
                        
                        const productColor = useProcessColor
                          ? getProductColorByProcessWithPalette(row.proses_produk, processPalette as 'default' | 'dark')
                          : (isLantai12(row.line)
                            ? (row.proses_produk
                              ? getProductColorByProcess(row.proses_produk)
                              : getProductColorByFloor(row.line))
                            : getProductColorByFloor(row.line));
                        
                        return (
                          <div key={`gantt-${row.id_product}-${idx}`} className="flex border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                            <div className="flex-1 relative flex items-center" style={{ height: '32px' }}>
                              {/* Weekend background stripes */}
                              {(() => {
                                const weekendBars = [];
                                let checkDate = new Date(minDate);
                                for (let i = 0; i < totalDays; i++) {
                                  const isWeekend = checkDate.getDay() === 0 || checkDate.getDay() === 6;
                                  const dateKey = toDateKey(checkDate);
                                  const isHoliday = holidaySet.has(dateKey);
                                  const holidayName = holidayMap.get(dateKey);
                                  if (isWeekend) {
                                    weekendBars.push(
                                      <div
                                        key={`weekend-${idx}-${i}`}
                                        className="absolute h-full bg-gray-700/10"
                                        style={{
                                          left: `${(i / totalDays) * 100}%`,
                                          width: `${(1 / totalDays) * 100}%`,
                                        }}
                                      />
                                    );
                                    weekendBars.push(
                                      <div
                                        key={`weekend-line-${idx}-${i}`}
                                        className="absolute h-full bg-red-500/25"
                                        style={{
                                          left: `${(i / totalDays) * 100}%`,
                                          width: `${(1 / totalDays) * 100}%`,
                                        }}
                                      />
                                    );
                                  }
                                  if (isHoliday) {
                                    weekendBars.push(
                                      <div
                                        key={`holiday-${idx}-${i}`}
                                        className="absolute h-full bg-red-600/30"
                                        title={holidayName}
                                        style={{
                                          left: `${(i / totalDays) * 100}%`,
                                          width: `${(1 / totalDays) * 100}%`,
                                        }}
                                      />
                                    );
                                  }
                                  checkDate.setDate(checkDate.getDate() + 1);
                                }
                                return weekendBars;
                              })()}
                              
                              {/* Product Bar */}
                              <div
                                className={`absolute ${productColor} rounded px-2 py-1 text-xs text-white font-semibold shadow-lg cursor-pointer hover:opacity-90 transition-opacity z-10`}
                                style={{
                                  left: `${leftPercent}%`,
                                  width: `${Math.max(widthPercent, 2)}%`,
                                }}
                                title={`${row.product_name}\nProses Produk: ${row.proses_produk || '-'}\nTrainset: ${row.trainset ?? '-'}\nLine: ${row.line || '-'}\nJumlah Tiap TS: ${row.jumlah_tiapts ?? '-'}\nPersonil: ${row.total_personil ?? '-'}\nDurasi: ${formatIdealTime(row.total_ideal_time_qc)}\nMulai: ${formatDate(row.tanggal_mulai)}\nSelesai: ${formatDate(row.tanggal_selesai)}`}
                              >
                                <div className="truncate">{row.product_name || '-'} x {row.jumlah_tiapts ?? '-'}</div>
                              </div>
                              
                              {/* Progress Bar Overlay */}
                              {showProgressBar && (() => {
                                const progressBars: React.ReactNode[] = [];
                                const shouldMatchProcessName = isLantai12(row.line);
                                const normalizedRowProcess = (row.proses_produk || '').trim().toLowerCase();
                                const processItems = processBarData.filter((item) => {
                                  if (item.id_product !== row.id_product || item.trainset !== row.trainset) {
                                    return false;
                                  }

                                  if (!shouldMatchProcessName) {
                                    return true;
                                  }

                                  const normalizedItemProcess = (item.process_name || '').trim().toLowerCase();
                                  if (!normalizedRowProcess || !normalizedItemProcess) {
                                    return false;
                                  }

                                  return matchesProcessNameFlexible(normalizedRowProcess, normalizedItemProcess);
                                });
                                const dayInMs = 1000 * 60 * 60 * 24;
                                const visibleRangeStart = selectedMonthRange ? selectedMonthRange.start : minDate;
                                const visibleRangeEnd = selectedMonthRange ? selectedMonthRange.end : maxDate;

                                const processItemsInRange = processItems
                                  .filter((item) => {
                                    const startDate = item.start_actual ? new Date(item.start_actual) : null;
                                    const finishDate = item.finish_actual ? new Date(item.finish_actual) : null;

                                    const validStart = startDate && !Number.isNaN(startDate.valueOf()) ? startDate : null;
                                    const validFinish = finishDate && !Number.isNaN(finishDate.valueOf()) ? finishDate : null;

                                    const rangeStart = validStart || validFinish;
                                    const rangeEnd = validFinish || validStart;

                                    if (!rangeStart || !rangeEnd) return false;

                                    return rangeEnd >= visibleRangeStart && rangeStart <= visibleRangeEnd;
                                  })
                                  .sort((a, b) => {
                                    const aStart = a.start_actual ? new Date(a.start_actual).getTime() : Number.MAX_SAFE_INTEGER;
                                    const bStart = b.start_actual ? new Date(b.start_actual).getTime() : Number.MAX_SAFE_INTEGER;
                                    if (aStart !== bStart) return aStart - bStart;
                                    return (a.id_perproduct || '').localeCompare(b.id_perproduct || '');
                                  });

                                const normalizedSelectedLine = (selectedLine ?? '').trim().toLowerCase();
                                const isSelectedLantai12 = normalizedSelectedLine === 'lantai 1' || normalizedSelectedLine === 'lantai 2';
                                const barNumberById = new Map<string, number>();
                                
                                if (!isSelectedLantai12) {
                                  processItemsInRange.forEach((item) => {
                                    const id = (item.id_perproduct || '').trim();
                                    if (!id) return;
                                    if (!barNumberById.has(id)) {
                                      barNumberById.set(id, barNumberById.size + 1);
                                    }
                                  });
                                }

                                processItemsInRange.forEach((processItem, pIdx) => {
                                  if (!processItem.start_actual && !processItem.finish_actual) return;

                                  const startDate = processItem.start_actual ? new Date(processItem.start_actual) : null;
                                  const finishDate = processItem.finish_actual ? new Date(processItem.finish_actual) : null;

                                  if (startDate && !Number.isNaN(startDate.valueOf())) {
                                    const validFinishDate = finishDate && !Number.isNaN(finishDate.valueOf()) ? finishDate : startDate;
                                    const clampedStartTime = Math.max(startDate.getTime(), minDate.getTime(), visibleRangeStart.getTime());
                                    const clampedEndTime = Math.min(validFinishDate.getTime(), maxDate.getTime(), visibleRangeEnd.getTime());

                                    if (clampedEndTime < clampedStartTime) return;

                                    const startOffset = (clampedStartTime - minDate.getTime()) / dayInMs;
                                    const endOffset = (clampedEndTime - minDate.getTime()) / dayInMs;

                                    const duration = Math.max(1, endOffset - startOffset + 1);
                                    const progressLeftPercent = (startOffset / totalDays) * 100;
                                    const progressWidthPercent = (duration / totalDays) * 100;

                                    const operatorName = processItem.operator_actual_name || 'Unknown';
                                    const idProd = processItem.id_perproduct || '-';
                                    const barNumber = isSelectedLantai12 && processItem.qty_progress
                                      ? processItem.qty_progress
                                      : (processItem.id_perproduct
                                        ? (barNumberById.get(processItem.id_perproduct) || pIdx + 1)
                                        : pIdx + 1);
                                    const hoverText = `ID: ${idProd}\nTrainset: ${processItem.trainset ?? row.trainset ?? '-'}\nOperator: ${operatorName}\n${processItem.product_name || '-'}\nStart: ${formatDate(startDate)}\nFinish: ${formatDate(finishDate)}`;
                                    
                                    progressBars.push(
                                      <div
                                        key={`progress-${row.id_product}-${row.trainset}-${pIdx}`}
                                        className="absolute bg-emerald-500/30 hover:bg-emerald-400/60 transition-all cursor-pointer rounded flex items-center justify-center"
                                        style={{
                                          left: `${progressLeftPercent}%`,
                                          width: `${Math.max(progressWidthPercent, 3)}%`,
                                          top: '6px',
                                          height: '20px',
                                          zIndex: 20,
                                        }}
                                        title={hoverText}
                                      >
                                        <span className="text-[10px] font-bold text-white">{barNumber}</span>
                                      </div>
                                    );
                                  }
                                });
                                
                                return progressBars;
                              })()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

            {/* Statistics Dashboard - All in One Row */}
      {statistics && (
        <Card className="bg-gray-800/50 border border-gray-700/50">
          <CardContent className="p-6 overflow-x-auto">
            <div className="grid grid-flow-col grid-rows-1 auto-cols-[minmax(180px,1fr)] gap-2 min-w-max">
              {/* Target Total TS */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-500/20 flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 truncate">Total</p>
                  <p className="text-xl font-bold text-white">{statistics.total_target_ts || 0} <span className="text-sm font-normal text-gray-400">{statisticsUnitLabel}</span></p>
                  <p className="text-xs text-gray-500">Bulan ini</p>
                </div>
              </div>

              {/* Kekurangan */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 truncate">To Do</p>
                  <p className="text-xl font-bold text-yellow-400">{statistics.total_kekurangan || 0} <span className="text-sm font-normal text-yellow-400/60">{statisticsUnitLabel}</span></p>
                  <p className="text-xs text-yellow-400/70">{Number(statistics.persen_kekurangan || 0).toFixed(0)}%</p>
                </div>
              </div>

              {/* On Progress */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 truncate">Assembling</p>
                  <p className="text-xl font-bold text-cyan-400">{statistics.total_on_progress || 0} <span className="text-sm font-normal text-cyan-400/60">{statisticsUnitLabel}</span></p>
                  <p className="text-xs text-cyan-400/70">{Number(statistics.persen_on_progress || 0).toFixed(0)}%</p>
                </div>
              </div>

              {/* Tunggu QC */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 truncate">Tunggu QC</p>
                  <p className="text-xl font-bold text-blue-400">{statistics.total_tunggu_qc || 0} <span className="text-sm font-normal text-blue-400/60">{statisticsUnitLabel}</span></p>
                  <p className="text-xs text-blue-400/70">{Number(statistics.persen_tunggu_qc || 0).toFixed(0)}%</p>
                </div>
              </div>

                            {/* Finish Good */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 truncate">Finish Good</p>
                  <p className="text-xl font-bold text-emerald-400">{statistics.total_finish_good || 0} <span className="text-sm font-normal text-emerald-400/60">{statisticsUnitLabel}</span></p>
                  <p className="text-xs text-emerald-400/70">{Number(statistics.persen_finish_good || 0).toFixed(0)}%</p>
                </div>
              </div>

              {/* Tepat Waktu */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 truncate">Tepat Waktu</p>
                  <p className="text-xl font-bold text-emerald-400">{statistics.total_tepat_waktu || 0} <span className="text-sm font-normal text-emerald-400/60">{statisticsUnitLabel}</span></p>
                  <p className="text-xs text-emerald-400/70">{Number(statistics.persen_tepat_waktu || 0).toFixed(0)}%</p>
                </div>
              </div>

                            {/* Terlambat */}
              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                                  <Timer className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 truncate">Terlambat</p>
                                  <p className="text-xl font-bold text-yellow-400">{statistics.total_terlambat || 0} <span className="text-sm font-normal text-yellow-400/60">{statisticsUnitLabel}</span></p>
                                  <p className="text-xs text-yellow-400/70">{Number(statistics.persen_terlambat || 0).toFixed(0)}%</p>
                </div>
              </div>

              {/* Kurang Komponen */}
              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 truncate">Kurang Komponen</p>
                                  <p className="text-xl font-bold text-red-400">{statistics.total_kurang_komponen || 0} <span className="text-sm font-normal text-red-400/60">{statisticsUnitLabel}</span></p>
                                  <p className="text-xs text-red-400/70">{Number(statistics.persen_kurang_komponen || 0).toFixed(0)}%</p>
                </div>
              </div>


            </div>
          </CardContent>
        </Card>
      )}

           {showFormCard && (
        <Card className="bg-gray-900/40 border border-gray-700/50">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-white">
              {editingKey ? (
                <>
                  <Pencil className="w-4 h-4 text-amber-400" />
                  <h2 className="text-lg font-semibold">Ubah Jadwal</h2>
                  <Badge className="bg-amber-500/10 text-amber-300 border border-amber-500/40">Editing</Badge>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-lg font-semibold">Tambah Jadwal</h2>
                </>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-300">ID Product <span className="text-red-500">*</span></label>
                <input value={currentForm.id_product} onChange={(e) => updateFormField('id_product', e.target.value)} placeholder="Masukan ID Product" className="w-full px-3 py-2 bg-gray-800/70 border border-gray-700/60 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-300">Product Name <span className="text-red-500">*</span></label>
                <input value={currentForm.product_name} onChange={(e) => updateFormField('product_name', e.target.value)} placeholder="Masukan Product Name" className="w-full px-3 py-2 bg-gray-800/70 border border-gray-700/60 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-300">Project <span className="text-red-500">*</span></label>
                <input 
                  list="project-list" 
                  value={currentForm.project} 
                  onChange={(e) => updateFormField('project', e.target.value)} 
                  placeholder="Pilih atau ketik Project" 
                  autoComplete="off"
                  className="w-full px-3 py-2 bg-gray-800/70 border border-gray-700/60 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
                />
                <datalist id="project-list">
                  {getUniqueValues(rows, 'project').map((val) => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </datalist>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-300">Trainset <span className="text-red-500">*</span></label>
                <input 
                  list="trainset-list" 
                  value={currentForm.trainset} 
                  onChange={(e) => updateFormField('trainset', e.target.value)} 
                  placeholder="Pilih atau ketik Trainset" 
                  autoComplete="off"
                  className="w-full px-3 py-2 bg-gray-800/70 border border-gray-700/60 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
                  type="number" 
                />
                <datalist id="trainset-list">
                  {getUniqueValues(rows, 'trainset').map((val) => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </datalist>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-300">Jumlah Tiap TS <span className="text-red-500">*</span></label>
                <input value={currentForm.jumlah_tiapts} onChange={(e) => updateFormField('jumlah_tiapts', e.target.value)} placeholder="Masukan jumlah" className="w-full px-3 py-2 bg-gray-800/70 border border-gray-700/60 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" type="number" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-300">Total Personil <span className="text-red-500">*</span></label>
                <input value={currentForm.total_personil} onChange={(e) => updateFormField('total_personil', e.target.value)} placeholder="Masukan total personil" className="w-full px-3 py-2 bg-gray-800/70 border border-gray-700/60 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" type="number" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-300">Line <span className="text-red-500">*</span></label>
                <input 
                  list="line-list" 
                  value={currentForm.line} 
                  onChange={(e) => updateFormField('line', e.target.value)} 
                  placeholder="Pilih atau ketik Line" 
                  autoComplete="off"
                  className="w-full px-3 py-2 bg-gray-800/70 border border-gray-700/60 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
                />
                <datalist id="line-list">
                  {getUniqueValues(rows, 'line').map((val) => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </datalist>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-300">Workshop <span className="text-red-500">*</span></label>
                <input 
                  list="workshop-list" 
                  value={currentForm.workshop} 
                  onChange={(e) => updateFormField('workshop', e.target.value)} 
                  placeholder="Pilih atau ketik Workshop" 
                  autoComplete="off"
                  className="w-full px-3 py-2 bg-gray-800/70 border border-gray-700/60 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
                />
                <datalist id="workshop-list">
                  {getUniqueValues(rows, 'workshop').map((val) => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </datalist>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-300">Tanggal Mulai <span className="text-red-500">*</span></label>
                <input value={currentForm.tanggal_mulai} onChange={(e) => updateFormField('tanggal_mulai', e.target.value)} className="w-full px-3 py-2 bg-gray-800/70 border border-gray-700/60 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" type="date" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-300">Tanggal Selesai <span className="text-red-500">*</span></label>
                <input value={currentForm.tanggal_selesai} onChange={(e) => updateFormField('tanggal_selesai', e.target.value)} className="w-full px-3 py-2 bg-gray-800/70 border border-gray-700/60 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" type="date" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={cancelEdit} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-600/70 text-gray-300 hover:text-white">
                <X className="w-4 h-4" />
                Batal
              </button>
              <button type="button" onClick={editingKey ? handleUpdate : handleCreate} disabled={isSubmitting || !isValidForm(currentForm)} className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${editingKey ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 disabled:hover:bg-amber-500/20" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 disabled:hover:bg-emerald-500/20"}`}>
                <Save className="w-4 h-4" />
                {editingKey ? "Update" : "Simpan"}
              </button>
            </div>
          </CardContent>
        </Card>
      )}


            <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Cari ID Product atau Product Name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all" />
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={toggleCreateForm} disabled={!canManageSchedule} className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-2.5 rounded-lg border border-emerald-500/40 hover:bg-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-500/20">
            <Plus className="w-4 h-4" />
            Tambah Data
          </button>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select value={monthYearFilter} onChange={(e) => setMonthYearFilter(e.target.value)} className="pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200">
              <option value="all">Semua Bulan</option>
              {getMonthYearOptions(rows).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button onClick={refreshRows} disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 hover:text-white">
            Refresh
          </button>
        </div>
      </div>

      <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-900/50 border-b border-gray-700/50">
                  <th className="text-left p-4 text-gray-300 font-semibold text-sm cursor-pointer hover:bg-gray-800/50 hover:text-white transition-colors" onClick={() => handleSort('id_product')}>ID Product{getSortIndicator('id_product')}</th>
                  <th className="text-left p-4 text-gray-300 font-semibold text-sm cursor-pointer hover:bg-gray-800/50 hover:text-white transition-colors" onClick={() => handleSort('product_name')}>Product Name{getSortIndicator('product_name')}</th>
                  <th className="text-left p-4 text-gray-300 font-semibold text-sm cursor-pointer hover:bg-gray-800/50 hover:text-white transition-colors" onClick={() => handleSort('project')}>Project{getSortIndicator('project')}</th>
                  <th className="text-center p-4 text-gray-300 font-semibold text-sm cursor-pointer hover:bg-gray-800/50 hover:text-white transition-colors" onClick={() => handleSort('trainset')}>Trainset{getSortIndicator('trainset')}</th>
                  <th className="text-center p-4 text-gray-300 font-semibold text-sm cursor-pointer hover:bg-gray-800/50 hover:text-white transition-colors" onClick={() => handleSort('jumlah_tiapts')}>Jumlah Tiap TS{getSortIndicator('jumlah_tiapts')}</th>
                  <th className="text-center p-4 text-gray-300 font-semibold text-sm cursor-pointer hover:bg-gray-800/50 hover:text-white transition-colors" onClick={() => handleSort('total_personil')}>Total Personil{getSortIndicator('total_personil')}</th>
                  <th className="text-left p-4 text-gray-300 font-semibold text-sm cursor-pointer hover:bg-gray-800/50 hover:text-white transition-colors" onClick={() => handleSort('line')}>Line{getSortIndicator('line')}</th>
                  <th className="text-left p-4 text-gray-300 font-semibold text-sm cursor-pointer hover:bg-gray-800/50 hover:text-white transition-colors" onClick={() => handleSort('tanggal_mulai')}>Tanggal Mulai{getSortIndicator('tanggal_mulai')}</th>
                  <th className="text-left p-4 text-gray-300 font-semibold text-sm cursor-pointer hover:bg-gray-800/50 hover:text-white transition-colors" onClick={() => handleSort('tanggal_selesai')}>Tanggal Selesai{getSortIndicator('tanggal_selesai')}</th>
                  <th className="text-left p-4 text-gray-300 font-semibold text-sm cursor-pointer hover:bg-gray-800/50 hover:text-white transition-colors" onClick={() => handleSort('status')}>Status{getSortIndicator('status')}</th>
                   <th className="text-left p-4 text-gray-300 font-semibold text-sm cursor-pointer hover:bg-gray-800/50 hover:text-white transition-colors" onClick={() => handleSort('jumlah_kekurangan')}>Jumlah Kekurangan{getSortIndicator('jumlah_kekurangan')}</th>  
                  <th className="text-center p-4 text-gray-300 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length > 0 ? (
                  filteredRows.map((row, index) => (
                    <tr key={`${row.id_product}-${row.product_name}-${row.trainset}-${index}`} className={`border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors ${index % 2 === 0 ? "bg-gray-900/20" : "bg-transparent"}`}>
                      <td className="p-4 text-white font-mono text-sm">{row.id_product || "—"}</td>
                      <td className="p-4 text-white text-sm">{row.product_name || "—"}</td>
                      <td className="p-4 text-white text-sm">{row.project || "—"}</td>
                      <td className="p-4 text-center text-white">{row.trainset ?? "—"}</td>
                      <td className="p-4 text-center text-white">{row.jumlah_tiapts ?? "—"}</td>
                      <td className="p-4 text-center text-white">{row.total_personil ?? "—"}</td>
                      <td className="p-4 text-white text-sm">{row.line || "—"}</td>
                      <td className="p-4 text-gray-300 text-sm">{formatDate(row.tanggal_mulai)}</td>
                      <td className="p-4 text-gray-300 text-sm">{formatDate(row.tanggal_selesai)}</td>
                      <td className="p-4 text-center"><span className={`inline-block px-2 py-1 rounded text-xs font-semibold transition-colors ${getStatusColor(row.status)}`}>{row.status || "—"}</span></td>
                      <td className="p-4 text-center text-white">{row.jumlah_kekurangan ?? "—"}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => startEdit(row)} disabled={!canManageSchedule} className="p-2 hover:bg-amber-500/20 rounded-lg text-amber-400 hover:text-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(row)} disabled={!canManageSchedule} className="p-2 hover:bg-rose-500/20 rounded-lg text-rose-400 hover:text-rose-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="p-12 text-center text-gray-400">
                      Tidak ada data jadwal.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-gray-400">
        <p>
          Menampilkan {filteredRows.length} data • Filter bulan: {monthYearFilter === "all" ? "Semua" : getMonthYearOptions(rows).find(opt => opt.value === monthYearFilter)?.label || monthYearFilter}
        </p>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" />
          <span>Terakhir diperbarui: {new Date().toLocaleString("id-ID")}</span>
        </div>
      </div>

      {/* Success/Error Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 animate-in zoom-in duration-150">
            <div className="flex flex-col items-center gap-6">
              {modalType === 'success' ? (
                <>
                  {/* Animated Checkmark */}
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-4 border-emerald-500 flex items-center justify-center animate-in zoom-in duration-300">
                      <svg className="w-12 h-12 text-emerald-500 animate-in zoom-in duration-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" className="animate-draw" style={{
                          strokeDasharray: 100,
                          strokeDashoffset: 100,
                          animation: 'draw 0.4s ease-out 0.1s forwards'
                        }} />
                      </svg>
                    </div>
                    {/* Success pulse effect */}
                    <div className="absolute inset-0 w-24 h-24 rounded-full bg-emerald-500/20 animate-ping" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold text-white">Berhasil!</h3>
                    <p className="text-gray-400">Data Berhasil Disimpan</p>
                  </div>
                </>
              ) : (
                <>
                  {/* Animated X Mark */}
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-rose-500/20 border-4 border-rose-500 flex items-center justify-center animate-in zoom-in duration-300">
                      <svg className="w-12 h-12 text-rose-500 animate-in zoom-in duration-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" className="animate-draw" style={{
                          strokeDasharray: 100,
                          strokeDashoffset: 100,
                          animation: 'draw 0.4s ease-out 0.1s forwards'
                        }} />
                      </svg>
                    </div>
                    {/* Error pulse effect */}
                    <div className="absolute inset-0 w-24 h-24 rounded-full bg-rose-500/20 animate-ping" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold text-white">Gagal!</h3>
                    <p className="text-gray-400">Data Gagal Disimpan</p>
                    <p className="text-sm text-gray-500">Hubungi Tim Pengembang</p>
                  </div>
                </>
              )}
              {/* OK Button */}
              <button
                onClick={() => setShowModal(false)}
                className="mt-4 px-8 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/50 animate-in zoom-in duration-500"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
