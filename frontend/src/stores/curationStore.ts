import { create } from 'zustand';
import { ImageGroup, ImageScore, ImageMetadata } from '../types/image';
import { AppStep, ProcessingProgress, ZoomCoordinates } from '../types/curation';

interface CurationState {
  // Navigation & Flow
  currentStep: AppStep;
  setStep: (step: AppStep) => void;

  // Processing & Progress
  progress: ProcessingProgress;
  setProgress: (progress: Partial<ProcessingProgress>) => void;

  // Images & Groups
  rawFiles: File[];
  setRawFiles: (files: File[]) => void;
  groups: ImageGroup[];
  setGroups: (groups: ImageGroup[]) => void;
  updateGroup: (groupId: string, updates: Partial<ImageGroup>) => void;

  // Selected for comparison
  activeGroupId: string | null;
  setActiveGroupId: (groupId: string | null) => void;

  // Best Cut Selection (Multi-select)
  toggleBestImage: (groupId: string, imageId: string) => void;
  selectBestImage: (groupId: string, imageId: string) => void;
  confirmGroup: (groupId: string) => void;
  updateImageScore: (groupId: string, imageId: string, score: ImageScore) => void;

  // Group Management & Drag-Drop
  moveImageToGroup: (sourceGroupId: string, targetGroupId: string, imageId: string) => void;
  mergeGroups: (firstGroupId: string, secondGroupId: string) => void;
  createGroupBetween: (insertIndex: number) => void;
  deleteGroup: (groupId: string) => void;

  // Attention Tracking (Zoom coordinate log)
  zoomLogs: Record<string, ZoomCoordinates[]>;
  logZoom: (imageId: string, coords: ZoomCoordinates) => void;

  // Reset
  resetState: () => void;
}

const initialProgress: ProcessingProgress = {
  stage: 'reading',
  totalFiles: 0,
  processedFiles: 0,
  totalGroups: 0,
  evaluatedGroups: 0,
  percentage: 0,
  statusMessage: '준비 중...',
};

export const useCurationStore = create<CurationState>((set) => ({
  currentStep: 'upload',
  setStep: (step) => set({ currentStep: step }),

  progress: initialProgress,
  setProgress: (progressUpdates) =>
    set((state) => ({
      progress: { ...state.progress, ...progressUpdates },
    })),

  rawFiles: [],
  setRawFiles: (files) => set({ rawFiles: files }),

  groups: [],
  setGroups: (groups) => set({ groups }),
  updateGroup: (groupId, updates) =>
    set((state) => ({
      groups: state.groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g)),
    })),

  activeGroupId: null,
  setActiveGroupId: (activeGroupId) => set({ activeGroupId }),

  // Multi-select best image toggle
  toggleBestImage: (groupId, imageId) =>
    set((state) => ({
      groups: state.groups.map((g) => {
        if (g.id !== groupId) return g;
        const currentBestIds = g.bestImageIds || (g.bestImageId ? [g.bestImageId] : []);
        const exists = currentBestIds.includes(imageId);
        const newBestIds = exists
          ? currentBestIds.filter((id) => id !== imageId)
          : [...currentBestIds, imageId];

        return {
          ...g,
          bestImageIds: newBestIds,
          bestImageId: newBestIds[0] || undefined,
          isConfirmed: newBestIds.length > 0,
        };
      }),
    })),

  selectBestImage: (groupId, imageId) =>
    set((state) => ({
      groups: state.groups.map((g) => {
        if (g.id !== groupId) return g;
        const currentBestIds = g.bestImageIds || (g.bestImageId ? [g.bestImageId] : []);
        const exists = currentBestIds.includes(imageId);
        const newBestIds = exists
          ? currentBestIds.filter((id) => id !== imageId)
          : [...currentBestIds, imageId];

        return {
          ...g,
          bestImageIds: newBestIds,
          bestImageId: newBestIds[0] || undefined,
          isConfirmed: true,
        };
      }),
    })),

  confirmGroup: (groupId) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, isConfirmed: true } : g
      ),
    })),

  updateImageScore: (groupId, imageId, score) =>
    set((state) => ({
      groups: state.groups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          scores: {
            ...g.scores,
            [imageId]: score,
          },
        };
      }),
    })),

  // Move an image from source group to target group
  moveImageToGroup: (sourceGroupId, targetGroupId, imageId) =>
    set((state) => {
      if (sourceGroupId === targetGroupId) return state;

      const sourceGroup = state.groups.find((g) => g.id === sourceGroupId);
      if (!sourceGroup) return state;

      const movingImage = sourceGroup.images.find((img) => img.id === imageId);
      if (!movingImage) return state;

      return {
        groups: state.groups.map((g) => {
          if (g.id === sourceGroupId) {
            const remainingImages = g.images.filter((img) => img.id !== imageId);
            const remainingBestIds = (g.bestImageIds || (g.bestImageId ? [g.bestImageId] : [])).filter(
              (id) => id !== imageId
            );
            return {
              ...g,
              images: remainingImages,
              bestImageIds: remainingBestIds,
              bestImageId: remainingBestIds[0] || (remainingImages[0]?.id ?? undefined),
            };
          }
          if (g.id === targetGroupId) {
            return {
              ...g,
              images: [...g.images, movingImage],
            };
          }
          return g;
        }),
      };
    }),

  // Merge first group and second group into first group
  mergeGroups: (firstGroupId, secondGroupId) =>
    set((state) => {
      const firstIndex = state.groups.findIndex((g) => g.id === firstGroupId);
      const secondIndex = state.groups.findIndex((g) => g.id === secondGroupId);
      if (firstIndex === -1 || secondIndex === -1) return state;

      const firstGroup = state.groups[firstIndex];
      const secondGroup = state.groups[secondIndex];

      const mergedImages: ImageMetadata[] = [...firstGroup.images, ...secondGroup.images];
      const firstBest = firstGroup.bestImageIds || (firstGroup.bestImageId ? [firstGroup.bestImageId] : []);
      const secondBest = secondGroup.bestImageIds || (secondGroup.bestImageId ? [secondGroup.bestImageId] : []);
      const mergedBestIds = Array.from(new Set([...firstBest, ...secondBest]));

      const mergedGroup: ImageGroup = {
        ...firstGroup,
        images: mergedImages,
        bestImageIds: mergedBestIds,
        bestImageId: mergedBestIds[0] || mergedImages[0]?.id,
        scores: {
          ...(firstGroup.scores || {}),
          ...(secondGroup.scores || {}),
        },
      };

      const newGroups = [...state.groups];
      newGroups.splice(firstIndex, 1, mergedGroup);
      newGroups.splice(secondIndex > firstIndex ? secondIndex : secondIndex, 1);

      // Re-number group names nicely
      return {
        groups: newGroups.map((g, idx) => ({
          ...g,
          name: `연사 그룹 #${idx + 1}`,
        })),
      };
    }),

  // Create a new empty group between existing groups
  createGroupBetween: (insertIndex) =>
    set((state) => {
      const newGroup: ImageGroup = {
        id: `grp_custom_${Date.now()}`,
        name: `새 연사 그룹`,
        timestampRange: { start: null, end: null },
        images: [],
        bestImageIds: [],
      };

      const newGroups = [...state.groups];
      newGroups.splice(insertIndex, 0, newGroup);

      return {
        groups: newGroups.map((g, idx) => ({
          ...g,
          name: `연사 그룹 #${idx + 1}`,
        })),
      };
    }),

  // Delete group
  deleteGroup: (groupId) =>
    set((state) => ({
      groups: state.groups
        .filter((g) => g.id !== groupId)
        .map((g, idx) => ({
          ...g,
          name: `연사 그룹 #${idx + 1}`,
        })),
    })),

  zoomLogs: {},
  logZoom: (imageId, coords) =>
    set((state) => ({
      zoomLogs: {
        ...state.zoomLogs,
        [imageId]: [...(state.zoomLogs[imageId] || []), coords],
      },
    })),

  resetState: () =>
    set({
      currentStep: 'upload',
      progress: initialProgress,
      rawFiles: [],
      groups: [],
      activeGroupId: null,
      zoomLogs: {},
    }),
}));
