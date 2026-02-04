import React, { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Floor } from '../../types/mall-system';
import { createFloor, deleteFloor, updateFloorOrder, listFloors } from '../../services/firebase/firestore';
import { useToast } from '../../ui/feedback/Toast';

interface FloorManagerProps {
  mallId: string;
  floors: Floor[];
  onFloorsChange: (floors: Floor[]) => void;
}

interface SortableFloorItemProps {
  floor: Floor;
  index: number;
  onDelete: (floorId: string) => void;
}

function SortableFloorItem({ floor, index, onDelete }: SortableFloorItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: floor.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg transition-all duration-200 ${
        isDragging 
          ? 'shadow-lg border-green-400 bg-green-50' 
          : 'hover:border-green-300 hover:shadow-md'
      }`}
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="text-gray-400 cursor-grab hover:text-gray-600 active:cursor-grabbing transition-colors"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      
      {/* Floor Info */}
      <div className="flex-1 flex items-center gap-3">
        <span className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-medium">
          {index + 1}
        </span>
        <div>
          <span className="font-medium text-gray-900">
            ชั้น {floor.label}
          </span>
          <div className="text-xs text-gray-500">
            ลำดับที่ {index + 1}
          </div>
        </div>
      </div>
      
      {/* Delete Button */}
      <button
        onClick={() => onDelete(floor.id!)}
        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
        title="ลบชั้น"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function FloorManager({ mallId, floors, onFloorsChange }: FloorManagerProps) {
  const { push: toast } = useToast();
  const [newFloorLabel, setNewFloorLabel] = useState('');
  const [isAddingFloor, setIsAddingFloor] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddFloor = async () => {
    if (!newFloorLabel.trim() || isAddingFloor) return;
    
    // ตรวจสอบว่าชั้นซ้ำหรือไม่
    const existingFloor = floors.find(f => f.label.toLowerCase() === newFloorLabel.trim().toLowerCase());
    if (existingFloor) {
      toast('ชั้นนี้มีอยู่แล้ว', 'error');
      return;
    }
    
    setIsAddingFloor(true);
    
    try {
      // เพิ่มชั้นใหม่ที่ท้ายสุด
      const newOrder = Math.max(...floors.map(f => f.order || 0), -1) + 1;
      
      await createFloor(mallId, { label: newFloorLabel.trim(), order: newOrder });
      
      // Reload floors
      const updatedFloors = await listFloors(mallId);
      onFloorsChange(updatedFloors);
      setNewFloorLabel('');
      toast('เพิ่มชั้นสำเร็จ ✅', 'success');
    } catch (error) {
      console.error('Error adding floor:', error);
      toast('ไม่สามารถเพิ่มชั้นได้', 'error');
    } finally {
      setIsAddingFloor(false);
    }
  };

  const handleDeleteFloor = async (floorId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบชั้นนี้?')) return;
    
    try {
      await deleteFloor(mallId, floorId);
      
      // Reload floors
      const updatedFloors = await listFloors(mallId);
      onFloorsChange(updatedFloors);
      toast('ลบชั้นสำเร็จ ✅', 'success');
    } catch (error) {
      console.error('Error deleting floor:', error);
      toast('ไม่สามารถลบชั้นได้', 'error');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      try {
        const sortedFloors = [...floors].sort((a, b) => (a.order || 0) - (b.order || 0));
        const oldIndex = sortedFloors.findIndex(f => f.id === active.id);
        const newIndex = sortedFloors.findIndex(f => f.id === over?.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          // Update orders for all affected floors
          const reorderedFloors = arrayMove(sortedFloors, oldIndex, newIndex);
          
          // Update orders in database
          const updatePromises = reorderedFloors.map((floor, index) => 
            updateFloorOrder(mallId, floor.id!, index)
          );
          
          await Promise.all(updatePromises);
          
          // Reload floors
          const updatedFloors = await listFloors(mallId);
          onFloorsChange(updatedFloors);
          toast('เปลี่ยนลำดับชั้นสำเร็จ ✅', 'success');
        }
      } catch (error) {
        console.error('Error reordering floors:', error);
        toast('ไม่สามารถเปลี่ยนลำดับชั้นได้', 'error');
      }
    }
  };

  const sortedFloors = [...floors].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-6">
      {/* Add New Floor */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">เพิ่มชั้นใหม่</h3>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newFloorLabel}
            onChange={(e) => setNewFloorLabel(e.target.value)}
            placeholder="เช่น B1, 4, 5, 6, M"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            onKeyPress={(e) => e.key === 'Enter' && handleAddFloor()}
          />
          <button
            onClick={handleAddFloor}
            disabled={!newFloorLabel.trim() || isAddingFloor}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAddingFloor ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Plus className="w-4 h-4" />
            )}
            เพิ่ม
          </button>
        </div>
      </div>

      {/* Floors List */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          ชั้นที่มีอยู่ ({floors.length} ชั้น)
        </h3>
        
        {floors.length === 0 ? (
          <p className="text-gray-500 text-sm">ยังไม่มีชั้นในห้างนี้</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedFloors.map(f => f.id!)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {sortedFloors.map((floor, index) => (
                  <SortableFloorItem
                    key={floor.id}
                    floor={floor}
                    index={index}
                    onDelete={handleDeleteFloor}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
