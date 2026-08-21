import { Directory, File, Paths } from 'expo-file-system';
import { makeId } from './noteUtils';

function attachmentsDir(): Directory {
  const dir = new Directory(Paths.document, 'attachments');
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

/**
 * Copy a picked/recorded file into the app's own attachments directory so it
 * survives the source (camera roll cache, recording cache) being cleaned up.
 * Returns the persistent file:// URI.
 */
export function importAttachment(sourceUri: string, extension: string): string {
  const dest = new File(attachmentsDir(), `${makeId()}.${extension}`);
  new File(sourceUri).copy(dest);
  return dest.uri;
}

export function deleteAttachmentQuiet(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Best effort — a missing file is fine.
  }
}

export function extensionFromUri(uri: string, fallback: string): string {
  const match = /\.([A-Za-z0-9]{1,5})(?:\?|#|$)/.exec(uri);
  return match ? match[1].toLowerCase() : fallback;
}
