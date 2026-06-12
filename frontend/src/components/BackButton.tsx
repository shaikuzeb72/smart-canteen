import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  className?: string;
}

const BackButton = ({ className = '' }: BackButtonProps) => {
  const navigate = useNavigate();

  return (
    <button 
      onClick={() => navigate(-1)} 
      className={`flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors ${className}`}
    >
      <ArrowLeft className="w-4 h-4 mr-1" />
      Back
    </button>
  );
};

export default BackButton;
