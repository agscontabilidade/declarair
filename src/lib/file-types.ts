export type FileType = 'pdf' | 'image' | 'text' | 'office' | 'unsupported';

export function getFileExtension(name: string | null | undefined): string {
  if (!name) return '';
  const parts = name.split('.');
  if (parts.length < 2) return '';
  return parts[parts.length - 1].toLowerCase();
}

export function getFileType(name: string | null | undefined): FileType {
  const ext = getFileExtension(name);
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(ext)) return 'image';
  if (['txt', 'csv', 'json', 'xml', 'log', 'md'].includes(ext)) return 'text';
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'office';
  return 'unsupported';
}
