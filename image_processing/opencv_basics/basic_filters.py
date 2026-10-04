import cv2
import os
import sys

# Đảm bảo có thể import io_basics từ cùng thư mục
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from io_basics import load_image, save_image

def apply_grayscale(image):
    """Converts a BGR image to grayscale."""
    if image is None:
        return None
    return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

def apply_blur(image, kernel_size=(15, 15)):
    """Applies Gaussian Blur to the image."""
    if image is None:
        return None
    return cv2.GaussianBlur(image, kernel_size, 0)

if __name__ == "__main__":
    input_path = os.path.join(current_dir, "../input/sample.jpg")
    gray_output_path = os.path.join(current_dir, "../output/sample_grayscale.jpg")
    blur_output_path = os.path.join(current_dir, "../output/sample_blur.jpg")
    
    print("--- Testing Image Filters ---")
    img = load_image(input_path)
    
    if img is not None:
        print(f"Original shape: {img.shape}")
        
        # 1. Grayscale
        print("\nApplying Grayscale...")
        gray_img = apply_grayscale(img)
        print(f"Grayscale shape: {gray_img.shape}")
        save_image(gray_img, gray_output_path)
        
        # 2. Blur
        print("\nApplying Gaussian Blur...")
        blur_img = apply_blur(img, kernel_size=(15, 15))
        print(f"Blur shape: {blur_img.shape}")
        save_image(blur_img, blur_output_path)
        
        print("\nDone! Results saved to output/ folder.")
