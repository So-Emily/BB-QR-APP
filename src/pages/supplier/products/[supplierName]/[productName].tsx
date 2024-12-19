import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar/Navbar';
import { fetchProductDataFromS3, listFilesInS3 } from '@/lib/s3';
import { Product } from '@/types';
import Image from 'next/image';

interface ProductPageProps {
    product: Product;
}

const ProductPage = ({ product }: ProductPageProps) => {
    const router = useRouter();

    if (router.isFallback) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <Navbar />
            <div className="container mx-auto p-4">
                <div className="relative w-full h-48">
                    {product.backgroundUrl && (
                        <Image
                            src={product.backgroundUrl}
                            alt="Background"
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            style={{ objectFit: 'cover' }}
                        />
                    )}
                    <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        style={{ objectFit: 'contain', position: 'absolute', top: 0, left: 0 }}
                    />
                </div>
                <h1 className="text-2xl font-bold mt-4">{product.name}</h1>
                <p className="mt-2">{product.description}</p>
                {product.pairing.length > 0 && (
                    <div className="mt-2">
                        <h3 className="font-bold">Pairing:</h3>
                        <ul>
                            {product.pairing.map((pair, index) => (
                                <li key={index}>{pair}</li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="mt-2">
                    <h3 className="font-bold">Origin:</h3>
                    <p>
                        {product.location.city}
                        {product.location.state && `, ${product.location.state}`}
                        {product.location.country && `, ${product.location.country}`}
                    </p>
                </div>
                {product.taste && product.taste.length > 0 && (
                    <div className="mt-2">
                        <h3 className="font-bold">Taste:</h3>
                        <ul>
                            {product.taste.map((t, index) => (
                                <li key={index}>{t}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export const getStaticPaths: GetStaticPaths = async () => {
    const suppliers = await listFilesInS3('suppliers/');
    const paths = [];

    for (const supplier of suppliers) {
        if (supplier) {
            const supplierName = supplier.split('/')[1];
            const productKeys = await listFilesInS3(`suppliers/${supplierName}/products/`);
            const jsonKeys = productKeys.filter((key): key is string => key !== undefined && key.endsWith('product.json'));

            for (const key of jsonKeys) {
                const productName = key.split('/')[3];
                paths.push({
                    params: {
                        supplierName,
                        productName: productName.replace('.json', ''),
                    },
                });
            }
        }
    }

    return {
        paths,
        fallback: true,
    };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const { supplierName, productName } = params as { supplierName: string; productName: string };
    const productData = await fetchProductDataFromS3(`suppliers/${supplierName}/products/${productName}/product.json`);

    return {
        props: {
            product: productData,
        },
        revalidate: 10, // Revalidate at most every 10 seconds
    };
};

export default ProductPage;