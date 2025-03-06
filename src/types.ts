export interface Product {
    _id: string;  
    name: string;
    description?: string;
    pairing: string[];
    taste: string[];
    location: {
        city: string;
        state: string;
        country: string;
    };
    imageUrl: string;
    backgroundUrl: string;
    styles: {
        textColor: string;
        bodyColor: string;
        borderColor: string;
    };
    backsideInfo: {
        additionalInfo: string;
    };
    status?: 'pending' | 'assigned';
    scanCount?: number;
    storeId?: string;
}