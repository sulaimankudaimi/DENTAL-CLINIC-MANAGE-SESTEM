import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
      <div className="w-20 h-20 rounded-full bg-brand-navy/10 text-brand-navy flex items-center justify-center mb-6">
        <FileQuestion className="w-10 h-10" />
      </div>

      <h1 className="text-4xl font-black text-text-primary mb-2">404</h1>
      <h2 className="text-xl font-bold text-text-primary mb-3">الصفحة غير موجودة</h2>
      <p className="text-sm text-text-secondary max-w-md mb-6 leading-relaxed">
        عذراً، الصفحة التي تحاول الوصول إليها غير متوفرة أو ربما تم تغيير مسارها في نظام عيادتي.
      </p>

      <Button
        variant="primary"
        size="md"
        icon={<Home className="w-4 h-4" />}
        onClick={() => navigate('/dashboard')}
      >
        العودة إلى لوحة التحكم
      </Button>
    </div>
  );
};

export default NotFoundPage;
