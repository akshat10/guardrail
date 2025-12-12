import { create } from 'zustand';
import type { ComponentStyleOverrides } from '../lib/theme';

interface GalleryState {
  // Navigation
  selectedComponent: string | null;

  // Interactive props
  propValues: Record<string, unknown>;

  // Style overrides for customization
  styleOverrides: ComponentStyleOverrides;

  // Actions
  selectComponent: (name: string, defaultProps?: Record<string, unknown>) => void;
  setPropValue: (name: string, value: unknown) => void;
  resetProps: (defaultProps?: Record<string, unknown>) => void;
  clearSelection: () => void;

  // Style actions
  setStyleOverride: <K extends keyof ComponentStyleOverrides>(
    key: K,
    value: ComponentStyleOverrides[K]
  ) => void;
  setStyleOverrides: (overrides: ComponentStyleOverrides) => void;
  resetStyles: () => void;
}

export const useGalleryStore = create<GalleryState>((set) => ({
  selectedComponent: null,
  propValues: {},
  styleOverrides: {},

  selectComponent: (name, defaultProps = {}) =>
    set({
      selectedComponent: name,
      propValues: defaultProps,
      styleOverrides: {}, // Reset styles when selecting new component
    }),

  setPropValue: (name, value) =>
    set((state) => ({
      propValues: { ...state.propValues, [name]: value },
    })),

  resetProps: (defaultProps = {}) =>
    set({
      propValues: defaultProps,
    }),

  clearSelection: () =>
    set({
      selectedComponent: null,
      propValues: {},
      styleOverrides: {},
    }),

  setStyleOverride: (key, value) =>
    set((state) => ({
      styleOverrides: { ...state.styleOverrides, [key]: value },
    })),

  setStyleOverrides: (overrides) =>
    set({
      styleOverrides: overrides,
    }),

  resetStyles: () =>
    set({
      styleOverrides: {},
    }),
}));
