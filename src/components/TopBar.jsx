import { ArrowLeft } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IoMdSettings } from "react-icons/io";

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const getTitle = () => {
    switch (path) {
      case '/': return 'Dashboard';
      case '/products': return 'Products';
      case '/invoices': return 'Invoices';
      case '/settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="flex justify-between items-center p-4 bg-white shadow-sm border-b">
      <div className="flex items-center">
        {path !== '/' && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft size={18} className="mr-1" />
            Back
          </button>
        )}
        <h2 className="text-xl font-bold text-gray-800">{getTitle()}</h2>
      </div>
      <div className="text-sm text-gray-500 flex gap-4 items-center">
        Today: {new Date().toLocaleDateString()}
     
      <Link to="settings">
        <IoMdSettings className="text-black w-8 h-8 hover:rotate-180 transition duration-300" />
      </Link>
       </div>
    </div>
  );
}