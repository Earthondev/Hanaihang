import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import MallForm from '../components/forms/MallForm';
import { MallInput } from '../validation/mall.schema';
import { useToast } from '../components/feedback/useToast';
import { updateMall } from '../lib/firestore';
import { ArrowLeft } from 'lucide-react';

export default function MallEditPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [initial, setInitial] = useState<MallInput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    
    const loadMall = async () => {
      if (!slug) {
        setError('ไม่พบ slug ของห้าง');
        setLoading(false);
        return;
      }

      try {
        const mallDoc = await getDoc(doc(db, 'malls', slug));
        
        if (!mallDoc.exists()) {
          toast({
            title: "ไม่พบห้าง",
            description: "เอกสารนี้ถูกลบหรือไม่มีอยู่",
            variant: "error"
          });
          navigate("/admin?tab=malls");
          return;
        }

        const data = mallDoc.data();
        const normalized: MallInput = {
          displayName: data.displayName ?? "",
          slug: data.slug ?? slug,
          category: data.category ?? "shopping_mall",
          description: data.description ?? "",
          address: data.address ?? "",
          district: data.district ?? "",
          location: data.location ?? { lat: 0, lng: 0 },
          floors: data.floors,
          hours: normalizeHours(data.hours),
          holidayNotice: data.holidayNotice ?? "",
          phone: data.phone ?? "",
          website: data.website ?? "",
          facebook: data.facebook ?? "",
          line: data.line ?? "",
          status: data.status ?? "open",
          source: data.source ?? "manual",
        };

        if (alive) {
          setInitial(normalized);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading mall:', err);
        setError('ไม่สามารถโหลดข้อมูลห้างได้');
        setLoading(false);
      }
    };

    loadMall();
    
    return () => { 
      alive = false; 
    };
  }, [slug, navigate, toast]);

  const handleSubmit = async (values: MallInput) => {
    if (!slug) return;
    
    try {
      await updateMall(slug, values);
      toast({ 
        title: "อัปเดตสำเร็จ 🎉", 
        description: "ข้อมูลห้างถูกอัปเดตเรียบร้อยแล้ว",
        variant: "success" 
      });
      navigate("/admin?tab=malls");
    } catch (err) {
      console.error('Error updating mall:', err);
      toast({ 
        title: "เกิดข้อผิดพลาด", 
        description: "ไม่สามารถอัปเดตข้อมูลห้างได้",
        variant: "error" 
      });
    }
  };

  const handleCancel = () => {
    navigate("/admin?tab=malls");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลห้าง...</p>
        </div>
      </div>
    );
  }

  if (error || !initial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'ไม่พบข้อมูลห้าง'}</p>
          <button
            onClick={() => navigate("/admin?tab=malls")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            กลับไปรายการห้าง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCancel}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              aria-label="กลับไปรายการห้าง"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                แก้ไขห้าง: {initial.displayName}
              </h1>
              <p className="text-sm text-gray-600">
                แก้ไขข้อมูลห้างสรรพสินค้า
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-6xl mx-auto p-6">
        <MallForm 
          mode="edit" 
          defaultValues={initial} 
          onSuccess={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}

// Helper function to normalize hours data
function normalizeHours(hours: any): MallInput['hours'] {
  if (!hours) {
    return { 
      mode: "everyday", 
      open: "10:00", 
      close: "22:00" 
    };
  }

  // If already in correct format
  if (hours.mode === "everyday" || hours.mode === "byDay") {
    return hours;
  }

  // If it's a string like "10:00-22:00"
  if (typeof hours === "string" && hours.includes("-")) {
    const [open, close] = hours.split("-").map((s: string) => s.trim());
    return { mode: "everyday", open, close };
  }

  // If it's an object with open/close
  if (hours.open && hours.close) {
    return { mode: "everyday", open: hours.open, close: hours.close };
  }

  // Default fallback
  return { 
    mode: "everyday", 
    open: "10:00", 
    close: "22:00" 
  };
}
