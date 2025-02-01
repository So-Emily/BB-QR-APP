// src/types.ts
export interface Product {
    id?: string;
    name: string;
    description: string;
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
}