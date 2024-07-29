import os
import threading
import webbrowser
import cv2
from flask import Flask, render_template, request, jsonify, send_from_directory
from ultralytics import YOLO
import numpy as np

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'C:/Users/Luke.Czachor/V1VideoRayLC/D80Final723GOOD/uploads'

model = YOLO('C:\\d10weights\\best.pt')

# Designate Class names to a color (RGB decimal value)
class_colors = {
    '2000 m camera': (255, 0, 0),
    '5 pin female': (0, 255, 0),
    '5 pin male': (0, 0, 255),
    '5-5 pin extension': (255, 255, 0),
    '9 pin male': (255, 0, 255),
    '9-9pin': (0, 255, 255),
    'ATM IMU': (128, 0, 128),
    'DVL': (128, 128, 0),
    'DVL-mount': (0, 128, 128),
    'Defender-Skeleton': (128, 128, 128),
    'LED Lights': (255, 165, 0),
    'm5 coms module': (0, 128, 0),
    'm5 powermodule': (0, 0, 128),
    'm5-Thruster': (128, 0, 0),
    'tether-8 pin': (75, 0, 130)
}

confidence_threshold = 0.8
terminate_webcam_flag = False

@app.route('/')
def index():
    return render_template('ODweb.html')


@app.route('/uploads/<filename>')
def upload_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/process_image', methods=['POST'])
def process_image():
    source_type = request.form.get('source_type', 'file')  # Default to 'file'
    
    if 'image' in request.files:
        image = request.files['image']
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], image.filename)
        image.save(image_path)
        
        img = cv2.imread(image_path)
        if img is None:
            return jsonify({'error': 'Failed to load image'}), 500
        
        height, width, _ = img.shape  # Get image dimensions
        results = model(img)

        if results is None:
            return jsonify({'error': 'Model did not return results'}), 500
        
        print("Model results:", results)

        items_identified = {}
        
        if isinstance(results, list):
            for result in results:
                if not hasattr(result, 'boxes'):
                    return jsonify({'error': 'Invalid result object'}), 500
                for box in result.boxes:
                    class_id = int(box.cls[0])
                    class_name = result.names[class_id]
                    items_identified[class_name] = items_identified.get(class_name, 0) + 1
        else:
            if not hasattr(results, 'boxes'):
                return jsonify({'error': 'Invalid result object'}), 500
            for box in results.boxes:
                class_id = int(box.cls[0])
                class_name = results.names[class_id]
                items_identified[class_name] = items_identified.get(class_name, 0) + 1

        annotated_image = img.copy()
        for result in results:
            if not hasattr(result, 'boxes'):
                continue
            for box in result.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                conf_score = box.conf[0]
                class_id = int(box.cls[0])
                class_name = model.names[class_id]
                color = class_colors.get(class_name, (0, 255, 255))

                # Adjust border thickness and font scale based on source type
                if source_type == 'webcam':
                    border_thickness = max(2, min(5, int((x2 - x1) / 100)))  # Webcam adjustment
                    font_scale = max(0.7, min(1.5, (x2 - x1) / 200))  # Webcam adjustment
                    font_thickness = max(2, min(3, int(font_scale)))  # Webcam adjustment
                else:
                    border_thickness = max(5, min(10, int((x2 - x1) / 100)))  # File upload adjustment
                    font_scale = max(7.0, min(2.0, (x2 - x1) / 100))  # File upload adjustment
                    font_thickness = max(7, min(6, int(font_scale)))  # File upload adjustment

                print(f"Drawing box: {(x1, y1, x2, y2)} with color {color}, border_thickness {border_thickness}, font_scale {font_scale}, font_thickness {font_thickness}")

                cv2.rectangle(annotated_image, (x1, y1), (x2, y2), color, border_thickness)
                label = f'{class_name}: {conf_score:.2f}'
                cv2.putText(annotated_image, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, font_scale, color, font_thickness)

        annotated_image_path = os.path.join(app.config['UPLOAD_FOLDER'], 'annotated_' + image.filename)
        cv2.imwrite(annotated_image_path, annotated_image)
        if not os.path.exists(annotated_image_path):
            return jsonify({'error': 'Failed to save annotated image'}), 500

        response_data = {
            'message': 'Image processed successfully',
            'annotated_image': 'annotated_' + image.filename,
            'itemsIdentified': items_identified
        }
        
        return jsonify(response_data)
    
    return jsonify({'error': 'No image received'}), 400


@app.route('/enable_webcam')
def enable_webcam():
    global terminate_webcam_flag
    terminate_webcam_flag = False
    app.logger.info('Webcam processing started')
    return jsonify({'message': 'Webcam processing started'})


@app.route('/terminate_webcam')
def terminate_webcam():
    global terminate_webcam_flag
    terminate_webcam_flag = True
    return jsonify({'message': 'Webcam processing terminated'})

def open_browser():
    if not os.environ.get("WERKZEUG_RUN_MAIN"):
        webbrowser.open_new('http://127.0.0.1:5000/')


if __name__ == '__main__':
    threading.Timer(1, open_browser).start()
    app.run(debug=True)
