import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { uploadRoomPhoto, getRoomPhotoUrl, deleteRoomPhoto as deleteRoomPhotoFile } from '../lib/roomPhotoStorage';
import { fetchRoomPhotos, insertRoomPhoto, deleteRoomPhotoRecord, type RoomPhoto } from '../lib/styleApi';

interface RoomPhotoPanelProps {
  projectId: string | null;
  floorPlanId: string | null;
  selectedPhotoUrl: string | null;
  onSelectPhoto: (url: string | null, photoId: string | null) => void;
  roomId?: string | null;
  rooms?: { id: string; name: string; color: string }[];
}

export function RoomPhotoPanel({ projectId, floorPlanId, selectedPhotoUrl, onSelectPhoto, roomId, rooms }: RoomPhotoPanelProps) {
  const { user, isGuest } = useAuth();
  const [photos, setPhotos] = useState<(RoomPhoto & { url?: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load photos for the project
  useEffect(() => {
    if (!projectId) { setPhotos([]); return; }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const records = await fetchRoomPhotos(projectId);
        if (cancelled) return;
        // Filter by room if specified
        const filtered = roomId ? records.filter(r => r.room_id === roomId) : records;
        // Resolve signed URLs
        const withUrls = await Promise.all(
          filtered.map(async (r) => {
            const url = await getRoomPhotoUrl(r.image_path);
            return { ...r, url: url ?? undefined };
          })
        );
        if (!cancelled) setPhotos(withUrls);
      } catch (err) {
        console.error('Failed to load room photos:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId, roomId]);

  const handleUpload = useCallback(async (files: FileList) => {
    if (!user || isGuest || !projectId) return;

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    setUploading(true);
    setErrorMsg(null);
    try {
      const fileArray = Array.from(files);
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        if (!file.type.startsWith('image/')) continue;
        if (file.size > MAX_FILE_SIZE) {
          setErrorMsg(`"${file.name}" exceeds 10 MB limit.`);
          continue;
        }

        const imagePath = await uploadRoomPhoto(file, user.id);
        const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        const record = await insertRoomPhoto({
          project_id: projectId,
          floor_plan_id: floorPlanId,
          room_id: roomId ?? null,
          image_path: imagePath,
          name,
          sort_order: photos.length + i,
        });
        const url = await getRoomPhotoUrl(imagePath);
        setPhotos(prev => [...prev, { ...record, url: url ?? undefined }]);
      }
    } catch (err) {
      console.error('Failed to upload room photo:', err);
      setErrorMsg('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [user, isGuest, projectId, floorPlanId, roomId, photos.length]);

  const handleDelete = useCallback(async (photo: RoomPhoto & { url?: string }) => {
    try {
      await deleteRoomPhotoFile(photo.image_path);
      await deleteRoomPhotoRecord(photo.id);
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
      if (selectedPhotoUrl === photo.url) {
        onSelectPhoto(null, null);
      }
    } catch (err) {
      console.error('Failed to delete room photo:', err);
      setErrorMsg('Failed to delete photo. Please try again.');
    }
  }, [selectedPhotoUrl, onSelectPhoto]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }, [handleUpload]);

  return (
    <div className="room-photo-panel">
      <div className="room-photo-header">
        <h3 className="room-photo-title">📷 Room Photos</h3>
        {user && !isGuest && projectId && (
          <button
            className="room-photo-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : '+ Add'}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => e.target.files && handleUpload(e.target.files)}
        />
      </div>

      {errorMsg && (
        <div className="room-photo-error" role="alert">
          {errorMsg}
          <button className="room-photo-error-dismiss" onClick={() => setErrorMsg(null)}>×</button>
        </div>
      )}

      {loading ? (
        <div className="room-photo-loading">Loading photos…</div>
      ) : photos.length === 0 ? (
        <div
          className="room-photo-empty"
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          <p>No room photos yet.</p>
          {user && !isGuest && projectId ? (
            <p className="room-photo-hint">Upload photos of your rooms to enable AI restyling.</p>
          ) : (
            <p className="room-photo-hint">Sign in and create a project to upload photos.</p>
          )}
        </div>
      ) : (
        <div
          className="room-photo-grid"
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          {photos.map(photo => (
            <div
              key={photo.id}
              className={`room-photo-thumb ${selectedPhotoUrl === photo.url ? 'selected' : ''}`}
              onClick={() => onSelectPhoto(photo.url ?? null, photo.id)}
            >
              {photo.url && (
                <img src={photo.url} alt={photo.name} loading="lazy" />
              )}
              <span className="room-photo-name">{photo.name}</span>
              {rooms && photo.room_id && (() => {
                const room = rooms.find(r => r.id === photo.room_id);
                return room ? (
                  <span className="room-photo-badge" style={{ backgroundColor: room.color }}>
                    {room.name}
                  </span>
                ) : null;
              })()}
              {user && !isGuest && (
                <button
                  className="room-photo-delete"
                  onClick={(e) => { e.stopPropagation(); handleDelete(photo); }}
                  title="Delete photo"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
