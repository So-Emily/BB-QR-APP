// src/components/Card/Card.tsx
import { useState } from 'react';
import Image from 'next/image';
import styles from './Card.module.css';

interface CardProps {
    frontContent: React.ReactNode;
    backContent: React.ReactNode;
    backgroundUrl: string;
    imageUrl: string;
    additionalContent?: React.ReactNode;
    supplierName: string;
    cardStyles: { textColor: string; bodyColor: string; borderColor: string }; // Add cardStyles prop
}

const Card = ({ frontContent, backContent, backgroundUrl, imageUrl, additionalContent, supplierName, cardStyles }: CardProps) => {
    const [flipped, setFlipped] = useState(false);

    const handleCardClick = () => {
        setFlipped(!flipped);
    };

    const handleButtonClick = (event: React.MouseEvent) => {
        event.stopPropagation();
    };

    return (
        <div className={styles.card} onClick={handleCardClick}>
            <div className={`${styles.cardInner} ${flipped ? styles.flipped : ''}`}>
                <div className={styles.cardFront} style={{ backgroundColor: cardStyles.bodyColor, color: cardStyles.textColor, borderColor: cardStyles.borderColor }}>
                    <div className={styles.backgroundImageContainer}>
                        {backgroundUrl && (
                            <Image
                                src={backgroundUrl}
                                alt="Background"
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                style={{ objectFit: 'cover' }}
                            />
                        )}
                        <div className={styles.productImageContainer}>
                            <Image
                                src={imageUrl}
                                alt="Product"
                                className={styles.productImage}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        </div>
                    </div>
                    <div className={styles.frontContent}>
                        {frontContent}
                    </div>
                </div>
                <div className={styles.cardBack} style={{ backgroundColor: cardStyles.bodyColor, color: cardStyles.textColor, borderColor: cardStyles.borderColor }}>
                    {backContent}
                    <div className={styles.supplierInfo}>
                        From the supplier of {supplierName}
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