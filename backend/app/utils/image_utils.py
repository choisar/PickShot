import base64
import io
import numpy as np
from PIL import Image
import cv2


def decode_base64_image(base64_str: str) -> np.ndarray:
    """Decodes a base64 string to an OpenCV BGR numpy image."""
    if "," in base64_str:
        base64_str = base64_str.split(",", 1)[1]
    
    img_bytes = base64.b64decode(base64_str)
    pil_image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    np_image = np.array(pil_image)
    return cv2.cvtColor(np_image, cv2.COLOR_RGB2BGR)


def compute_laplacian_variance(bgr_image: np.ndarray) -> float:
    """Calculates sharpness using OpenCV Laplacian variance."""
    gray = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())
