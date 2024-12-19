declare module 'qrcode' {
    interface QRCodeToDataURLOptions {
        errorCorrectionLevel?: 'low' | 'medium' | 'quartile' | 'high';
        type?: 'image/png' | 'image/jpeg' | 'image/webp';
        rendererOpts?: {
            quality?: number;
        };
        margin?: number;
        width?: number;
        color?: {
            dark?: string; // Color of dark module
            light?: string; // Color of light module
        };
    }

    export function toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>;
}