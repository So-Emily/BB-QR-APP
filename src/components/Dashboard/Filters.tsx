import React from "react";

const Filters = ({ selectedStore, setSelectedStore }: { selectedStore: string; setSelectedStore: (store: string) => void }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">Select Store</label>
      <select
        className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm"
        value={selectedStore}
        onChange={(e) => setSelectedStore(e.target.value)}
      >
        <option value="all">All Stores</option>
        <option value="store1-1234">Store 1</option>
        <option value="store2-1209">Store 2</option>
      </select>
    </div>
  );
};

export default Filters;