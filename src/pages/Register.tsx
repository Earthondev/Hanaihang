import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, ArrowLeft, AlertCircle, UserPlus, Mail } from 'lucide-react';

import { useAuth } from '@/config/contexts/AuthContext';
import FadeIn from '@/components/ui/FadeIn';

const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('รหัสผ่านไม่ตรงกัน');
            setIsLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
            setIsLoading(false);
            return;
        }

        try {
            const { success, error } = await register(formData.email, formData.password, formData.displayName);

            if (success) {
                navigate('/', { replace: true });
            } else {
                setError(error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
            }
        } catch (err) {
            setError('เกิดข้อผิดพลาดที่ไม่คาดคิด');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-prompt">
            <div className="max-w-md w-full">
                {/* Back to Home */}
                <div className="mb-8">
                    <Link
                        to="/"
                        className="inline-flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">กลับไปหน้าหลัก</span>
                    </Link>
                </div>

                <FadeIn>
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10">
                        {/* Logo & Header */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <UserPlus className="w-8 h-8 text-primary-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 font-kanit mb-2">สมัครสมาชิกใหม่</h1>
                            <p className="text-gray-500 text-sm">สร้างบัญชีเพื่อเริ่มต้นใช้งาน HaaNaiHang</p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Display Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
                                    ชื่อผู้ใช้งาน
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.displayName}
                                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                        className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all placeholder-gray-400 text-gray-900"
                                        placeholder="เช่น สมชาย ใจดี"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
                                    อีเมล
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all placeholder-gray-400 text-gray-900"
                                        placeholder="name@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
                                    รหัสผ่าน
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="block w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all placeholder-gray-400 text-gray-900"
                                        placeholder="กำหนดรหัสผ่าน 6 ตัวขึ้นไป"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
                                    ยืนยันรหัสผ่าน
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="block w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all placeholder-gray-400 text-gray-900"
                                        placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-primary-200 hover:shadow-primary-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-2"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <span>สมัครสมาชิก</span>
                                )}
                            </button>
                        </form>

                        {/* Footer */}
                        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                            <p className="text-sm text-gray-500">
                                มีบัญชีอยู่แล้ว?{' '}
                                <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">
                                    เข้าสู่ระบบ
                                </Link>
                            </p>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
};

export default Register;
