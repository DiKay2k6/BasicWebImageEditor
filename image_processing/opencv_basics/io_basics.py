import cv2
import os

def load_image(path):
    """Loads an image from the specified path using OpenCV."""
    if not os.path.exists(path):
        print(f"Error: File '{path}' does not exist.")
        return None
        
    image = cv2.imread(path)
    if image is None:
        print(f"Error: Failed to load image from '{path}'.")
    return image

def save_image(image, path):
    """Saves an image to the specified path using OpenCV."""
    success = cv2.imwrite(path, image)
    if success:
        print(f"Successfully saved image to '{path}'.")
    else:
        print(f"Error: Failed to save image to '{path}'.")
    return success

if __name__ == "__main__":
    print(f"OpenCV Version: {cv2.__version__}")
    
    input_path = "image_processing/input/sample.jpg"
    output_path = "image_processing/output/sample_output.jpg"
    
    # 1. Đọc ảnh
    print(f"Reading image from: {input_path}")
    img = load_image(input_path)
    
    if img is not None:
        print(f"Image loaded successfully! Shape: {img.shape}")
        
        # 2. Hiển thị ảnh
        # Lưu ý: Lệnh imshow có thể làm treo terminal nếu không có UI server trên môi trường agent, 
        # nhưng bạn có thể uncomment để xem ảnh khi chạy script này trên VS Code máy bạn.
        # print("Displaying image...")
        # cv2.imshow("Original Image", img)
        # cv2.waitKey(0)
        # cv2.destroyAllWindows()
        print("Note: cv2.imshow() is disabled in this test script to prevent blocking, but it is ready to use.")
        
        # 3. Lưu ảnh
        save_image(img, output_path)
