// src/pages/supplier/products/[supplierName]/[productName].tsx
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar/Navbar';
import { fetchProductDataFromS3 } from '@/lib/s3';
import { Product } from '@/types';
import Card from '@/components/Card/Card';
import styles from '@/components/Card/Card.module.css';

interface ProductPageProps {
    product: Product;
    supplierName: string;
    backsideInfo: { additionalInfo: string };
}

const capitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
};

const ProductPage = ({ product, supplierName, backsideInfo }: ProductPageProps) => {
    const router = useRouter();

    if (router.isFallback) {
        return <div>Loading...</div>;
    }

    const formattedSupplierName = capitalizeWords(supplierName);

    const frontContent = (
        <div className="p-4">
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p>{product.description}</p>
            <div className={styles.infoRow}>
                {product.pairing.length > 0 && (
                    <div className={styles.infoColumn}>
                        <strong>Pairing:</strong>
                        <div>{product.pairing.join(' ')}</div>
                    </div>
                )}
                {product.location && (
                    <div className={styles.infoColumn}>
                        <strong>Origin:</strong>
                        <div>
                            {product.location.city && `${product.location.city}, `}
                            {product.location.state && `${product.location.state}, `}
                            {product.location.country}
                        </div>
                    </div>
                )}
                {product.taste.length > 0 && (
                    <div className={styles.infoColumn}>
                        <strong>Taste:</strong>
                        <div>{product.taste.join(' ')}</div>
                    </div>
                )}
            </div>
        </div>
    );

    const backContent = (
        <div className="p-4">
            <h2 className="text-xl font-bold">Additional Info</h2>
            <p>{backsideInfo.additionalInfo || 'No additional information available.'}</p>
        </div>
    );

    return (
        <div>
            <Navbar />
            <div className="container mx-auto p-4 flex justify-center items-center min-h-screen">
                <Card
                    frontContent={frontContent}
                    backContent={backContent}
                    backgroundUrl={product.backgroundUrl}
                    imageUrl={product.imageUrl}
                    supplierName={formattedSupplierName} // Pass formatted supplierName prop
                    cardStyles={product.styles} // Pass card styles
                />
            </div>
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { supplierName, productName } = context.params as { supplierName: string; productName: string };
    const productData = await fetchProductDataFromS3(`suppliers/${supplierName}/products/${productName}/product.json`);
    const backsideInfoKey = `suppliers/${supplierName}/backsideInfo.json`;
    let backsideInfo = { additionalInfo: '' };

    try {
        backsideInfo = await fetchProductDataFromS3(backsideInfoKey);
    } catch (err) {
        console.error('Failed to fetch backside info:', err);
    }

    return {
        props: {
            product: productData,
            supplierName, // Pass supplierName as a prop
            backsideInfo, // Pass backsideInfo as a prop
        },
    };
};

export default ProductPage;