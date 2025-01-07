// src/pages/supplier/dashboard.tsx
import Navbar from '@/components/Navbar/Navbar';
import React from 'react';

const SupplierDashboard: React.FC = () => {
    return (
        <div>
            <Navbar />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
                <h1>Supplier Dashboard</h1>
            </div>
            
        </div>
    );
};


export default SupplierDashboard;