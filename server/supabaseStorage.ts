import { supabaseAdmin } from './supabaseAdmin';

const BUCKET_NAME = 'documents';

/**
 * Initialise le bucket Supabase Storage s'il n'existe pas.
 */
export async function ensureBucketExists(): Promise<void> {
  if (!supabaseAdmin) {
    console.warn('[supabase-storage] Client Supabase non initialisé, storage désactivé');
    return;
  }

  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.some(b => b.name === BUCKET_NAME);
    if (!exists) {
      const { error } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
      });
      if (error) {
        console.error('[supabase-storage] Erreur création bucket:', error.message);
      } else {
        console.log(`[supabase-storage] Bucket "${BUCKET_NAME}" créé (public)`);
      }
    } else {
      // S'assurer que le bucket est bien public (corrige si créé private initialement)
      const { error } = await supabaseAdmin.storage.updateBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024,
      });
      if (error) {
        console.error('[supabase-storage] Erreur mise à jour bucket:', error.message);
      } else {
        console.log(`[supabase-storage] Bucket "${BUCKET_NAME}" vérifié (public)`);
      }
    }
  } catch (err) {
    console.error('[supabase-storage] Erreur vérification bucket:', err);
  }
}

/**
 * Upload un fichier vers Supabase Storage.
 * @returns L'URL publique du fichier, ou null en cas d'erreur.
 */
export async function uploadToSupabase(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string | null> {
  if (!supabaseAdmin) {
    console.error('[supabase-storage] Client Supabase non initialisé');
    return null;
  }

  const storagePath = `uploads/${filename}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(storagePath, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error('[supabase-storage] Erreur upload:', error.message);
    return null;
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  console.log(`[supabase-storage] Fichier uploadé: ${urlData.publicUrl}`);
  return urlData.publicUrl;
}

/**
 * Télécharge un fichier depuis Supabase Storage via le service role key (bypass les restrictions publiques).
 * @returns Le buffer et le content-type, ou null si le fichier n'existe pas.
 */
export async function downloadFromSupabase(fileUrl: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!supabaseAdmin) return null;

  try {
    const match = fileUrl.match(/\/storage\/v1\/object\/public\/documents\/(.+)$/);
    if (!match) return null;

    const storagePath = decodeURIComponent(match[1]);
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(storagePath);

    if (error || !data) {
      console.error('[supabase-storage] Erreur téléchargement:', error?.message);
      return null;
    }

    const arrayBuffer = await data.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      contentType: data.type || 'application/octet-stream',
    };
  } catch (err) {
    console.error('[supabase-storage] Erreur téléchargement:', err);
    return null;
  }
}

/**
 * Supprime un fichier de Supabase Storage.
 */
export async function deleteFromSupabase(fileUrl: string): Promise<boolean> {
  if (!supabaseAdmin) return false;

  try {
    // Extraire le chemin du fichier depuis l'URL publique
    // URL format: https://xxx.supabase.co/storage/v1/object/public/documents/uploads/filename
    const match = fileUrl.match(/\/storage\/v1\/object\/public\/documents\/(.+)$/);
    if (!match) return false;

    const storagePath = decodeURIComponent(match[1]);
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      console.error('[supabase-storage] Erreur suppression:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[supabase-storage] Erreur suppression:', err);
    return false;
  }
}
