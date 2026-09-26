let originalImage = null;
let currentImage = null;

// Stack quản lý Local State[cite: 1]
let undoStack = [];
let redoStack = [];

const imgElement = document.getElementById('mainImage');
const uploadInput = document.getElementById('upload');
const compareBtn = document.getElementById('compareBtn');

// 1. Quản lý Upload Ảnh
uploadInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            originalImage = event.target.result;
            currentImage = originalImage;
            
            undoStack = [];
            redoStack = [];
            
            updateDisplay();
        };
        reader.readAsDataURL(file);
    }
});

// Hàm cập nhật giao diện
function updateDisplay() {
    imgElement.src = currentImage;
    imgElement.classList.remove('hidden');
}

// 2. Gửi lệnh xử lý lên Backend bằng API
async function applyAction(action) {
    if (!currentImage) return alert("Vui lòng tải ảnh lên trước!");

    // Lưu state hiện tại vào Undo Stack trước khi thay đổi
    undoStack.push(currentImage);
    redoStack = []; // Xóa redo stack mỗi khi có hành động mới

    try {
        const response = await fetch('http://localhost:5000/api/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: currentImage, action: action })
        });
        
        const data = await response.json();
        currentImage = data.image; // Cập nhật ảnh mới
        updateDisplay();
    } catch (error) {
        console.error("Lỗi khi xử lý ảnh:", error);
    }
}

// 3. Hoàn tác (Undo)
function undo() {
    if (undoStack.length > 0) {
        redoStack.push(currentImage);
        currentImage = undoStack.pop();
        updateDisplay();
    }
}

// 4. Làm lại (Redo)
function redo() {
    if (redoStack.length > 0) {
        undoStack.push(currentImage);
        currentImage = redoStack.pop();
        updateDisplay();
    }
}

// 5. So sánh nhanh
compareBtn.addEventListener('mousedown', () => {
    if (originalImage) imgElement.src = originalImage;
});
compareBtn.addEventListener('mouseup', () => {
    if (currentImage) imgElement.src = currentImage;
});
compareBtn.addEventListener('mouseleave', () => {
    if (currentImage) imgElement.src = currentImage;
});

// 6. Tải ảnh
function downloadImage() {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.href = currentImage;
    link.download = 'edited_image.jpg';
    link.click();
}