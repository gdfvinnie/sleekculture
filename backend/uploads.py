"""
Secure image upload and media serving.

- Only admins may upload.
- Only JPEG / PNG / WebP / AVIF images are accepted, 2 MB each, max 6 files.
- Files are renamed to random names; the original name is never used, so
  nothing user-controlled ever touches the filesystem path.
- Uploaded images are served from /api/media/<file> with long-lived caching.
"""

import os
import secrets
import time

from flask import Blueprint, jsonify, request, send_from_directory

from admin_auth import require_admin
from database import UPLOADS_DIR

uploads_bp = Blueprint("uploads", __name__)

ALLOWED_MIME = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/avif": ".avif",
}
ALLOWED_MEDIA_EXT = {".jpg", ".jpeg", ".png", ".webp", ".avif"}
MAX_UPLOAD_BYTES = 2 * 1024 * 1024  # 2 MB per image
MAX_UPLOAD_FILES = 6


@uploads_bp.post("/api/upload")
@require_admin
def upload_images():
    files = request.files.getlist("images")

    if not files:
        return jsonify({"error": "No images were uploaded."}), 400
    if len(files) > MAX_UPLOAD_FILES:
        return jsonify({"error": f"Maximum {MAX_UPLOAD_FILES} images per upload."}), 400

    urls = []
    for file in files:
        mime = (file.mimetype or "").lower()
        ext = ALLOWED_MIME.get(mime)
        if ext is None:
            return (
                jsonify(
                    {"error": "Only JPEG, PNG, WebP, or AVIF images are allowed."}
                ),
                415,
            )

        data = file.read()
        if len(data) > MAX_UPLOAD_BYTES:
            return jsonify({"error": "Each image must be 2MB or smaller."}), 413

        filename = f"{int(time.time() * 1000)}-{secrets.token_hex(8)}{ext}"
        with open(os.path.join(UPLOADS_DIR, filename), "wb") as out:
            out.write(data)
        urls.append(f"/api/media/{filename}")

    return jsonify({"urls": urls}), 201


@uploads_bp.get("/api/media/<path:filename>")
def serve_media(filename):
    # basename() blocks any path traversal (../../etc)
    safe_name = os.path.basename(filename)
    ext = os.path.splitext(safe_name)[1].lower()
    if ext not in ALLOWED_MEDIA_EXT:
        return jsonify({"error": "Not found."}), 404

    full_path = os.path.join(UPLOADS_DIR, safe_name)
    if not os.path.isfile(full_path):
        return jsonify({"error": "Not found."}), 404

    response = send_from_directory(
        UPLOADS_DIR, safe_name, conditional=True, max_age=2592000
    )
    response.headers["Cache-Control"] = "public, max-age=2592000, immutable"
    return response
