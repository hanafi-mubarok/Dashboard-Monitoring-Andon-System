"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type MonitoringKpmFiltersProps = {
  stOptions: string[];
  proyekOptions: string[];
  availableMonths: string[];
  currentMonth: string;
  defaultMonth: string;
  currentSt: string;
  currentPostDate: string;
  currentSearch: string;
  currentProyek: string;
  sortBy: string;
  sortDir: string;
};

export default function MonitoringKpmFilters({
  stOptions,
  proyekOptions,
  availableMonths,
  currentMonth,
  defaultMonth,
  currentSt,
  currentPostDate,
  currentSearch,
  currentProyek,
  sortBy,
  sortDir,
}: MonitoringKpmFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const debounceTimerRef = useRef<number | null>(null);

  const [st, setSt] = useState(currentSt);
  const [postDate, setPostDate] = useState(currentPostDate);
  const [search, setSearch] = useState(currentSearch);
  const [proyek, setProyek] = useState(currentProyek);
  const [month, setMonth] = useState(currentMonth);

  useEffect(() => {
    setSt(currentSt);
    setPostDate(currentPostDate);
    setSearch(currentSearch);
    setProyek(currentProyek);
    setMonth(currentMonth);
  }, [currentSt, currentPostDate, currentSearch, currentProyek, currentMonth]);

  const monthOptions = useMemo(() => {
    if (!availableMonths || availableMonths.length === 0) return [];

    const formatter = new Intl.DateTimeFormat('id-ID', {
      month: 'long',
      year: 'numeric',
    });

    return availableMonths.map((monthValue) => {
      const [year, month] = monthValue.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      return {
        value: monthValue,
        label: formatter.format(date),
      };
    });
  }, [availableMonths]);

  const buildQueryString = useMemo(() => {
    return (nextValues: {
      month: string;
      st: string;
      postDate: string;
      search: string;
      proyek: string;
    }) => {
    const params = new URLSearchParams();
      if (nextValues.month) params.set('month', nextValues.month);
      if (nextValues.st) params.set("st", nextValues.st);
      if (nextValues.postDate) params.set("post_date", nextValues.postDate);
      if (nextValues.search) params.set("search", nextValues.search);
      if (nextValues.proyek) params.set("proyek", nextValues.proyek);
      if (sortBy) params.set('sortBy', sortBy);
      if (sortDir) params.set('sortDir', sortDir);
      params.set('page', '1');
      return params.toString();
    };
  }, [sortBy, sortDir]);

  const updateUrl = useMemo(() => {
    return (nextValues: {
      month: string;
      st: string;
      postDate: string;
      search: string;
      proyek: string;
      debounce?: boolean;
    }) => {
      const nextQueryString = buildQueryString(nextValues);
      const nextUrl = nextQueryString ? `${pathname}?${nextQueryString}` : pathname;

      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      if (nextValues.debounce) {
        debounceTimerRef.current = window.setTimeout(() => {
          router.replace(nextUrl, { scroll: false });
        }, 350);
        return;
      }

      router.replace(nextUrl, { scroll: false });
    };
  }, [buildQueryString, pathname, router]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleReset = () => {
    setMonth(defaultMonth);
    setSt("");
    setPostDate("");
    setSearch("");
    setProyek("");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
      <div className="space-y-1">
        <label className="text-xs text-gray-400">Bulan</label>
        <select
          value={month}
          onChange={(e) => {
            const nextMonth = e.target.value;
            setMonth(nextMonth);
            updateUrl({ month: nextMonth, st, postDate, search, proyek });
          }}
          className="w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white"
        >
          {monthOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-gray-400">ST</label>
        <select
          value={st}
          onChange={(e) => {
            const nextSt = e.target.value;
            setSt(nextSt);
            updateUrl({ month, st: nextSt, postDate, search, proyek });
          }}
          className="w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white"
        >
          <option value="">Semua ST</option>
          {stOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-gray-400">Post Date</label>
        <input
          type="date"
          value={postDate}
          onChange={(e) => {
            const nextPostDate = e.target.value;
            setPostDate(nextPostDate);
            updateUrl({ month, st, postDate: nextPostDate, search, proyek });
          }}
          className="w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white cursor-pointer"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-gray-400">Search (No KPM, Item, Komat)</label>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            const nextSearch = e.target.value;
            setSearch(nextSearch);
            updateUrl({ month, st, postDate, search: nextSearch, proyek, debounce: true });
          }}
          placeholder="Ketik kata kunci..."
          className="w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-gray-400">Proyek</label>
        <select
          value={proyek}
          onChange={(e) => {
            const nextProyek = e.target.value;
            setProyek(nextProyek);
            updateUrl({ month, st, postDate, search, proyek: nextProyek });
          }}
          className="w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white"
        >
          <option value="">Semua Proyek</option>
          {proyekOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="xl:col-span-5 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setMonth(defaultMonth);
            setSt("");
            setPostDate("");
            setSearch("");
            setProyek("");
            updateUrl({ month: defaultMonth, st: "", postDate: "", search: "", proyek: "" });
          }}
          className="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600 transition-colors"
        >
          Reset Filter
        </button>
      </div>
    </div>
  );
}
