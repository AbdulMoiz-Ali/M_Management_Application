import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const BasicForm = () => {
  const { user, basicInformation, additionalinfo } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  const [setting, setSetting] = useState({
    martName: "",
    shopAddress: "",
    shopContactPhone: [],
    saleBy: [],
    suppliers: [],
    newPhone: '',
    newSalesPerson: '',
    newSupplier: ''
  });

  const [loading, setLoading] = useState({
    basicInfo: false,
    arrays: false
  });

  const [messages, setMessages] = useState({
    basicInfo: { type: '', text: '' },
    arrays: { type: '', text: '' }
  });

  // Populate form when user data is available
  useEffect(() => {
    if (user && !isInitialized) {
      setSetting({
        martName: user.martName || "",
        shopAddress: user.shopAddress || "",
        shopContactPhone: user.shopContactPhone || [],
        saleBy: user.saleBy || [],
        suppliers: user.suppliers || [],
        newPhone: '',
        newSalesPerson: '',
        newSupplier: ''
      });
      setIsInitialized(true);
    }
  }, [user, isInitialized]);

  // Handle basic information changes
  const handleBasicChange = (e) => {
    const { id, value } = e.target;
    setSetting(prev => ({ ...prev, [id]: value }));
  };

  // Handle array item additions
  const handleAddItem = (field) => {
    const newValue = setting[`new${field}`].trim();
    if (!newValue) return;

    setSetting(prev => ({
      ...prev,
      [field]: [...prev[field], newValue],
      [`new${field}`]: ''
    }));
  };

  // Handle array item removal
  const handleRemoveItem = (field, index) => {
    setSetting(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  // Submit basic information
  const handleBasicSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, basicInfo: true }));
    try {
      const { martName, shopAddress } = setting;

      const data = {
        martName: martName,
        shopAddress: shopAddress,
      }

      const result = await basicInformation(data);


      if (result.success) {
        setMessages({
          basicInfo: { type: 'success', text: 'Basic information saved!' },
          arrays: messages.arrays
        });
      } else {
        setMessages(prev => ({
          basicInfo: { type: 'error', text: result.error },
          arrays: messages.arrays
        }));
      }
    } catch (error) {
      setMessages({
        basicInfo: { type: 'error', text: error.message },
        arrays: messages.arrays
      });
    } finally {
      setLoading(prev => ({ ...prev, basicInfo: false }));
    }
  };

  // Submit array data
  const handleArraysSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, arrays: true }));
    try {
      const { shopContactPhone, saleBy, suppliers } = setting;

      const data = { shopContactPhone, saleBy, suppliers };

      const result = await additionalinfo(data);
      if (result.success) {
        setMessages({
          basicInfo: messages.basicInfo,
          arrays: { type: 'success', text: 'Additional data saved!' }
        });
      } else {
        setMessages({
          basicInfo: messages.basicInfo,
          arrays: { type: 'error', text: error.message }
        });
      }

    } catch (error) {
      setMessages({
        basicInfo: messages.basicInfo,
        arrays: { type: 'error', text: error.message }
      });
    } finally {
      setLoading(prev => ({ ...prev, arrays: false }));
    }
  };

  // Input configuration for array fields
  const arrayInputConfig = [
    {
      id: 'phones',
      field: 'shopContactPhone',
      label: 'Shop Contact Phones',
      placeholder: 'Add phone number',
      color: 'blue'
    },
    {
      id: 'sales',
      field: 'saleBy',
      label: 'Sales Persons',
      placeholder: 'Add sales person',
      color: 'green'
    },
    {
      id: 'suppliers',
      field: 'suppliers',
      label: 'Suppliers',
      placeholder: 'Add supplier',
      color: 'yellow'
    }
  ];

  return (
    <div className="space-y-8 ">
      {/* Basic Information Form */}
      <form onSubmit={handleBasicSubmit} className="space-y-4 bg-white dark:bg-gray-800  rounded-lg ">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Basic Information</h2>

        <div>
          <label htmlFor="martName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mart Name
          </label>
          <input
            id="martName"
            type="text"
            value={setting.martName}
            onChange={handleBasicChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter Mart Name"
            required
          />
        </div>

        <div>
          <label htmlFor="shopAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Shop Address
          </label>
          <input
            id="shopAddress"
            type="text"
            value={setting.shopAddress}
            onChange={handleBasicChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter Shop Address"
            required
          />
        </div>

        {messages.basicInfo.text && (
          <p className={`mt-2 text-sm ${messages.basicInfo.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {messages.basicInfo.text}
          </p>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading.basicInfo}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${loading.basicInfo
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
          >
            {loading.basicInfo ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Basic Info</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Array Inputs Form */}
      <form onSubmit={handleArraysSubmit} className="space-y-4 bg-white dark:bg-gray-800 rounded-lg ">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Additional Information</h2>

        {arrayInputConfig.map((config) => (
          <div key={config.id}>
            <label htmlFor={config.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {config.label}
            </label>
            <div className="flex gap-2">
              <input
                id={`new${config.field}`}
                type="text"
                value={setting[`new${config.field}`]}
                onChange={(e) => setSetting(prev => ({ ...prev, [`new${config.field}`]: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={config.placeholder}
              />
              <button
                type="button"
                onClick={() => handleAddItem(config.field)}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors`}
              >
                Add
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {setting[config.field].map((item, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center px-3 py-1 rounded-full bg-${config.color}-100 dark:bg-${config.color}-900 text-black font-semibold font-sans dark:text-white text-sm`}
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(config.field, index)}
                    className={`ml-2 text-${config.color}-600 dark:text-${config.color}-600 hover:text-${config.color}-800 dark:hover:text-${config.color}-100`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        ))}

        {messages.arrays.text && (
          <p className={`mt-2 text-sm ${messages.arrays.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {messages.arrays.text}
          </p>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading.arrays}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${loading.arrays
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
          >
            {loading.arrays ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Additional Info</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BasicForm;