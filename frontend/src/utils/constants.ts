export const APP_CONFIG = {
  // Max payload size per group chunk (10MB)
  MAX_CHUNK_PAYLOAD_BYTES: 10 * 1024 * 1024,
  
  // Thumbnail constraints
  THUMBNAIL_MAX_DIMENSION: 1080,
  THUMBNAIL_QUALITY: 0.85,
  
  // Batch processing window size
  CHUNK_BATCH_SIZE: 50,
  
  // Clustering threshold in seconds (photos taken within 8 seconds belong to same burst/group)
  BURST_TIME_THRESHOLD_SECONDS: 8,

  // Visual similarity threshold: Hamming distance <= 12 (~81% similarity)
  PHASH_HAMMING_THRESHOLD: 12,

  // IndexedDB database name and version
  DB_NAME: 'PickShotDB',
  DB_VERSION: 1,
  STORE_GROUPS: 'groups',
  STORE_CHECKPOINT: 'checkpoint',
};
