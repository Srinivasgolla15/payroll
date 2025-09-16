import React, { useState, useMemo, memo } from 'react';
import { Mestri } from '../src/types/firestore';

// Define InputField as a separate memoized component to prevent re-creation
const InputField = memo(
  ({ label, name, type = 'text', value, required = true, onChange }: {
    label: string;
    name: keyof MestriFormData;
    type?: string;
    value: string;
    required?: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => {
    // Debug render
    console.log(`Rendering InputField: ${name}`);
    return (
      <div>
        <label htmlFor={name} className="block text-sm font-medium text-cyan-700 dark:text-cyan-200 mb-1">
          {label}
        </label>
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full bg-gray-200 dark:bg-gray-800/70 border border-gray-300 dark:border-cyan-500/30 rounded-lg px-3 py-2 text-gray-800 dark:text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none transition"
        />
      </div>
    );
  }
);

interface AddMestriModalProps {
  onClose: () => void;
  onAddMestri: (mestriData: Omit<Mestri, 'id'>) => void;
}

type MestriFormData = Omit<Mestri, 'id'>;

export const AddMestriModal: React.FC<AddMestriModalProps> = ({ onClose, onAddMestri }) => {
  // Memoize initial form state
  const initialFormState = useMemo(
    () => ({
      name: '',
      phoneNumber: '',
      mestriId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    []
  );

  const [formData, setFormData] = useState<MestriFormData>(initialFormState);

  // Memoize handleChange to prevent re-creation
  const handleChange = useMemo(
    () =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
      },
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { createdAt, updatedAt, ...submitData } = formData;
    onAddMestri(submitData);
  };

  // Memoize form validation
  const isFormValid = useMemo(() => {
    return formData.name.trim().length > 0 && formData.phoneNumber.trim().length > 0;
  }, [formData.name, formData.phoneNumber]);

  // Memoize input fields to prevent re-renders
  const inputFields = useMemo(
    () => [
      { label: 'Full Name', name: 'name' as keyof MestriFormData, value: formData.name, required: true },
      { label: 'Phone Number', name: 'phoneNumber' as keyof MestriFormData, value: formData.phoneNumber, required: true },
      { label: 'Mestri ID', name: 'mestriId' as keyof MestriFormData, value: formData.mestriId, required: false },
    ],
    [formData.name, formData.phoneNumber, formData.mestriId]
  );

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-900/70 dark:border dark:border-cyan-500/30 rounded-2xl shadow-2xl dark:shadow-cyan-500/10 w-full max-w-md transform transition-all duration-300"
        style={{ animation: 'modal-enter 0.3s ease-out forwards' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700/50">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Mestri</h2>
          <p className="text-gray-500 dark:text-gray-400">Enter the details for the new mestri.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-4">
            {inputFields.map((field) => (
              <InputField
                key={field.name}
                label={field.label}
                name={field.name}
                value={field.value}
                required={field.required}
                onChange={handleChange}
              />
            ))}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600/50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className={`px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg shadow-lg dark:shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:shadow-xl dark:hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] transition-all duration-300 transform hover:scale-105 ${
                !isFormValid ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Add Mestri
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};