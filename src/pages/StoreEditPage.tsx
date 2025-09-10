import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Divider,
  Paper,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack,
  Store as StoreIcon,
  LocationOn,
  Phone,
  Schedule,
  Category,
  Layers,
  Save,
  Cancel,
  Edit,
  Info,
} from '@mui/icons-material';

import { useToast } from '../ui/feedback/Toast';
import { AnimatedSuccessModal } from '../components/ui/feedback/SuccessModal';
import { getMall, listFloors, listMalls } from '../services/firebase/firestore';
import { getStore, updateStore } from '../services/firebase/stores-unified';
import { Mall, Floor, Store, StoreCategory, StoreStatus, STORE_CATEGORIES, STORE_STATUS } from '../types/mall-system';

// Helper function to map legacy categories to new categories
const mapLegacyCategory = (legacyCategory: string): StoreCategory => {
  const categoryMap: Record<string, StoreCategory> = {
    'Fashion – Apparel': 'Fashion',
    'Fashion & Apparel': 'Fashion',
    'Fashion-Apparel': 'Fashion',
    'Beauty & Cosmetics': 'Beauty',
    'Electronics & Technology': 'Electronics',
    'Food & Dining': 'Food & Beverage',
    'Sports & Fitness': 'Sports',
    'Books & Media': 'Books',
    'Home & Living': 'Home & Garden',
    'Health & Wellness': 'Health & Pharmacy',
    'Entertainment & Leisure': 'Entertainment',
    'Services & Professional': 'Services'
  };
  
  return categoryMap[legacyCategory] || 'Fashion'; // Default to Fashion if not found
};

export default function StoreEditPage() {
  const { mallId, storeId } = useParams<{ mallId: string; storeId: string }>();
  const navigate = useNavigate();
  const { push: toast } = useToast();
  
  const [store, setStore] = useState<Store | null>(null);
  const [mall, setMall] = useState<Mall | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [malls, setMalls] = useState<Mall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mallChanged, setMallChanged] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    nameLower: '',
    brandSlug: '',
    category: '' as StoreCategory | '',
    floorId: '',
    unit: '',
    phone: '',
    hours: '',
    status: 'Active' as StoreStatus,
    mallId: '',
    mallSlug: '',
    location: {
      lat: 0,
      lng: 0,
      geohash: ''
    }
  });

  console.log('🔍 StoreEditPage mounted with mallId:', mallId, 'storeId:', storeId);

  useEffect(() => {
    const loadStoreData = async () => {
      if (!mallId || !storeId) {
        setError('ไม่พบข้อมูลร้านค้า');
        setLoading(false);
        return;
      }
      
      try {
        console.log('🔄 Loading store data for mallId:', mallId, 'storeId:', storeId);
        
        const [storeData, mallData, floorsData, mallsData] = await Promise.all([
          getStore(mallId, storeId),
          getMall(mallId),
          listFloors(mallId),
          listMalls()
        ]);
        
        console.log('✅ Store data loaded:', storeData);
        console.log('✅ Mall data loaded:', mallData);
        console.log('✅ Floors data loaded:', floorsData);
        
        if (!storeData) {
          setError('ไม่พบข้อมูลร้านค้า');
          setLoading(false);
          return;
        }
        
        // ตรวจสอบ mallId mismatch
        if (storeData.mallId && storeData.mallId !== mallId) {
          console.warn('⚠️ URL mallId mismatch with store.mallId:', { 
            urlMallId: mallId, 
            storeMallId: storeData.mallId 
          });
          // ถ้าต้องการ redirect ไปห้างที่ถูกต้อง:
          // navigate(`/admin/stores/${storeData.mallId}/${storeId}/edit`);
        }
        
        setStore(storeData);
        setMall(mallData);
        setFloors(floorsData);
        setMalls(mallsData);
        
        // Populate form data
        setFormData({
          name: storeData.name || '',
          nameLower: storeData.nameLower || '',
          brandSlug: storeData.brandSlug || '',
          category: mapLegacyCategory(storeData.category || ''),
          floorId: storeData.floorId || '',
          unit: storeData.unit || '',
          phone: storeData.phone || '',
          hours: storeData.hours || '',
          status: storeData.status || 'Active',
          mallId: storeData.mallId || mallId,
          mallSlug: storeData.mallSlug || mallData?.name || '',
          location: {
            lat: storeData.location?.lat || 0,
            lng: storeData.location?.lng || 0,
            geohash: storeData.location?.geohash || ''
          }
        });
        
        setError(null);
      } catch (error) {
        console.error('❌ Error loading store:', error);
        const errorMessage = error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลร้านค้าได้';
        setError(errorMessage);
        toast(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    };

    loadStoreData();
  }, [mallId, storeId, toast]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Auto-update nameLower when name changes
      ...(field === 'name' && { nameLower: typeof value === 'string' ? value.toLowerCase() : prev.nameLower })
    }));
  };

  const handleLocationChange = (field: 'lat' | 'lng' | 'geohash', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));
  };

  const handleMallChange = async (newMallId: string) => {
    if (newMallId === formData.mallId) return;
    
    try {
      // โหลดข้อมูลห้างใหม่และ floors
      const [newMallData, newFloorsData] = await Promise.all([
        getMall(newMallId),
        listFloors(newMallId)
      ]);
      
      if (newMallData) {
        setMall(newMallData);
        setFloors(newFloorsData);
        setMallChanged(true);
        
        // อัปเดต form data
        setFormData(prev => ({
          ...prev,
          mallId: newMallId,
          mallSlug: newMallData.name || '',
          floorId: '', // รีเซ็ต floor เมื่อเปลี่ยนห้าง
        }));
        
        toast(`เปลี่ยนห้างเป็น "${newMallData.displayName}" แล้ว กรุณาเลือกชั้นใหม่`, 'info');
      }
    } catch (error) {
      console.error('❌ Error loading new mall data:', error);
      toast('ไม่สามารถโหลดข้อมูลห้างใหม่ได้', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mallId || !storeId) {
      toast('ไม่พบข้อมูลร้านค้า', 'error');
      return;
    }

    setSaving(true);

    try {
      console.log('🔄 Updating store with data:', formData);
      
      // Prepare update data
      const updateData = {
        name: formData.name,
        nameLower: formData.nameLower,
        brandSlug: formData.brandSlug,
        category: formData.category as StoreCategory,
        floorId: formData.floorId,
        unit: formData.unit,
        phone: formData.phone,
        hours: formData.hours,
        status: formData.status as StoreStatus,
        mallId: formData.mallId,
        mallSlug: formData.mallSlug,
        location: formData.location,
        updatedAt: Timestamp.now()
      };

      // Update store in Firebase
      await updateStore(mallId, storeId, updateData);
      
      console.log('✅ Store updated successfully');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('❌ Error updating store:', error);
      toast('เกิดข้อผิดพลาดในการอัปเดตร้านค้า', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSuccessConfirm = () => {
    navigate('/admin?tab=stores');
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'grey.50',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} sx={{ color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            กำลังโหลดข้อมูลร้านค้า...
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Mall ID: {mallId} • Store ID: {storeId}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'grey.50',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              เกิดข้อผิดพลาด
            </Typography>
            <Typography variant="body2">
              {error}
            </Typography>
          </Alert>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/admin/stores')}
            size="large"
          >
            กลับไปหน้าร้านค้า
          </Button>
        </Box>
      </Box>
    );
  }

  if (!store || !mall) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'grey.50',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
          <StoreIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h4" gutterBottom color="text.primary">
            ไม่พบข้อมูลร้านค้า
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            ร้านค้าที่คุณกำลังค้นหาอาจถูกลบหรือไม่เคยมีอยู่
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/admin/stores')}
            size="large"
          >
            กลับไปหน้าร้านค้า
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumb Navigation */}
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/admin?tab=stores')}
              sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
            >
              <ArrowBack sx={{ mr: 0.5, fontSize: 16 }} />
              หน้าร้านค้า
            </Link>
            <Typography color="text.primary">แก้ไขร้านค้า</Typography>
          </Breadcrumbs>
        </Box>

        {/* Store Info Header */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  แก้ไขร้านค้า
                </Typography>
                <Typography variant="h5" color="primary.main" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <StoreIcon sx={{ mr: 1 }} />
                  {store.name}
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      ห้างสรรพสินค้า
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {mall.displayName}
                    </Typography>
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      หมวดหมู่
                    </Typography>
                    <Chip 
                      label={store.category} 
                      color="primary" 
                      variant="outlined" 
                      icon={<Category />}
                      size="small"
                    />
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      สถานะ
                    </Typography>
                    <Chip 
                      label={store.status} 
                      color={store.status === 'Active' ? 'success' : 'default'}
                      variant="filled"
                      size="small"
                    />
                  </Paper>
                </Box>
              </Box>
              
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  สร้างเมื่อ
                </Typography>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 2 }}>
                  {store.createdAt ? (store.createdAt instanceof Date ? store.createdAt.toLocaleDateString('th-TH') : new Date(store.createdAt.toDate()).toLocaleDateString('th-TH')) : 'ไม่ระบุ'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  อัปเดตล่าสุด
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {store.updatedAt ? (store.updatedAt instanceof Date ? store.updatedAt.toLocaleDateString('th-TH') : new Date(store.updatedAt.toDate()).toLocaleDateString('th-TH')) : 'ไม่ระบุ'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Store Edit Form */}
        <Card>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Edit sx={{ mr: 1 }} />
              ข้อมูลร้านค้า
            </Typography>
            
            <Box component="form" onSubmit={handleSubmit}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 3 }}>
                {/* Store Name */}
                <TextField
                  fullWidth
                  label="ชื่อร้านค้า"
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  required
                  variant="outlined"
                  InputProps={{
                    startAdornment: <StoreIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />

                {/* Brand Slug */}
                <TextField
                  fullWidth
                  label="Brand Slug"
                  value={formData.brandSlug}
                  onChange={e => handleInputChange('brandSlug', e.target.value)}
                  placeholder="เช่น uniqlo, zara, starbucks"
                  variant="outlined"
                  helperText="ใช้สำหรับ URL และการค้นหา"
                />

                {/* Category */}
                <FormControl fullWidth required>
                  <InputLabel>หมวดหมู่</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={e => handleInputChange('category', e.target.value)}
                    label="หมวดหมู่"
                    startAdornment={<Category sx={{ mr: 1, color: 'action.active' }} />}
                  >
                    {STORE_CATEGORIES.map(category => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Floor */}
                <FormControl fullWidth required>
                  <InputLabel>ชั้น</InputLabel>
                  <Select
                    value={formData.floorId}
                    onChange={e => handleInputChange('floorId', e.target.value)}
                    label="ชั้น"
                    startAdornment={<Layers sx={{ mr: 1, color: 'action.active' }} />}
                  >
                    {floors.map(floor => (
                      <MenuItem key={floor.id} value={floor.id}>
                        {floor.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Unit */}
                <TextField
                  fullWidth
                  label="ยูนิต"
                  value={formData.unit}
                  onChange={e => handleInputChange('unit', e.target.value)}
                  placeholder="เช่น A101, B205"
                  variant="outlined"
                  helperText="หมายเลขยูนิตหรือตำแหน่งในห้าง"
                />

                {/* Phone */}
                <TextField
                  fullWidth
                  label="เบอร์โทรศัพท์"
                  type="tel"
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  placeholder="เช่น 02-123-4567"
                  variant="outlined"
                  InputProps={{
                    startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />

                {/* Hours */}
                <TextField
                  fullWidth
                  label="เวลาเปิด-ปิด"
                  value={formData.hours}
                  onChange={e => handleInputChange('hours', e.target.value)}
                  placeholder="เช่น 10:00-22:00"
                  variant="outlined"
                  InputProps={{
                    startAdornment: <Schedule sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />

                {/* Status */}
                <FormControl fullWidth required>
                  <InputLabel>สถานะ</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={e => handleInputChange('status', e.target.value)}
                    label="สถานะ"
                  >
                    {STORE_STATUS.map(status => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Location Section */}
              <Divider sx={{ my: 4 }} />
              <Typography variant="h6" component="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <LocationOn sx={{ mr: 1 }} />
                ข้อมูลตำแหน่ง
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 3 }}>
                <TextField
                  fullWidth
                  label="ละติจูด"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={formData.location.lat}
                  onChange={e => handleLocationChange('lat', parseFloat(e.target.value) || 0)}
                  placeholder="13.7563"
                  variant="outlined"
                  helperText="ค่าละติจูดของตำแหน่งร้านค้า"
                />
                <TextField
                  fullWidth
                  label="ลองจิจูด"
                  type="number"
                  inputProps={{ step: "any" }}
                  value={formData.location.lng}
                  onChange={e => handleLocationChange('lng', parseFloat(e.target.value) || 0)}
                  placeholder="100.5018"
                  variant="outlined"
                  helperText="ค่าลองจิจูดของตำแหน่งร้านค้า"
                />
                <TextField
                  fullWidth
                  label="Geohash"
                  value={formData.location.geohash}
                  onChange={e => handleLocationChange('geohash', e.target.value)}
                  placeholder="เช่น w4r8k2"
                  variant="outlined"
                  helperText="ใช้สำหรับการค้นหาตำแหน่งแบบเร็ว"
                />
              </Box>

              {/* Mall Reference Section */}
              <Divider sx={{ my: 4 }} />
              <Typography variant="h6" component="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Info sx={{ mr: 1 }} />
                ข้อมูลอ้างอิงห้าง
              </Typography>
              
              {mallChanged && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    ⚠️ คุณได้เปลี่ยนห้างของร้านค้าแล้ว กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนบันทึก
                  </Typography>
                </Alert>
              )}
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 3 }}>
                <FormControl fullWidth required>
                  <InputLabel>ห้างสรรพสินค้า</InputLabel>
                  <Select
                    value={formData.mallId}
                    onChange={e => handleMallChange(e.target.value)}
                    label="ห้างสรรพสินค้า"
                    startAdornment={<StoreIcon sx={{ mr: 1, color: 'action.active' }} />}
                  >
                    {malls.map(mall => (
                      <MenuItem key={mall.id} value={mall.id!}>
                        {mall.displayName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField
                  fullWidth
                  label="Mall Slug"
                  value={formData.mallSlug}
                  onChange={e => handleInputChange('mallSlug', e.target.value)}
                  variant="outlined"
                  helperText="ชื่อย่อของห้างสำหรับ URL"
                />
              </Box>

              {/* Form Actions */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                <Button
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={() => navigate('/admin?tab=stores')}
                  size="large"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                  disabled={saving}
                  size="large"
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>

      {/* Success Modal */}
      <AnimatedSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="บันทึกสำเร็จ! 🎉"
        message={`ข้อมูลร้านค้า "${store.name}" ได้รับการอัปเดตเรียบร้อยแล้ว`}
        onConfirm={handleSuccessConfirm}
        confirmText="กลับไปหน้าร้านค้า"
      />
    </Box>
  );
}
