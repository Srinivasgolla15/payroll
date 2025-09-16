import React, { useState } from "react";
import { Mestri } from "../src/types/firestore";
import { PencilSquareIcon } from "@heroicons/react/24/outline";

interface MestrisViewProps {
  mestriList: Mestri[];
  onEditMestri: (mestri: Mestri) => void;
}

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  mestri: Mestri;
  onSave: (updatedMestri: Mestri) => void;
}

const EditMestriModal: React.FC<EditModalProps> = ({ isOpen, onClose, mestri, onSave }) => {
  const [formData, setFormData] = useState<Mestri>({ ...mestri });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, updatedAt: new Date().toISOString() });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
          Edit Mestri Details
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:text-white"
              required
            />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md bg-gray-200 dark:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const MestrisView: React.FC<MestrisViewProps> = ({ mestriList, onEditMestri }) => {
  const [editingMestri, setEditingMestri] = useState<Mestri | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEditClick = (mestri: Mestri) => {
    setEditingMestri(mestri);
    setIsModalOpen(true);
  };

  const handleSave = (updatedMestri: Mestri) => {
    onEditMestri(updatedMestri);
    setEditingMestri(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mestriList.map((mestri) => (
            <div
              key={mestri.id}
              className="bg-white dark:bg-slate-800 border rounded-lg p-5 relative"
            >
              <button
                onClick={() => handleEditClick(mestri)}
                className="absolute top-3 right-3 text-slate-400 hover:text-blue-500"
                title="Edit Mestri"
              >
                <PencilSquareIcon className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-blue-700 dark:text-blue-300 font-medium">
                    {mestri.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                    {mestri.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ID: {mestri.mestriId}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span className="text-sm">{mestri.phoneNumber}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {editingMestri && (
        <EditMestriModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mestri={editingMestri}
          onSave={handleSave}
        />
      )}
    </div>
  );
};