import ExifReader from 'exifreader';

/**
 * Extracts DateTimeOriginal and basic metadata from an image file.
 */
export async function extractExifDate(file: File): Promise<Date | null> {
  try {
    const tags = await ExifReader.load(file, { expanded: true });
    const dateTime = tags.exif?.DateTimeOriginal?.description;
    
    if (dateTime) {
      // EXIF date format: "YYYY:MM:DD HH:MM:SS"
      const [datePart, timePart] = dateTime.split(' ');
      if (datePart && timePart) {
        const [year, month, day] = datePart.split(':').map(Number);
        const [hour, minute, second] = timePart.split(':').map(Number);
        return new Date(year, month - 1, day, hour, minute, second);
      }
    }
    
    // Fallback to file's last modified date
    return new Date(file.lastModified);
  } catch (err) {
    console.warn(`Failed to read EXIF for ${file.name}, using lastModified:`, err);
    return new Date(file.lastModified);
  }
}
