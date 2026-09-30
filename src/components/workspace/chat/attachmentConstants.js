
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
];


export const MAX_FILE_SIZE_MB = 25;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function validateAttachment(file) {
  if (!file) return "No file selected";
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `"${file.name}" isn't a supported file type. Try an image, PDF, Office document, text file, or zip.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `"${file.name}" is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`;
  }
  return null;
}
