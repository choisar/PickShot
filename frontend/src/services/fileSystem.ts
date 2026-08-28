/**
 * Wrapper for the native File System Access API (Zero-Egress export).
 */
export const fileSystemService = {
  /**
   * Check if File System Access API is supported in the current browser.
   */
  isSupported(): boolean {
    return 'showDirectoryPicker' in window;
  },

  /**
   * Prompts user to select an export directory and saves the given files.
   */
  async saveFilesToDirectory(
    files: { file: File; targetName?: string }[],
    onProgress?: (savedCount: number, total: number) => void
  ): Promise<number> {
    if (!this.isSupported()) {
      throw new Error('File System Access API is not supported in this browser.');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dirHandle = await (window as any).showDirectoryPicker({
      mode: 'readwrite',
    });

    let saved = 0;
    for (const item of files) {
      const fileName = item.targetName || item.file.name;
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(item.file);
      await writable.close();
      saved++;
      onProgress?.(saved, files.length);
    }

    return saved;
  },
};
