import React from 'react';
import { Image, FileImage, FileArchive, File, FileText, FileSpreadsheet, FileVideo, FileAudio, FileBadge, FileCode, FileJson } from 'lucide-react';

/**
 * Formats file size into a human-readable form
 * 
 * @param bytes File size in bytes
 * @param decimals Number of decimals to display
 * @returns Formatted file size string (e.g., '1.5 MB', '400 KB')
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Get appropriate icon component based on file type
 * 
 * @param fileType MIME type of the file
 * @param size Icon size in pixels (default: 24)
 * @returns React Icon component
 */
export function getFileTypeIcon(fileType: string, size: number = 24): React.ReactNode {
  const props = { width: size, height: size };
  
  if (!fileType) {
    return <File {...props} />;
  }
  
  // Handle image files
  if (fileType.startsWith('image/')) {
    return <Image {...props} />;
  }
  
  // Handle video files
  if (fileType.startsWith('video/')) {
    return <FileVideo {...props} />;
  }
  
  // Handle audio files
  if (fileType.startsWith('audio/')) {
    return <FileAudio {...props} />;
  }
  
  // Handle archive files
  if (['application/zip', 'application/x-rar-compressed', 'application/x-tar', 'application/gzip'].includes(fileType)) {
    return <FileArchive {...props} />;
  }
  
  // Handle text files
  if (fileType === 'text/plain' || fileType === 'text/markdown') {
    return <FileText {...props} />;
  }
  
  // Handle spreadsheet files
  if (['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
       'text/csv', 'application/vnd.oasis.opendocument.spreadsheet'].includes(fileType)) {
    return <FileSpreadsheet {...props} />;
  }
  
  // Handle code files
  if (['text/html', 'text/css', 'application/javascript', 'application/typescript'].includes(fileType)) {
    return <FileCode {...props} />;
  }
  
  // Handle JSON files
  if (fileType === 'application/json') {
    return <FileJson {...props} />;
  }
  
  // Handle PDF files
  if (fileType === 'application/pdf') {
    return <FileBadge {...props} />;
  }
  
  // Default icon for other types
  return <File {...props} />;
}

/**
 * Generate a placeholder SVG for failed images that adapts to dark/light mode
 */
export function generatePlaceholderSVG(width: number = 300, height: number = 200): string {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect width='${width}' height='${height}' fill='%23f0f0f0' /%3E%3Cpath d='M${width/2-40},${height/2-15} h80 v30 h-80 z' fill='%23e0e0e0' /%3E%3Cpath d='M${width/2-30},${height/2-5} h60 v10 h-60 z' fill='%23d0d0d0' /%3E%3C/svg%3E`;
}