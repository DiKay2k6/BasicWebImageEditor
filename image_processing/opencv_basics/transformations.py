import cv2
import os
import sys

# Đảm bảo có thể import io_basics từ cùng thư mục
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from io_basics import load_image, save_image

def resize_image(image, width, height):
    """Resizes the image to the specified width and height."""
    if image is None:
        return None
    return cv2.resize(image, (width, height))

def rotate_image(image, angle):
    """Rotates the image by 90, 180, or 270 degrees.
    (90 = Counter-Clockwise in standard math, but we can map them to OpenCV rotate flags).
    """
    if image is None:
        return None
        
    if angle == 90:
        return cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE)
    elif angle == 180:
        return cv2.rotate(image, cv2.ROTATE_180)
    elif angle == 270 or angle == -90:
        return cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)
    else:
        print(f"Warning: Angle {angle} is not supported. Use 90, 180, or 270.")
        return image

def flip_image(image, direction):
    """Flips the image horizontally, vertically, or both.
    direction: 'horizontal', 'vertical', or 'both'
    """
    if image is None:
        return None
        
    if direction == 'horizontal':
        return cv2.flip(image, 1)
    elif direction == 'vertical':
        return cv2.flip(image, 0)
    elif direction == 'both':
        return cv2.flip(image, -1)
    else:
        return image

if __name__ == "__main__":
    input_path = os.path.join(current_dir, "../input/sample.jpg")
    img = load_image(input_path)
    
    if img is not None:
        # Resize
        resized = resize_image(img, 256, 256)
        save_image(resized, os.path.join(current_dir, "../output/sample_resize.jpg"))
        
        # Rotate 90
        rot90 = rotate_image(img, 90)
        save_image(rot90, os.path.join(current_dir, "../output/sample_rotate_90.jpg"))
        
        # Rotate 180
        rot180 = rotate_image(img, 180)
        save_image(rot180, os.path.join(current_dir, "../output/sample_rotate_180.jpg"))
        
        # Flip horizontal
        flip_h = flip_image(img, 'horizontal')
        save_image(flip_h, os.path.join(current_dir, "../output/sample_flip_horizontal.jpg"))
        
        # Flip vertical
        flip_v = flip_image(img, 'vertical')
        save_image(flip_v, os.path.join(current_dir, "../output/sample_flip_vertical.jpg"))
        
        print("Transformations completed successfully!")
