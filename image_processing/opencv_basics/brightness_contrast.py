import cv2
import os
import sys

# Ensure io_basics can be imported from the same directory
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from io_basics import load_image, save_image

def adjust_brightness(image, value):
    """Adjusts the brightness of an image.
    value: offset added to all pixels (negative to darken, positive to brighten).
    Uses cv2.convertScaleAbs to prevent underflow/overflow.
    """
    if image is None:
        return None
    return cv2.convertScaleAbs(image, alpha=1.0, beta=value)

def adjust_contrast(image, alpha):
    """Adjusts the contrast of an image.
    alpha: multiplier (alpha < 1 for low contrast, alpha > 1 for high contrast).
    Uses cv2.convertScaleAbs to prevent underflow/overflow.
    """
    if image is None:
        return None
    return cv2.convertScaleAbs(image, alpha=alpha, beta=0)

if __name__ == "__main__":
    input_path = os.path.join(current_dir, "../input/sample.jpg")
    img = load_image(input_path)
    
    if img is not None:
        # Brightness
        dark_img = adjust_brightness(img, -50)
        save_image(dark_img, os.path.join(current_dir, "../output/sample_brightness_dark.jpg"))
        
        bright_img = adjust_brightness(img, 50)
        save_image(bright_img, os.path.join(current_dir, "../output/sample_brightness_bright.jpg"))
        
        # Contrast
        low_contrast_img = adjust_contrast(img, 0.5)
        save_image(low_contrast_img, os.path.join(current_dir, "../output/sample_contrast_low.jpg"))
        
        high_contrast_img = adjust_contrast(img, 1.5)
        save_image(high_contrast_img, os.path.join(current_dir, "../output/sample_contrast_high.jpg"))
        
        # Combined Brightness + Contrast
        # e.g., slightly higher contrast (1.2) and brighter (30)
        combined_img = adjust_brightness(adjust_contrast(img, 1.2), 30)
        save_image(combined_img, os.path.join(current_dir, "../output/sample_brightness_contrast.jpg"))
        
        print("Brightness and Contrast adjustments completed successfully!")
