import React, { useEffect, useState } from "react";

interface FiltersProps {
  selectedStore: string;
  setSelectedStore: (store: string) => void;
}

interface Store {
  storeId: string;
  storeName: string;
}

const Filters = ({ selectedStore, setSelectedStore }: FiltersProps) => {
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch("/api/stores/for-suppliers");
        const data = await response.json();
        setStores(data);
      } catch (error) {
        console.error("Failed to fetch stores:", error);
      }
    };

    fetchStores();
  }, []);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">Select Store</label>
      <select
        className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm"
        value={selectedStore}
        onChange={(e) => setSelectedStore(e.target.value)}
      >
        <option value="all">All Stores</option>
        {stores.map((store) => (
          <option key={store.storeId} value={store.storeId}>
            {store.storeName || store.storeId}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Filters;
