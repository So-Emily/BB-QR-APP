import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { uploadFileToS3 } from "@/utils/s3";
import Cropper, { Area } from "react-easy-crop";
import Modal from "react-modal";

Modal.setAppElement("#__next");

const capitalizeName = (name: string) =>
    name
        .replace(/-/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");

const StoreProfile = () => {
    const { data: session } = useSession();
    const rawStoreName = session?.user?.storeDetails?.storeName ?? "";
    const storeNumber = session?.user?.storeDetails?.storeNumber ?? "";
    const displayName = rawStoreName ? capitalizeName(rawStoreName) : "";

    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [croppedImage, setCroppedImage] = useState<string | null>(null);
    const [refreshProfileImage, setRefreshProfileImage] = useState(0);

    // Fetch profile image from S3 and check if it exists
    useEffect(() => {
        if (!rawStoreName || !storeNumber) return;
        const formattedStoreName = `${rawStoreName.replace(/\s+/g, "-").toLowerCase()}-${storeNumber}`;
        const key = `stores/${formattedStoreName}/profile-img.png`;
        const s3BaseUrl = "https://booze-bud-bucket.s3.us-east-1.amazonaws.com";
        const url = `${s3BaseUrl}/${key}`;
        setProfileImage(url + `?t=${Date.now()}`);
    }, [rawStoreName, storeNumber, refreshProfileImage]);

    // Handle file input change
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => setSelectedImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    // Handle crop complete
    const handleCropComplete = (_: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    // Handle saving image to s3
    const handleSaveProfileImage = async () => {
        if (!selectedImage || !croppedAreaPixels || !rawStoreName || !storeNumber) return;
        const croppedBlob = await getCroppedImage(selectedImage, croppedAreaPixels);
        const formattedStoreName = `${rawStoreName.replace(/\s+/g, "-").toLowerCase()}-${storeNumber}`;
        const key = `stores/${formattedStoreName}/profile-img.png`;
        const arrayBuffer = await croppedBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await uploadFileToS3(key, buffer, "image/png");
        setIsModalOpen(false);
        setSelectedImage(null);
        setCroppedImage(null);
        setRefreshProfileImage((v) => v + 1); // Triggers re-fetch
    };

    // Set variable for placholder image
    const PLACEHOLDER = "/images/profile-placeholder.png";

    // When modal opens, allow re-cropping of existing image
    const handleOpenModal = () => {
        setIsModalOpen(true);
        // Only set selectedImage if there is a real profile image (not placeholder)
        if (
            profileImage &&
            !profileImage.includes(PLACEHOLDER) &&
            !profileImage.endsWith(PLACEHOLDER)
        ) {
            setSelectedImage(profileImage);
        } else {
            setSelectedImage(null);
        }
    };

    return (
        <div className="rounded-lg p-4 flex flex-col items-center w-64 relative">
            {/* Profile picture container */}
            <div className="relative group cursor-pointer w-[200px] h-[200px] rounded-full overflow-hidden bg-customGray-300" onClick={handleOpenModal}>
                <img
                    src={croppedImage || profileImage || "/images/profile-placeholder.png"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/profile-placeholder.png"; }}
                />
                <div className="absolute rounded inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm">Change Profile Picture</span>
                </div>
            </div>

            {/* Store name */}
            <h1 className="text-3xl font-medium mt-4">{displayName}</h1>

            {/* Modal for uploading and cropping the profile picture */}
            <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)}>
                <h2 className="text-xl text-black font-bold mb-4">Upload Profile Picture</h2>
                {selectedImage && selectedImage.startsWith("data:") ? (
                    <div>
                        <div className="relative w-full h-64">
                            <Cropper
                                image={selectedImage}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={handleCropComplete}
                                minZoom={0.5}
                                maxZoom={3}
                            />
                        </div>
                        <div className="flex justify-between items-center mt-4">
                            <button
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                onClick={() => setSelectedImage(null)}
                            >
                                Change Photo
                            </button>
                            <div className="flex gap-2">
                                <button
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                    onClick={handleSaveProfileImage}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <input type="file" accept="image/*" onChange={handleFileChange} />
                        <button
                            className="mt-5 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 block"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

// ...getCroppedImage and createImage utility functions unchanged...
// Utility function to crop the image and return it as a Blob
async function getCroppedImage(imageSrc: string, croppedAreaPixels: Area): Promise<Blob> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    if (ctx) {
        ctx.fillStyle = "#D9D9D9";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
        );
    }
    return new Promise((resolve, reject) => {
        canvas.toBlob(
        (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Canvas toBlob failed"));
        },
        "image/png"
        );
    });
}

// Utility function to load an image from a URL
function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = document.createElement("img");
        image.src = url;
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Failed to load image: " + url));
    });
}

export default StoreProfile;