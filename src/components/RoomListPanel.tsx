import { useCallback } from 'react';
import { useAppState } from '../hooks/useAppState';

interface RoomListPanelProps {
  floorPlanId: string | null;
}

export function RoomListPanel({ floorPlanId }: RoomListPanelProps) {
  const { state, dispatch } = useAppState();

  const currentRooms = state.rooms.filter(r => r.floorPlanId === floorPlanId);

  const handleAddRoom = useCallback(() => {
    dispatch({ type: 'SET_TOOL_MODE', payload: 'draw-room' });
  }, [dispatch]);

  const handleDeleteRoom = useCallback((roomId: string) => {
    dispatch({ type: 'REMOVE_ROOM', payload: roomId });
  }, [dispatch]);

  const handleSelectRoom = useCallback((roomId: string) => {
    const newId = state.selectedRoomId === roomId ? null : roomId;
    dispatch({ type: 'SELECT_ROOM', payload: newId });
  }, [state.selectedRoomId, dispatch]);

  const isDrawingRoom = state.toolMode === 'draw-room';

  return (
    <div className="room-list-section">
      <div className="room-list-header">
        <h3 className="room-list-title">🏠 Rooms</h3>
        {floorPlanId && (
          <button className="room-add-btn" onClick={handleAddRoom} disabled={isDrawingRoom}>
            {isDrawingRoom ? 'Drawing…' : '+ Add Room'}
          </button>
        )}
      </div>

      {isDrawingRoom && (
        <div className="room-drawing-hint">
          Click on the floor plan to draw a room outline. Double-click to finish.
        </div>
      )}

      {currentRooms.length === 0 && !isDrawingRoom ? (
        <div className="room-list-empty">
          No rooms defined yet. Draw room outlines on the floor plan to organize photos by room.
        </div>
      ) : (
        <div className="room-list-items">
          {currentRooms.map(room => (
            <div
              key={room.id}
              className={`room-list-item ${state.selectedRoomId === room.id ? 'selected' : ''}`}
              onClick={() => handleSelectRoom(room.id)}
            >
              <span className="room-list-swatch" style={{ backgroundColor: room.color }} />
              <span className="room-list-name">{room.name}</span>
              <button
                className="room-list-delete"
                onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id); }}
                title="Delete room"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
