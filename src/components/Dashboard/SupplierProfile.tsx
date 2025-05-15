import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react"; // For user session management
import { uploadFileToS3 } from "@/utils/s3"; // Utility to upload files to AWS S3
import Cropper, { Area } from "react-easy-crop"; // Library for cropping images
import Modal from "react-modal"; // Library for creating modals

// Utility function to capitalize the first letter of each word in a name
const capitalizeName = (name: string) => {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const UserProfile = () => {
  // Get the current user session
  const { data: session } = useSession();

  // Get the user's name from the session, or default to "Guest"
  const userName = session?.user?.name ? capitalizeName(session.user.name) : "Guest";

  // State to store the profile image (as a base64 string)
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // State to control whether the modal is open
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State for cropping functionality
  const [crop, setCrop] = useState({ x: 0, y: 0 }); // Crop position
  const [zoom, setZoom] = useState(1); // Zoom level
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null); // Cropped area in pixels
  const [croppedImage, setCroppedImage] = useState<string | null>(null); // Final cropped image for display

  // Fetch the profile image from s3 
  useEffect(() => {
    const fetchProfileImage = async () => {
      if (session?.user?.name) {
        const supplierName = session.user.name.replace(/\s+/g, "-").toLowerCase();
        const key = `suppliers/${supplierName}/profile-img.png`; // Assuming the image is saved as PNG

        try {
          const imageUrl = await fetchFileFromS3(key); // Fetch the image URL from S3
          setProfileImage(imageUrl); // Set the profile image
        } catch (error) {
          console.error("Failed to fetch profile image from S3:", error);
        }
      }
    };

  

    fetchProfileImage();
  }, [session]);

  // Handle file input change (when a user selects an image)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader(); // Read the file as a base64 string
      reader.onload = () => setProfileImage(reader.result as string); // Set the profile image
      reader.readAsDataURL(file); // Convert the file to a base64 string
    }
  };

  // Called when cropping is complete
  const handleCropComplete = (_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels); // Save the cropped area
  };

  // Save the cropped profile image to AWS S3
  const handleSaveProfileImage = async () => {
    // Ensure all required data is available
    if (!profileImage || !croppedAreaPixels || !session?.user?.name) return;

    // Crop the image and get it as a Blob
    const croppedBlob = await getCroppedImage(profileImage, croppedAreaPixels);

    // Convert the Blob to a base64 string for immediate preview
    const croppedBase64 = await blobToBase64(croppedBlob);
    setCroppedImage(croppedBase64); // Update the cropped image for display

    // Format the supplier's name for the S3 key
    const supplierName = session.user.name.replace(/\s+/g, "-").toLowerCase();

    // Extract the file extension from the Blob's MIME type
    const fileExtension = croppedBlob.type.split("/")[1];

    // Define the S3 key for the profile image
    const key = `suppliers/${supplierName}/profile-img.${fileExtension}`;

    // Convert the Blob to an ArrayBuffer, then to a Buffer (required for S3 upload)
    const arrayBuffer = await croppedBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload the cropped image to S3
    await uploadFileToS3(key, buffer, croppedBlob.type);

    // Close the modal and notify the user
    setIsModalOpen(false);
    // alert("Profile picture updated successfully!");
  };

  return (
    <div className="rounded-lg p-4 flex flex-col items-center w-64 relative">
      {/* Profile picture container */}
      <div
        className="relative group cursor-pointer w-[200px] h-[200px] rounded-full overflow-hidden bg-customGray-300"
        onClick={() => setIsModalOpen(true)} // Open the modal when clicked
        // Used style instead of image because it allows for better control over the image properties,
        // such as size, position, and fallback image, without requiring an additional <img> element.
        style={{
          backgroundImage: `url(${croppedImage || profileImage || "/images/profile-placeholder.png"})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay text that appears on hover */}
        <div className="absolute rounded inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white text-sm">Change Profile Picture</span>
        </div>
      </div>

      {/* Display the user's name */}
      <h1 className="text-3xl font-medium mt-4">{userName}</h1>

      {/* Modal for uploading and cropping the profile picture */}
      <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)}>
        <h2 className="text-xl text-black font-bold mb-4">Upload Profile Picture</h2>
        {profileImage ? (
          // Show the cropping tool if an image is selected
          <div>
            <div className="relative w-full h-64">
              <Cropper
                image={profileImage} // The image to crop
                crop={crop} // Current crop position
                zoom={zoom} // Current zoom level
                aspect={1} // Aspect ratio (1:1 for a square)
                cropShape="round" // Make the crop box appear circular
                showGrid={false} // Optional: Hide the grid for a cleaner look
                onCropChange={setCrop} // Update crop position
                onZoomChange={setZoom} // Update zoom level
                onCropComplete={handleCropComplete} // Save the cropped area
                minZoom={0.5} // Minimum zoom level
                maxZoom={3} // Maximum zoom level
              />
            </div>
          </div>
        ) : (
          // Show a file input if no image is selected
          <input type="file" accept="image/*" onChange={handleFileChange} />
        )}

        <div className="flex justify-between items-center mt-4">
          {/* Show "Change Photo" button only when a photo is selected */}
          {profileImage && (
            <button
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              onClick={() => setProfileImage(null)} // Clear the current image to allow re-upload
            >
              Change Photo
            </button>
          )}

          <div className="flex gap-2">
            {/* Cancel button */}
            <button
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            {/* Save button */}
            <button
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={handleSaveProfileImage}
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Utility function to crop the image and return it as a Blob
async function getCroppedImage(imageSrc: string, croppedAreaPixels: Area): Promise<Blob> {
  const image = await createImage(imageSrc); // Load the image
  const canvas = document.createElement("canvas"); // Create a canvas element
  const ctx = canvas.getContext("2d"); // Get the canvas context

  // Set the canvas size to match the cropped area
  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;

  if (ctx) {
    // Fill the canvas with a transparent background
    ctx.fillStyle = "#D9D9D9"; // Use customGray-300 as the background color
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the cropped area of the image onto the canvas
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

  // Convert the canvas content to a Blob (use "image/png" for transparency)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob); // Return the Blob
        } else {
          reject(new Error("Canvas toBlob failed")); // Handle errors
        }
      },
      "image/png" // Output format to support transparency
    );
  });
}

// Utility function to load an image from a URL
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = document.createElement("img"); // Create an HTMLImageElement
    image.src = url; // Set the image source
    image.crossOrigin = "anonymous"; // Ensure cross-origin images work
    image.onload = () => resolve(image); // Resolve the promise when the image loads
    image.onerror = () => reject(new Error("Failed to load image: " + url)); // Reject on error
  });
}

// Utility function to convert a Blob to a base64 string
// Blob is a file-like object of immutable, raw data
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Utility function to fetch a file from S3
export const fetchFileFromS3 = async (key: string): Promise<string> => {
  const s3BaseUrl = "https://booze-bud-bucket.s3.us-east-1.amazonaws.com"; // Replace with your S3 bucket URL
  return `${s3BaseUrl}/${key}`;
};

export default UserProfile;