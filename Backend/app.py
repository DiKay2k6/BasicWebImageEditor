from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
from pymongo import MongoClient

app = Flask(__name__)
CORS(app) # Cho phép Frontend gọi API

# Kết nối MongoDB (quản lý User & Lịch sử)
client = MongoClient("mongodb://mongo:27017/")
db = client['image_editor_db']
users_collection = db['users']

def decode_image(base64_string):
    # Tách header data:image/jpeg;base64, ra khỏi chuỗi
    img_data = base64.b64decode(base64_string.split(',')[1])
    np_arr = np.frombuffer(img_data, np.uint8)
    return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

def encode_image(img):
    _, buffer = cv2.imencode('.jpg', img)
    return "data:image/jpeg;base64," + base64.b64encode(buffer).decode('utf-8')

@app.route('/api/process', methods=['POST'])
def process_image():
    data = request.json
    img_base64 = data.get('image')
    action = data.get('action')
    
    img = decode_image(img_base64)
    
    # Filtering & Transforming bằng OpenCV
    if action == 'grayscale':
        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    elif action == 'blur':
        img = cv2.GaussianBlur(img, (15, 15), 0)
    elif action == 'brightness':
        # Tăng độ sáng cơ bản (cộng thêm 30 vào mỗi pixel)
        img = cv2.convertScaleAbs(img, alpha=1, beta=30)
    elif action == 'sharpen':
        kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
        img = cv2.filter2D(img, -1, kernel)
    elif action == 'edge_detection':
        img = cv2.Canny(img, 100, 200)
    elif action == 'rotate':
        img = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
    elif action == 'flip':
        img = cv2.flip(img, 1) # Lật ngang
        
    result_base64 = encode_image(img)
    return jsonify({'image': result_base64})

@app.route('/api/login', methods=['POST'])
def login():
    # API giả lập đăng nhập MongoDB
    return jsonify({'status': 'success', 'message': 'Đăng nhập thành công'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)