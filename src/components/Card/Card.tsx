import React, { useState } from 'react';
import Image from 'next/image';
import { FaRegCommentDots, FaRegCalendarAlt } from 'react-icons/fa';
import styles from './Card.module.css';

interface CardProps {
    frontContent?: React.ReactNode;
    backgroundUrl?: string;
    imageUrl: string;
    additionalContent?: React.ReactNode;
    supplierName: string;
    cardStyles: { textColor: string; bodyColor: string; borderColor: string };
    location?: { city?: string; state?: string; country?: string };
    pairing?: string[];
    taste?: string[];
    productName: string;
    productDescription: string;
    backsideDescription: string;
    backsideMessage: string;
}

const Card = ({ backgroundUrl, imageUrl, additionalContent, supplierName, cardStyles, location, pairing, taste, productName, productDescription, backsideDescription, backsideMessage }: CardProps) => {
    const [flipped, setFlipped] = useState(false);

    const handleCardClick = () => {
        setFlipped(!flipped);
    };

    const handleButtonClick = (event: React.MouseEvent) => {
        event.stopPropagation();
    };

    const formatLocation = (location?: { city?: string; state?: string; country?: string }) => {
        if (!location) return '';
        const parts = [location.city, location.state, location.country].filter(Boolean);
        return parts.join(', ');
    };

    const capitalizeWords = (str: string) => {
        return str.replace(/\b\w/g, char => char.toUpperCase());
    };

    return (
        <div className={styles.card} onClick={handleCardClick} style={{ '--card-border-color': cardStyles.borderColor } as React.CSSProperties}>
            <div className={`${styles.cardInner} ${flipped ? styles.flipped : ''}`}>
                <div className={styles.cardFront} style={{ backgroundColor: cardStyles.bodyColor, color: cardStyles.textColor }}>
                    <div className={styles.backgroundImageContainer}>
                        {backgroundUrl && (
                            <Image
                                src={backgroundUrl}
                                alt="Background"
                                fill
                                style={{ objectFit: 'cover' }} // Updated to use the style prop
                            />
                        )}
                        <div className={styles.productImageContainer}>
                            <Image
                                src={imageUrl}
                                alt="Product"
                                width={200}
                                height={200}
                                style={{ objectFit: 'contain' }} // Updated to use the style prop
                            />
                        </div>
                    </div>

                    {/* Front Of Card Info */}
                    <div className={styles.frontContent}>
                        <h1 className="text-xl font-bold">{productName}</h1>
                        <strong className={`text-sm ${styles.descriptionLabel}`}>Description</strong>
                        <p className={`text-sm ${styles.descriptionText}`}>{productDescription}</p>
                        <div className={styles.infoRow}>
                            {pairing && pairing.length > 0 && (
                                <div className={styles.infoColumn}>
                                    <strong>Pairing</strong>
                                    <ul className={styles.pairingList}>
                                        {pairing.map((item, index) => (
                                            <li key={index}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {location && (location.city || location.state || location.country) && (
                                <div className={styles.infoColumn}>
                                    <strong>Origin</strong>
                                    <div>{formatLocation(location)}</div>
                                </div>
                            )}
                            {taste && taste.length > 0 && (
                                <div className={styles.infoColumn}>
                                    <strong>Taste</strong>
                                    <ul className={styles.tasteList}>
                                        {taste.map((item, index) => (
                                            <li key={index}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Back of Card Info */}
                <div className={styles.cardBack} style={{ backgroundColor: cardStyles.bodyColor, color: cardStyles.textColor }}>
                    <div className="p-4">
                        <h2 className="text-xl font-bold">Welcome from your supplier</h2>
                        <h1 className="text-2xl font-bold">{capitalizeWords(supplierName)}</h1>
                        <p className="mt-4">{backsideDescription}</p>
                        <div className="flex justify-center mt-4">
                            <FaRegCommentDots size={32} />
                        </div>
                        
                        <p className="mt-4"><em>&quot;{backsideMessage}&quot;</em></p>
                        <div className="flex justify-center mt-4">
                            <FaRegCalendarAlt size={30} />
                        </div>
                        <p className="mt-4">Rescan the QR codes or visit here again during holidays and public events for updated themes and messages!</p>
                    </div>
                </div>
            </div>
            {additionalContent && (
                <div className={styles.additionalContent} onClick={handleButtonClick}>
                    {additionalContent}
                </div>
            )}
        </div>
    );
};

export default Card;