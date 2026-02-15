"""
PDF → 이미지/MusicXML 변환 서버
PDF 악보를 고해상도 이미지 또는 MusicXML(Audiveris OMR)로 변환
Railway 배포용
"""

import os
import sys
import io
import base64
import tempfile
import subprocess
import zipfile
import glob as globmod
from flask import Flask, request, jsonify
from pdf2image import convert_from_bytes

app = Flask(__name__)


@app.route("/", methods=["GET"])
def root():
    return jsonify({"status": "ok", "service": "pdf-to-image-and-musicxml"})


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/convert-to-images", methods=["POST"])
def convert_to_images():
    """
    PDF → base64 이미지 배열 반환

    Request: multipart/form-data
      - file: PDF 파일
      - dpi: 해상도 (기본 200)
      - max_pages: 최대 페이지 수 (기본 20)

    Response: { "images": ["data:image/png;base64,...", ...], "page_count": N }
    """
    if "file" not in request.files:
        return jsonify({"error": "파일이 필요합니다"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "파일명이 없습니다"}), 400

    dpi = int(request.form.get("dpi", 200))
    max_pages = int(request.form.get("max_pages", 20))

    try:
        pdf_bytes = file.read()

        # PDF → PIL Image 리스트
        images = convert_from_bytes(
            pdf_bytes,
            dpi=dpi,
            first_page=1,
            last_page=max_pages,
            fmt="png",
        )

        # PIL Image → base64 data URL
        base64_images = []
        for img in images:
            buffer = io.BytesIO()
            img.save(buffer, format="PNG", optimize=True)
            b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
            base64_images.append(f"data:image/png;base64,{b64}")
            buffer.close()

        return jsonify({
            "images": base64_images,
            "page_count": len(base64_images),
            "filename": file.filename,
        })

    except Exception as e:
        return jsonify({"error": f"PDF 변환 오류: {str(e)}"}), 500


@app.route("/convert-to-musicxml", methods=["POST"])
def convert_to_musicxml():
    """
    PDF → MusicXML 변환 (Audiveris OMR)

    Request: multipart/form-data
      - file: PDF 파일

    Response: { "musicxml": "<?xml ...>", "filename": "input.pdf" }
    """
    if "file" not in request.files:
        return jsonify({"error": "파일이 필요합니다"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "파일명이 없습니다"}), 400

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            # Save uploaded PDF
            input_path = os.path.join(tmpdir, "input.pdf")
            file.save(input_path)

            output_dir = os.path.join(tmpdir, "output")
            os.makedirs(output_dir, exist_ok=True)

            # Run Audiveris OMR
            result = subprocess.run(
                [
                    "Audiveris",
                    "-batch",
                    "-export",
                    "-output", output_dir,
                    "--", input_path,
                ],
                capture_output=True,
                text=True,
                timeout=600,
            )

            print(f"[Audiveris] returncode={result.returncode}", flush=True)
            if result.stdout:
                print(f"[Audiveris] stdout: {result.stdout[:500]}", flush=True)
            if result.stderr:
                print(f"[Audiveris] stderr: {result.stderr[:500]}", flush=True)

            # Find .mxl file (compressed MusicXML)
            mxl_files = globmod.glob(os.path.join(output_dir, "**", "*.mxl"), recursive=True)

            if not mxl_files:
                # Also check for uncompressed .xml files
                xml_files = globmod.glob(os.path.join(output_dir, "**", "*.xml"), recursive=True)
                if xml_files:
                    with open(xml_files[0], "r", encoding="utf-8") as f:
                        musicxml_text = f.read()
                    return jsonify({
                        "musicxml": musicxml_text,
                        "filename": file.filename,
                    })

                return jsonify({
                    "error": "MusicXML 변환 실패: Audiveris가 출력 파일을 생성하지 못했습니다.",
                    "stderr": result.stderr[:1000] if result.stderr else "",
                }), 500

            # Extract .mxl (ZIP containing .xml)
            mxl_path = mxl_files[0]
            musicxml_text = None

            with zipfile.ZipFile(mxl_path, "r") as zf:
                for name in zf.namelist():
                    if name.endswith(".xml") and not name.startswith("META-INF"):
                        musicxml_text = zf.read(name).decode("utf-8")
                        break

            if not musicxml_text:
                return jsonify({
                    "error": "MusicXML 변환 실패: .mxl 파일에서 XML을 추출할 수 없습니다.",
                }), 500

            return jsonify({
                "musicxml": musicxml_text,
                "filename": file.filename,
            })

    except subprocess.TimeoutExpired:
        return jsonify({"error": "MusicXML 변환 시간 초과 (600초)"}), 504
    except Exception as e:
        print(f"[Audiveris] Exception: {str(e)}", flush=True)
        return jsonify({"error": f"MusicXML 변환 오류: {str(e)}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    print(f"Starting server on port {port}", flush=True)
    app.run(host="0.0.0.0", port=port, debug=True)
