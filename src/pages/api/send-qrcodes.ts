import { NextApiRequest, NextApiResponse } from 'next';
import { uploadFileToS3 } from '@/lib/s3';
import QRCode from 'qrcode';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { products, stores } = req.body;

        try {
            // Process each product and store
            for (const product of products) {
                for (const store of stores) {
                    // Generate and upload QR code for each product-store combination
                    const qrCodeKey = `suppliers/${product.supplierName}/stores/${store}/${product.name}.svg`;
                    const qrCodeDataUrl = await QRCode.toDataURL(`${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/supplier/products/${product.supplierName}/${store}/${product.name}`, { errorCorrectionLevel: 'high' });
                    const response = await fetch(qrCodeDataUrl);
                    const blob = await response.blob();
                    const arrayBuffer = await blob.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    await uploadFileToS3(qrCodeKey, buffer, 'image/svg');
                }
            }

            res.status(200).json({ message: 'QR codes sent successfully' });
        } catch (error) {
            console.error('Error sending QR codes:', error);
            res.status(500).json({ error: 'Failed to send QR codes' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}