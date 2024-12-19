import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar/Navbar';
import { listFilesInS3, fetchProductDataFromS3 } from '@/lib/s3';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';

const ViewProductsPage = () => {
    const { data: session } = useSession();
    const [products, setProducts] = useState<Product[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!session || !session.user) {
            setError('User not authenticated');
            return;
        }

        const fetchProducts = async () => {
            try {
                const supplierName = session.user.name?.replace(/\s+/g, '-').toLowerCase() ?? '';
                const productKeys = await listFilesInS3(`suppliers/${supplierName}/products/`);
                const jsonKeys = productKeys.filter((key): key is string => key !== undefined && key.endsWith('product.json'));
                const productPromises = jsonKeys.map(async (key: string) => {
                    try {
                        const productData = await fetchProductDataFromS3(key);
                        return productData;
                    } catch (err) {
                        console.error(`Failed to fetch product data for key ${key}:`, err);
                        return null;
                    }
                });
                const products = (await Promise.all(productPromises)).filter(product => product !== null);
                setProducts(products);
            } catch (err) {
                setError('Failed to fetch products: ' + err);
            }
        };

        fetchProducts();
    }, [session]);

    if (!session || !session.user) {
        return <div>User not authenticated</div>;
    }

    return (
        <div>
            <Navbar />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Your Products</h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product, index) => (
                        <div key={index} className="border rounded shadow p-4 block cursor-pointer">
                            <Link href={`/supplier/products/${session.user.name?.replace(/\s+/g, '-').toLowerCase()}/${product.name.replace(/\s+/g, '-').toLowerCase()}`} passHref>
                                <div className="block">
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
                                    <h2 className="text-xl font-bold mt-4 text-center">{product.name}</h2>
                                    <p className="mt-2 text-center">{product.description}</p>
                                    {product.pairing.length > 0 && (
                                        <div className="mt-2 text-center">
                                            <h3 className="font-bold">Pairing:</h3>
                                            <ul>
                                                {product.pairing.map((pair, index) => (
                                                    <li key={index}>{pair}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    <div className="mt-2 text-center">
                                        <h3 className="font-bold">Origin:</h3>
                                        <p>
                                            {product.location.city}
                                            {product.location.state && `, ${product.location.state}`}
                                            {product.location.country && `, ${product.location.country}`}
                                        </p>
                                    </div>
                                    {product.taste && product.taste.length > 0 && (
                                        <div className="mt-2 text-center">
                                            <h3 className="font-bold">Taste:</h3>
                                            <ul>
                                                {product.taste.map((t, index) => (
                                                    <li key={index}>{t}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </Link>
                            <div className="flex justify-center mt-4">
                                <Link href={`/supplier/products/${session.user.name?.replace(/\s+/g, '-').toLowerCase()}/${product.name.replace(/\s+/g, '-').toLowerCase()}/edit`} passHref>
                                    <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Edit</button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ViewProductsPage;