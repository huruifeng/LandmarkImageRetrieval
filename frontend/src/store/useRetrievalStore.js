import { create } from "zustand";
import { getStatus, getValImages, retrieve } from "../api/retrieval";

const PAGE_SIZE = 30;
const POLL_MS   = 1500;

const useRetrievalStore = create((set, get) => ({
  // ── Backend status ─────────────────────────────────────────────────────────
  backendStatus:   "starting",
  backendProgress: 0,
  backendMessage:  "Connecting to backend…",

  // ── Image browser ──────────────────────────────────────────────────────────
  valImages: [],   // [{filename, label}]
  filtered:  [],   // [{filename, label}]
  search:    "",
  page:      0,

  // ── Retrieval ──────────────────────────────────────────────────────────────
  selected:           null,   // filename string
  selectedLabel:      null,   // landmark_id int
  selectedClassTotal: null,   // # training images in that class
  topN:               5,
  results:       null,
  loading:       false,
  error:         null,

  // ── Actions ────────────────────────────────────────────────────────────────

  init: async () => {
    const poll = async () => {
      try {
        const s = await getStatus();
        set({ backendStatus: s.status, backendProgress: s.progress, backendMessage: s.message });
        if (s.status === "ready") return true;
        if (s.status === "error") return false;
      } catch {
        set({ backendMessage: "Connecting to backend…" });
      }
      return false;
    };

    while (!(await poll())) {
      await new Promise((r) => setTimeout(r, POLL_MS));
    }

    if (get().backendStatus !== "ready") return;

    try {
      const images = await getValImages();  // [{filename, label}]
      set({ valImages: images, filtered: images });
    } catch {
      set({ error: "Failed to fetch validation images." });
    }
  },

  setSearch: (q) => {
    const { valImages } = get();
    const term = q.trim().toLowerCase();
    const filtered = term
      ? valImages.filter(({ filename }) => filename.toLowerCase().includes(term))
      : valImages;
    set({ search: q, filtered, page: 0 });
  },

  setPage: (page) => set({ page }),

  selectImage: (filename, label, dbClassTotal) => set({
    selected: filename, selectedLabel: label, selectedClassTotal: dbClassTotal,
    results: null, error: null,
  }),

  setTopN: (n) => set({ topN: Math.max(1, Math.min(50, n)) }),

  runRetrieval: async () => {
    const { selected, topN } = get();
    if (!selected) return;
    set({ loading: true, error: null });
    try {
      const data = await retrieve(selected, topN);
      set({ results: data });
    } catch (e) {
      set({ error: String(e) });
    } finally {
      set({ loading: false });
    }
  },

  pageItems:  () => { const { filtered, page } = get(); return filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE); },
  totalPages: () => Math.ceil(get().filtered.length / PAGE_SIZE),
}));

export default useRetrievalStore;
