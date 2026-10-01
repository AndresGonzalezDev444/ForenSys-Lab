import os
import shutil
import base64
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Body, Form, Request
import bcrypt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

import models, schemas
from database import engine, get_db

import exifread
from PIL import Image
import io

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ForenSys Vision API")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def retrain_model(db):
    pass

import time

def save_face_photo(suspect_id: int, file_data: bytes, filename: str, db: Session, angle: str = "front"):
    os.makedirs("static/faces", exist_ok=True)
    ext = os.path.splitext(filename)[1] or ".jpg"
    unique_id = int(time.time() * 1000)
    rel_path = f"faces/{suspect_id}_{unique_id}{ext}"
    abs_path = f"static/{rel_path}"
    with open(abs_path, "wb") as f:
        f.write(file_data)
    photo = models.FacePhoto(suspect_id=suspect_id, file_path=rel_path, angle=angle or "front")
    db.add(photo)
    # Also set legacy photo_path for backward compat
    suspect = db.query(models.Suspect).filter(models.Suspect.id == suspect_id).first()
    if suspect and not suspect.photo_path:
        suspect.photo_path = rel_path
    db.commit()
    db.refresh(photo)
    return photo

def delete_photo_file(photo: models.FacePhoto):
    abs_path = f"static/{photo.file_path}" if not photo.file_path.startswith("static/") else photo.file_path
    if os.path.exists(abs_path):
        os.remove(abs_path)

@app.on_event("startup")
def create_initial_admin():
    db = next(get_db())
    admin_user = db.query(models.User).filter(models.User.username == "admin").first()
    if not admin_user:
        hashed_password = get_password_hash("admin123")
        admin_user = models.User(username="admin", hashed_password=hashed_password, role="admin")
        db.add(admin_user)
        db.commit()
    # Migrate legacy single photos to face_photos table
    suspects = db.query(models.Suspect).filter(
        models.Suspect.photo_path != None,
        ~models.Suspect.face_photos.any()
    ).all()
    for suspect in suspects:
        old_path = suspect.photo_path
        rel_path = old_path.replace("static/", "", 1) if old_path.startswith("static/") else old_path
        if os.path.exists(old_path):
            photo = models.FacePhoto(suspect_id=suspect.id, file_path=rel_path, angle="front")
            db.add(photo)
    if suspects:
        db.commit()
        print(f"Migrated {len(suspects)} legacy photos to face_photos table.")
    db.close()

@app.post("/api/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password", headers={"WWW-Authenticate": "Bearer"})
    return {"access_token": user.username, "token_type": "bearer"}

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == token).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user

@app.get("/api/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/api/suspects", response_model=List[schemas.SuspectResponse])
def get_suspects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    suspects = db.query(models.Suspect).offset(skip).limit(limit).all()
    return suspects

@app.post("/api/suspects", response_model=schemas.SuspectResponse)
def create_suspect(suspect: schemas.SuspectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_suspect = models.Suspect(**suspect.model_dump())
    db.add(db_suspect)
    db.commit()
    db.refresh(db_suspect)
    return db_suspect

@app.get("/api/suspects/{suspect_id}", response_model=schemas.SuspectResponse)
def get_suspect(suspect_id: int, db: Session = Depends(get_db)):
    suspect = db.query(models.Suspect).filter(models.Suspect.id == suspect_id).first()
    if not suspect:
        raise HTTPException(status_code=404, detail="Suspect not found")
    return suspect

@app.post("/api/suspects/{suspect_id}/photo", response_model=schemas.FacePhotoResponse)
def upload_suspect_photo(suspect_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    suspect = db.query(models.Suspect).filter(models.Suspect.id == suspect_id).first()
    if not suspect:
        raise HTTPException(status_code=404, detail="Suspect not found")
    file_data = file.file.read()
    photo = save_face_photo(suspect_id, file_data, file.filename or "photo.jpg", db)
    retrain_model(db)
    return photo

@app.post("/api/suspects/{suspect_id}/photo_base64", response_model=schemas.FacePhotoResponse)
def upload_photo_base64(suspect_id: int, data: dict = Body(...), db: Session = Depends(get_db)):
    suspect = db.query(models.Suspect).filter(models.Suspect.id == suspect_id).first()
    if not suspect:
        raise HTTPException(status_code=404, detail="Suspect not found")
    image_data = data.get("image_base64", "")
    angle = data.get("angle", "front")
    if "," in image_data:
        image_data = image_data.split(",", 1)[1]
    img_bytes = base64.b64decode(image_data)
    photo = save_face_photo(suspect_id, img_bytes, "webcam.jpg", db, angle=angle)
    retrain_model(db)
    return photo

@app.get("/api/suspects/{suspect_id}/photos", response_model=List[schemas.FacePhotoResponse])
def list_suspect_photos(suspect_id: int, db: Session = Depends(get_db)):
    suspect = db.query(models.Suspect).filter(models.Suspect.id == suspect_id).first()
    if not suspect:
        raise HTTPException(status_code=404, detail="Suspect not found")
    return suspect.face_photos

@app.delete("/api/photos/{photo_id}")
def delete_photo(photo_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    photo = db.query(models.FacePhoto).filter(models.FacePhoto.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    delete_photo_file(photo)
    db.delete(photo)
    db.commit()
    retrain_model(db)
    return {"ok": True, "id": photo_id}

@app.put("/api/suspects/{suspect_id}", response_model=schemas.SuspectResponse)
def update_suspect(suspect_id: int, data: dict = Body(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    suspect = db.query(models.Suspect).filter(models.Suspect.id == suspect_id).first()
    if not suspect:
        raise HTTPException(status_code=404, detail="Suspect not found")
    allowed_fields = {"first_name", "last_name", "behavior_profile", "identification"}
    for field, value in data.items():
        if field in allowed_fields:
            setattr(suspect, field, value)
    db.commit()
    db.refresh(suspect)
    return suspect

@app.delete("/api/suspects/{suspect_id}")
def delete_suspect(suspect_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    suspect = db.query(models.Suspect).filter(models.Suspect.id == suspect_id).first()
    if not suspect:
        raise HTTPException(status_code=404, detail="Suspect not found")
    for photo in suspect.face_photos:
        delete_photo_file(photo)
    if suspect.photo_path:
        legacy_path = f"static/{suspect.photo_path}" if not suspect.photo_path.startswith("static/") else suspect.photo_path
        if os.path.exists(legacy_path):
            os.remove(legacy_path)
    db.delete(suspect)
    db.commit()
    retrain_model(db)
    return {"ok": True, "id": suspect_id}

@app.post("/api/cyber/extract_metadata")
async def extract_metadata(file: UploadFile = File(...)):
    import hashlib
    import mimetypes
    try:
        content = await file.read()
        tags = exifread.process_file(io.BytesIO(content))
        
        # 1. File Integrity & Basic Info
        md5_hash = hashlib.md5(content).hexdigest()
        sha256_hash = hashlib.sha256(content).hexdigest()
        mime_type, _ = mimetypes.guess_type(file.filename)
        
        file_info = {
            "filename": file.filename,
            "size_bytes": len(content),
            "mime_type": mime_type or "application/octet-stream",
            "md5": md5_hash,
            "sha256": sha256_hash
        }
        
        # 2. Hardware & Image params
        hardware_info = {}
        if 'Image Make' in tags: hardware_info['Make'] = str(tags['Image Make'])
        if 'Image Model' in tags: hardware_info['Model'] = str(tags['Image Model'])
        if 'Image Software' in tags: hardware_info['Software'] = str(tags['Image Software'])
        if 'EXIF ExifImageWidth' in tags: hardware_info['ImageWidth'] = str(tags['EXIF ExifImageWidth'])
        if 'EXIF ExifImageLength' in tags: hardware_info['ImageLength'] = str(tags['EXIF ExifImageLength'])
        if 'Image XResolution' in tags: hardware_info['XResolution'] = str(tags['Image XResolution'])
        if 'Image YResolution' in tags: hardware_info['YResolution'] = str(tags['Image YResolution'])
        
        # 3. Capture Params
        capture_info = {}
        if 'EXIF FNumber' in tags: capture_info['FNumber'] = str(tags['EXIF FNumber'])
        if 'EXIF ExposureTime' in tags: capture_info['ExposureTime'] = str(tags['EXIF ExposureTime'])
        if 'EXIF ISOSpeedRatings' in tags: capture_info['ISOSpeedRatings'] = str(tags['EXIF ISOSpeedRatings'])
        if 'EXIF FocalLength' in tags: capture_info['FocalLength'] = str(tags['EXIF FocalLength'])
        if 'EXIF Flash' in tags: capture_info['Flash'] = str(tags['EXIF Flash'])
        if 'EXIF DateTimeOriginal' in tags: capture_info['DateTimeOriginal'] = str(tags['EXIF DateTimeOriginal'])
        
        # All other EXIF for raw table
        raw_metadata = {}
        for tag in tags.keys():
            if tag not in ('JPEGThumbnail', 'TIFFThumbnail', 'Filename', 'EXIF MakerNote'):
                val = str(tags[tag])
                if len(val) < 500:
                    raw_metadata[tag] = val
                    
        # 4. Strict GPS Extraction
        gps_data = {"gps_present": False, "status": "METADATA_NOT_FOUND"}
        if 'GPS GPSLatitude' in tags and 'GPS GPSLongitude' in tags:
            try:
                lat = tags['GPS GPSLatitude'].values
                lat_ref = str(tags.get('GPS GPSLatitudeRef', 'N'))
                lon = tags['GPS GPSLongitude'].values
                lon_ref = str(tags.get('GPS GPSLongitudeRef', 'W'))
                
                def to_decimal(coords, ref):
                    d, m, s = [float(x.num)/float(x.den) if x.den != 0 else 0 for x in coords]
                    dec = d + (m/60.0) + (s/3600.0)
                    if ref in ['S', 'W']:
                        dec = -dec
                    return dec
                
                dec_lat = to_decimal(lat, lat_ref)
                dec_lon = to_decimal(lon, lon_ref)
                
                # Format DMS
                def to_dms_str(coords, ref):
                    d, m, s = [float(x.num)/float(x.den) if x.den != 0 else 0 for x in coords]
                    return f"{int(d)}° {int(m)}' {s:.2f}\" {ref}"
                
                gps_data = {
                    "gps_present": True,
                    "status": "SUCCESS",
                    "latitude_dd": dec_lat,
                    "longitude_dd": dec_lon,
                    "latitude_dms": to_dms_str(lat, lat_ref),
                    "longitude_dms": to_dms_str(lon, lon_ref),
                    "map_url": f"https://www.google.com/maps/search/?api=1&query={dec_lat},{dec_lon}"
                }
                
                if 'GPS GPSAltitude' in tags:
                    alt = tags['GPS GPSAltitude'].values[0]
                    alt_val = float(alt.num) / float(alt.den) if alt.den != 0 else 0
                    alt_ref = tags.get('GPS GPSAltitudeRef', 0)
                    if str(alt_ref) == '1': alt_val = -alt_val
                    gps_data['altitude_meters'] = alt_val
                    
                if 'GPS GPSDate' in tags and 'GPS GPSTimeStamp' in tags:
                    gps_date = tags['GPS GPSDate'].values
                    gps_time = tags['GPS GPSTimeStamp'].values
                    time_str = f"{int(gps_time[0].num/gps_time[0].den):02d}:{int(gps_time[1].num/gps_time[1].den):02d}:{float(gps_time[2].num/gps_time[2].den):05.2f}"
                    gps_data['timestamp'] = f"{gps_date} {time_str} UTC"
                    
                if 'GPS GPSImgDirection' in tags:
                    gps_data['direction'] = str(tags['GPS GPSImgDirection'])
                    
                if 'GPS GPSDOP' in tags:
                    gps_data['precision_dop'] = str(tags['GPS GPSDOP'])

            except Exception as e:
                gps_data = {"gps_present": False, "status": f"ERROR_PARSING: {str(e)}"}
                
        return {
            "file_info": file_info,
            "hardware": hardware_info,
            "capture": capture_info,
            "gps": gps_data,
            "raw_metadata": raw_metadata
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

from pydantic import BaseModel
class OSINTRequest(BaseModel):
    query: str

@app.post("/api/osint/analyze")
async def analyze_osint(request: OSINTRequest):
    from fastapi.responses import StreamingResponse
    import asyncio
    import queue
    import subprocess
    import threading
    import sys
    import json
    
    query = request.query.lower().strip()
    username = query.split("@")[0] if "@" in query else query
    
    async def event_generator():
        q = queue.Queue()
        
        def run_sherlock():
            try:
                os.makedirs("./reports", exist_ok=True)
                raw_path = f"./reports/raw_{username}.txt"
                json_path = f"./reports/osint_report_{username}.json"

                # Resolve venv python to ensure sherlock_project is found
                venv_python = ".\\venv\\Scripts\\python.exe" if os.path.exists(".\\venv\\Scripts\\python.exe") else sys.executable

                # Verify sherlock is installed before launching
                check = subprocess.run(
                    [venv_python, "-c", "import sherlock_project"],
                    capture_output=True
                )
                if check.returncode != 0:
                    q.put({"type": "log", "data": "[!] sherlock_project no está instalado en el entorno virtual."})
                    q.put({"type": "log", "data": "[*] Instalando sherlock desde tools/sherlock..."})
                    sherlock_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "tools", "sherlock"))
                    install_result = subprocess.run(
                        [venv_python, "-m", "pip", "install", "-e", sherlock_dir, "--quiet"],
                        capture_output=True, text=True
                    )
                    if install_result.returncode != 0:
                        q.put({"type": "log", "data": f"[-] No se pudo instalar sherlock: {install_result.stderr.strip()}"})
                        q.put({"type": "log", "data": "[!] Ejecuta manualmente: pip install sherlock-project"})
                        q.put(None)
                        return
                    q.put({"type": "log", "data": "[+] sherlock instalado correctamente. Iniciando escaneo..."})

                command = [venv_python, "-m", "sherlock_project", username, "--output", raw_path, "--print-all", "--no-color"]
                creationflags = 0
                if sys.platform == "win32":
                    creationflags = subprocess.CREATE_NO_WINDOW

                # Enforce UTF-8 output
                env = os.environ.copy()
                env["PYTHONIOENCODING"] = "utf-8"

                process = subprocess.Popen(
                    command,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    bufsize=1,
                    creationflags=creationflags,
                    env=env,
                    encoding="utf-8"
                )

                findings = []
                for line in process.stdout:
                    clean = line.strip()
                    if not clean: continue
                    q.put({"type": "log", "data": clean})

                    if "[+]" in clean:
                        parts = clean.replace("[+]", "").strip().split(":", 1)
                        if len(parts) == 2:
                            findings.append({
                                "platform": parts[0].strip(),
                                "url": parts[1].strip(),
                                "status": "Found"
                            })
                try:
                    process.wait(timeout=300)
                except subprocess.TimeoutExpired:
                    process.kill()
                    q.put({"type": "log", "data": "[!] Tiempo máximo de escaneo alcanzado (5 min). Resultados parciales."})

                report = {
                    "suite_module": "ForenSys OSINT & NetTracker",
                    "target_username": username,
                    "total_found": len(findings),
                    "findings": findings
                }
                with open(json_path, "w", encoding="utf-8") as f:
                    json.dump(report, f, indent=4, ensure_ascii=False)

                q.put({"type": "log", "data": f"[*] Escaneo completado. {len(findings)} coincidencias encontradas."})
                q.put(None)
            except Exception as e:
                q.put({"type": "log", "data": f"[-] Error: {str(e)}"})
                q.put(None)
        
        thread = threading.Thread(target=run_sherlock, daemon=True)
        thread.start()
        
        while True:
            try:
                item = q.get_nowait()
                if item is None:
                    break
                yield json.dumps(item) + "\n"
            except queue.Empty:
                await asyncio.sleep(0.1)

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")


# ==========================================
# OSINT — EMAIL INTELLIGENCE
# ==========================================
class EmailIntelRequest(BaseModel):
    email: str

@app.post("/api/osint/email")
async def analyze_email(request: EmailIntelRequest):
    from fastapi.responses import StreamingResponse
    import asyncio
    import queue
    import subprocess
    import threading
    import sys
    import json
    import re

    email = request.email.strip().lower()
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        raise HTTPException(status_code=400, detail="Formato de email inválido")

    async def event_generator():
        q = queue.Queue()

        def run_email_scan():
            try:
                os.makedirs("./reports", exist_ok=True)
                json_path = f"./reports/email_report_{email.replace('@','_at_')}.json"
                findings = []

                q.put({"type": "log", "data": f"[*] Iniciando Email Intelligence para: {email}"})
                q.put({"type": "log", "data": "[*] Motor: user-scanner (primario) + holehe (fallback)"})
                q.put({"type": "log", "data": "─" * 50})

                # Resolve venv executables
                venv_python = ".\\venv\\Scripts\\python.exe" if os.path.exists(".\\venv\\Scripts\\python.exe") else "python"
                venv_holehe = ".\\venv\\Scripts\\holehe.exe" if os.path.exists(".\\venv\\Scripts\\holehe.exe") else "holehe"

                # Enforce UTF-8 + disable color to prevent:
                #   1) UnicodeEncodeError from colorama writing ✔ to cp1252 stdout
                #   2) ANSI escape codes polluting parsed output
                env = os.environ.copy()
                env["PYTHONIOENCODING"] = "utf-8"
                env["PYTHONUTF8"] = "1"
                env["NO_COLOR"] = "1"          # suppresses colorama/rich color output
                env["TERM"] = "dumb"            # forces plain text output in many CLIs

                # Strip ANSI escape sequences from a string
                import re as _re
                _ansi_escape = _re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')

                SCAN_TIMEOUT = 300  # segundos máximos por herramienta (user-scanner necesita ~2-4 min)

                def run_tool_with_timeout(command, label):
                    """
                    Runs a subprocess with a hard timeout.
                    Key fixes vs previous version:
                      - stdin=DEVNULL: closes stdin immediately so interactive prompts
                        (e.g. 'Do you want to update? y/n') don't block forever.
                      - communicate(timeout): OS-level timeout, guaranteed to break.
                    Returns (stdout_lines, returncode).
                    """
                    creationflags = 0
                    if sys.platform == "win32":
                        creationflags = subprocess.CREATE_NO_WINDOW
                    try:
                        proc = subprocess.Popen(
                            command,
                            stdin=subprocess.DEVNULL,   # ← closes interactive prompts
                            stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT,
                            creationflags=creationflags,
                            env=env,
                        )
                        try:
                            raw_out, _ = proc.communicate(timeout=SCAN_TIMEOUT)
                        except subprocess.TimeoutExpired:
                            proc.kill()
                            raw_out, _ = proc.communicate()
                            q.put({"type": "log", "data": f"[!] Timeout ({SCAN_TIMEOUT}s) alcanzado en {label}. Resultados parciales."})
                        decoded = raw_out.decode("utf-8", errors="replace")
                        # Strip ANSI codes so checkmarks/colors don't break parsing
                        decoded = _ansi_escape.sub("", decoded)
                        return decoded.splitlines(), proc.returncode
                    except Exception as ex:
                        q.put({"type": "log", "data": f"[!] {label} no disponible: {str(ex)}"})
                        return [], -1

                scanner_success = False

                # — user-scanner —
                q.put({"type": "log", "data": f"[*] Ejecutando user-scanner (timeout: {SCAN_TIMEOUT}s)..."})
                us_command = [venv_python, "-m", "user_scanner", "-e", email, "--allow-loud"]
                us_lines, us_code = run_tool_with_timeout(us_command, "user-scanner")

                for clean in us_lines:
                    clean = clean.strip()
                    if not clean:
                        continue
                    q.put({"type": "log", "data": clean})
                    # user-scanner marks found accounts with [✔], (✔), [+] or "Found"
                    if "[+]" in clean or "found" in clean.lower() or "\u2714" in clean or "\u2713" in clean or "registered" in clean.lower():
                        parts = clean.split(":", 1) if ":" in clean else [clean, ""]
                        platform_raw = parts[0].replace("[+]", "").replace("[\u2714]", "").replace("\u2714", "").replace("\u2713", "").strip()
                        if "(" in platform_raw and ")" in platform_raw:
                            platform_raw = platform_raw.split("(")[0].strip()
                        if platform_raw:
                            findings.append({
                                "platform": platform_raw,
                                "detail": parts[1].strip() if len(parts) > 1 else "Cuenta encontrada",
                                "status": "Found"
                            })
                            scanner_success = True
                    elif clean.startswith("\u251c\u2500\u2500") or clean.startswith("\u2514\u2500\u2500") or clean.startswith("\u2502"):
                        if findings:
                            clean_prop = clean.replace("\u251c\u2500\u2500", "").replace("\u2514\u2500\u2500", "").replace("\u2502", "").strip()
                            findings[-1]["detail"] += f"<br>\u2022 {clean_prop}"

                if us_code == 0:
                    scanner_success = True

                # — holehe fallback —
                if not scanner_success:
                    q.put({"type": "log", "data": f"[*] Ejecutando holehe (fallback, timeout: {SCAN_TIMEOUT}s)..."})
                    ho_command = [venv_holehe, email, "--only-used", "--no-color"]
                    ho_lines, _ = run_tool_with_timeout(ho_command, "holehe")

                    for clean in ho_lines:
                        clean = clean.strip()
                        if not clean:
                            continue
                        q.put({"type": "log", "data": clean})
                        if "[+]" in clean:
                            parts = clean.replace("[+]", "").strip().split(":", 1)
                            findings.append({
                                "platform": parts[0].strip(),
                                "detail": parts[1].strip() if len(parts) > 1 else "Cuenta registrada",
                                "status": "Found"
                            })

                report = {
                    "suite_module": "ForenSys Email Intelligence",
                    "target_email": email,
                    "total_found": len(findings),
                    "findings": findings,
                    "report_file": json_path.replace("./", "")
                }
                with open(json_path, "w", encoding="utf-8") as f:
                    json.dump(report, f, indent=4, ensure_ascii=False)

                q.put({"type": "log", "data": "─" * 50})
                q.put({"type": "log", "data": f"[*] Escaneo completado. {len(findings)} servicios encontrados."})
                q.put({"type": "report", "data": report})
                q.put(None)
            except Exception as e:
                q.put({"type": "log", "data": f"[-] Error fatal: {str(e)}"})
                q.put(None)

        thread = threading.Thread(target=run_email_scan, daemon=True)
        thread.start()

        while True:
            try:
                item = q.get_nowait()
                if item is None:
                    break
                yield json.dumps(item) + "\n"
            except queue.Empty:
                await asyncio.sleep(0.1)

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")


# ==========================================
# OSINT — PHONE INTELLIGENCE
# ==========================================
class PhoneIntelRequest(BaseModel):
    phone: str

@app.post("/api/osint/phone")
async def analyze_phone(request: PhoneIntelRequest):
    from fastapi.responses import StreamingResponse
    import asyncio
    import json

    phone_raw = request.phone.strip()

    async def event_generator():
        import queue
        q = queue.Queue()
        import threading

        def run_phone_scan():
            try:
                import phonenumbers
                from phonenumbers import carrier, geocoder, timezone

                os.makedirs("./reports", exist_ok=True)
                safe_phone = phone_raw.replace("+", "plus_").replace(" ", "")
                json_path = f"./reports/phone_report_{safe_phone}.json"

                q.put({"type": "log", "data": f"[*] Iniciando Phone Intelligence para: {phone_raw}"})
                q.put({"type": "log", "data": "[*] Motor: phonenumbers (Google libphonenumber) + Google Dorks"})
                q.put({"type": "log", "data": "─" * 50})

                # Parse the phone number
                try:
                    parsed = phonenumbers.parse(phone_raw, "CO")
                except Exception as e:
                    q.put({"type": "log", "data": f"[-] Error parsing número: {str(e)}"})
                    q.put({"type": "log", "data": "[!] Asegúrate de incluir código de país (+57 para Colombia)"})
                    q.put(None)
                    return

                is_valid = phonenumbers.is_valid_number(parsed)
                is_possible = phonenumbers.is_possible_number(parsed)
                number_type = phonenumbers.number_type(parsed)

                type_map = {
                    0: "Fijo", 1: "Móvil", 2: "Fijo o Móvil",
                    3: "Número gratuito", 4: "Premium", 5: "Costo compartido",
                    6: "VoIP", 7: "Número personal", 8: "Buscapersonas",
                    9: "UAN", 10: "Desconocido", 27: "Emergency", 28: "Voicemail"
                }

                phone_info = {
                    "number_e164": phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164),
                    "number_international": phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.INTERNATIONAL),
                    "number_national": phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.NATIONAL),
                    "valid": is_valid,
                    "possible": is_possible,
                    "country_code": parsed.country_code,
                    "national_number": str(parsed.national_number),
                    "country": geocoder.description_for_number(parsed, "es") or geocoder.description_for_number(parsed, "en") or "Desconocido",
                    "carrier": carrier.name_for_number(parsed, "es") or carrier.name_for_number(parsed, "en") or "Desconocido",
                    "timezone": list(timezone.time_zones_for_number(parsed)),
                    "line_type": type_map.get(number_type, "Desconocido")
                }

                q.put({"type": "log", "data": f"[+] Formato E.164:      {phone_info['number_e164']}"})
                q.put({"type": "log", "data": f"[+] Internacional:      {phone_info['number_international']}"})
                q.put({"type": "log", "data": f"[+] Nacional:           {phone_info['number_national']}"})
                q.put({"type": "log", "data": f"[+] Válido:             {'✅ Sí' if is_valid else '❌ No'}"})
                q.put({"type": "log", "data": f"[+] País/Ubicación:     {phone_info['country']}"})
                q.put({"type": "log", "data": f"[+] Operador:           {phone_info['carrier']}"})
                q.put({"type": "log", "data": f"[+] Tipo de línea:      {phone_info['line_type']}"})
                q.put({"type": "log", "data": f"[+] Zona horaria:       {', '.join(phone_info['timezone'])}"})
                q.put({"type": "log", "data": f"[+] Código de país:     +{phone_info['country_code']}"})

                q.put({"type": "log", "data": ""})
                q.put({"type": "log", "data": "─" * 50})
                
                # Extract formats for integrations and dorks
                e164 = phone_info["number_e164"]
                national = phone_info["number_national"]
                raw_digits = str(parsed.national_number)
                country_name = phone_info["country"]

                q.put({"type": "log", "data": "[*] Integración: Consultando Truecaller (truecallerpy)..."})
                import sys, json, subprocess, requests
                
                venv_truecaller = ".\\venv\\Scripts\\truecallerpy.exe" if os.path.exists(".\\venv\\Scripts\\truecallerpy.exe") else "truecallerpy"
                
                try:
                    tc_command = [venv_truecaller, "-s", e164, "-r"]
                    creationflags = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
                    tc_process = subprocess.run(tc_command, capture_output=True, text=True, creationflags=creationflags)
                    
                    if tc_process.returncode == 0 and tc_process.stdout.strip().startswith("{"):
                        tc_data = json.loads(tc_process.stdout)
                        if "data" in tc_data and isinstance(tc_data["data"], list) and len(tc_data["data"]) > 0:
                            person = tc_data["data"][0]
                            name = person.get("name", "Desconocido")
                            score = person.get("spamScore", 0)
                            
                            q.put({"type": "log", "data": f"[+] Truecaller Nombre:  {name}"})
                            q.put({"type": "log", "data": f"[+] Score de Spam:      {score}"})
                            
                            phone_info["truecaller_name"] = name
                            phone_info["truecaller_spam_score"] = score
                        elif "error" in tc_data and "login" in tc_data["error"].lower() or "illegal header" in tc_data.get("message", "").lower():
                            q.put({"type": "log", "data": "[!] Truecaller requiere login. Ejecuta 'truecallerpy login' en la consola para activar las búsquedas gratuitas."})
                        else:
                            q.put({"type": "log", "data": "[-] No se encontraron coincidencias en Truecaller."})
                    else:
                        if "login" in tc_process.stderr.lower() or "login" in tc_process.stdout.lower() or "error" in tc_process.stdout.lower():
                            q.put({"type": "log", "data": "[!] Truecaller requiere inicio de sesión. Abre tu consola virtual (venv) y corre: 'truecallerpy login'"})
                        else:
                            q.put({"type": "log", "data": "[-] No se encontraron resultados en Truecaller."})
                except Exception as e:
                    q.put({"type": "log", "data": f"[!] Error al consultar Truecaller: {str(e)}"})

                q.put({"type": "log", "data": "─" * 50})
                q.put({"type": "log", "data": "[*] Integración: Consultando Contratos del Estado (SECOP I y II)..."})
                
                secop_matches = []
                try:
                    headers = {"Accept": "application/json"}
                    
                    # SECOP II
                    q.put({"type": "log", "data": "[*] Buscando en SECOP II..."})
                    soda_url_secop2 = f"https://www.datos.gov.co/resource/jbjy-vk9h.json?$q={raw_digits}"
                    resp2 = requests.get(soda_url_secop2, timeout=10, headers=headers)
                    if resp2.status_code == 200:
                        data2 = resp2.json()
                        for row in data2[:3]: # limit to 3 to avoid spam
                            entidad = row.get("entidad", "Desconocida")
                            proveedor = row.get("proveedor_adjudicado", "Desconocido")
                            secop_matches.append({"plataforma": "SECOP II", "entidad": entidad, "proveedor": proveedor})
                            q.put({"type": "log", "data": f"[+] Encontrado en SECOP II: {proveedor} - Entidad: {entidad}"})
                    
                    # SECOP I
                    q.put({"type": "log", "data": "[*] Buscando en SECOP I..."})
                    soda_url_secop1 = f"https://www.datos.gov.co/resource/qmzi-eqyu.json?$q={raw_digits}"
                    resp1 = requests.get(soda_url_secop1, timeout=10, headers=headers)
                    if resp1.status_code == 200:
                        data1 = resp1.json()
                        for row in data1[:3]:
                            entidad = row.get("nombre_entidad", "Desconocida")
                            proveedor = row.get("nom_raz_social_contratista", "Desconocido")
                            secop_matches.append({"plataforma": "SECOP I", "entidad": entidad, "proveedor": proveedor})
                            q.put({"type": "log", "data": f"[+] Encontrado en SECOP I: {proveedor} - Entidad: {entidad}"})
                            
                    if not secop_matches:
                        q.put({"type": "log", "data": "[-] No se encontraron contratos asociados a este número."})
                except Exception as e:
                    q.put({"type": "log", "data": f"[!] Error al consultar SECOP: {str(e)}"})

                phone_info["secop_matches"] = secop_matches

                q.put({"type": "log", "data": "─" * 50})
                q.put({"type": "log", "data": "[*] Generando Google Dorks para búsqueda avanzada..."})

                # Generate Google Dorks and OSINT Links
                dorks = [
                    {"query": "WhatsApp API", "description": "Verificar WhatsApp", "url": f"https://wa.me/{e164.replace('+', '')}"},
                    {"query": "Truecaller", "description": "Buscar en Truecaller", "url": f"https://www.truecaller.com/search/co/{raw_digits}"},
                    {"query": "Sync.me", "description": "Buscar en Sync.me", "url": f"https://sync.me/search/?number={e164}"},
                    {"query": "Google Maps", "description": "Ubicación Regional", "url": f"https://www.google.com/maps/search/{country_name.replace(' ', '+')}"},
                    {"query": f'"{e164}"', "description": "Búsqueda exacta formato E.164", "url": f"https://www.google.com/search?q=%22{e164}%22"},
                    {"query": f'"{national}"', "description": "Búsqueda formato nacional", "url": f"https://www.google.com/search?q=%22{national.replace(' ', '+')}%22"},
                    {"query": f'"{raw_digits}"', "description": "Búsqueda por dígitos", "url": f"https://www.google.com/search?q=%22{raw_digits}%22"},
                    {"query": f'site:facebook.com "{raw_digits}"', "description": "Facebook", "url": f"https://www.google.com/search?q=site%3Afacebook.com+%22{raw_digits}%22"},
                    {"query": f'site:instagram.com "{raw_digits}"', "description": "Instagram", "url": f"https://www.google.com/search?q=site%3Ainstagram.com+%22{raw_digits}%22"},
                    {"query": f'site:linkedin.com "{raw_digits}"', "description": "LinkedIn", "url": f"https://www.google.com/search?q=site%3Alinkedin.com+%22{raw_digits}%22"},
                    {"query": f'site:twitter.com OR site:x.com "{raw_digits}"', "description": "Twitter/X", "url": f"https://www.google.com/search?q=site%3Atwitter.com+OR+site%3Ax.com+%22{raw_digits}%22"},
                ]

                phone_info["dorks"] = dorks

                for i, dork in enumerate(dorks, 1):
                    q.put({"type": "log", "data": f"[+] Dork #{i}: {dork['query']}"})
                    q.put({"type": "log", "data": f"    → {dork['description']}"})

                report = {
                    "suite_module": "ForenSys Phone Intelligence",
                    "target_phone": phone_raw,
                    "phone_info": phone_info,
                    "dorks": dorks,
                    "report_file": json_path.replace("./", "")
                }
                with open(json_path, "w", encoding="utf-8") as f:
                    json.dump(report, f, indent=4, ensure_ascii=False)

                q.put({"type": "log", "data": ""})
                q.put({"type": "log", "data": "─" * 50})
                q.put({"type": "log", "data": f"[*] Análisis completado. {len(dorks)} dorks generados."})
                q.put({"type": "report", "data": report})
                q.put(None)
            except ImportError:
                q.put({"type": "log", "data": "[-] Error: librería 'phonenumbers' no instalada."})
                q.put({"type": "log", "data": "[!] Ejecuta: pip install phonenumbers"})
                q.put(None)
            except Exception as e:
                q.put({"type": "log", "data": f"[-] Error fatal: {str(e)}"})
                q.put(None)

        thread = threading.Thread(target=run_phone_scan, daemon=True)
        thread.start()

        while True:
            try:
                item = q.get_nowait()
                if item is None:
                    break
                yield json.dumps(item) + "\n"
            except queue.Empty:
                await asyncio.sleep(0.1)

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")


# ==========================================
# OSINT — CC INTELLIGENCE (CÉDULA COLOMBIA)
# ==========================================
class CedulaIntelRequest(BaseModel):
    cedula: str

@app.post("/api/osint/cedula")
async def analyze_cedula(request: CedulaIntelRequest):
    from fastapi.responses import StreamingResponse
    import asyncio
    import json
    import re

    cedula = re.sub(r'[^0-9]', '', request.cedula.strip())
    if not cedula or len(cedula) < 6 or len(cedula) > 12:
        raise HTTPException(status_code=400, detail="Número de cédula inválido (6-12 dígitos)")

    async def event_generator():
        import queue
        import threading
        q = queue.Queue()

        def run_cedula_scan():
            try:
                import requests as http_requests

                os.makedirs("./reports", exist_ok=True)
                json_path = f"./reports/cedula_report_{cedula}.json"
                findings = []

                q.put({"type": "log", "data": f"[*] Iniciando CC Intelligence para cédula: {cedula}"})
                q.put({"type": "log", "data": "[*] Motor: Datos Abiertos Colombia (SODA API) + Google Dorks"})
                q.put({"type": "log", "data": "─" * 50})

                # 1. Query datos.gov.co SODA API (SIRI - Procuraduría)
                q.put({"type": "log", "data": "[*] Consultando Datos Abiertos Colombia (SIRI Procuraduría)..."})
                siri_results = []
                try:
                    soda_url = f"https://www.datos.gov.co/resource/iaeu-rcn6.json?$where=numero_de_identificaci_n='{cedula}'"
                    resp = http_requests.get(soda_url, timeout=15, headers={"Accept": "application/json"})
                    if resp.status_code == 200:
                        siri_results = resp.json()
                        if siri_results:
                            q.put({"type": "log", "data": f"[+] Registros encontrados en SIRI: {len(siri_results)}"})
                            for r in siri_results[:10]:
                                name = r.get("nombre_completo", r.get("nombre", "N/A"))
                                sancion = r.get("clase_de_falta", r.get("sanci_n", "N/A"))
                                entidad = r.get("entidad", "N/A")
                                q.put({"type": "log", "data": f"    → Nombre: {name}"})
                                q.put({"type": "log", "data": f"    → Sanción: {sancion}"})
                                q.put({"type": "log", "data": f"    → Entidad: {entidad}"})
                                q.put({"type": "log", "data": ""})
                                findings.append({
                                    "source": "SIRI - Procuraduría",
                                    "name": name,
                                    "sanction": sancion,
                                    "entity": entidad,
                                    "raw": r
                                })
                        else:
                            q.put({"type": "log", "data": "[*] Sin registros en SIRI (Procuraduría). Registro limpio."})
                    else:
                        q.put({"type": "log", "data": f"[!] SODA API respondió con código: {resp.status_code}"})
                except Exception as e:
                    q.put({"type": "log", "data": f"[!] Error consultando SODA API: {str(e)}"})

                # 2. Official portal links
                q.put({"type": "log", "data": ""})
                q.put({"type": "log", "data": "─" * 50})
                q.put({"type": "log", "data": "[*] Generando enlaces a portales oficiales de consulta..."})

                portals = [
                    {"name": "Procuraduría General", "description": "Antecedentes disciplinarios", "url": "https://www.procuraduria.gov.co/Pages/certificado-antecedentes.aspx", "icon": "[Portal]"},
                    {"name": "Policía Nacional", "description": "Antecedentes judiciales", "url": "https://antecedentes.policia.gov.co:7005/WebJudicial/", "icon": "[Portal]"},
                    {"name": "Contraloría General", "description": "Antecedentes fiscales", "url": "https://cfiscal.contraloria.gov.co/certificados/", "icon": "[Portal]"},
                    {"name": "Rama Judicial", "description": "Consulta de procesos", "url": "https://consultaprocesos.ramajudicial.gov.co/", "icon": "[Portal]"},
                    {"name": "ADRES", "description": "Afiliación en salud", "url": "https://www.adres.gov.co/consulte-su-eps", "icon": "[Portal]"},
                    {"name": "SIMIT", "description": "Comparendos de tránsito", "url": "https://www.fcm.org.co/simit/#/home-702", "icon": "[Portal]"},
                    {"name": "RUES", "description": "Registro empresarial", "url": "https://www.rues.org.co/", "icon": "[Portal]"},
                    {"name": "SISBEN", "description": "Consulta de puntaje", "url": "https://www.sisben.gov.co/Paginas/consulta-tu-grupo.aspx", "icon": "[Portal]"},
                    {"name": "Libreta Militar", "description": "Situación militar", "url": "https://www.libretamilitar.mil.co/", "icon": "[Portal]"},
                ]

                for portal in portals:
                    q.put({"type": "log", "data": f"[+] {portal['icon']} {portal['name']}: {portal['description']}"})
                    q.put({"type": "log", "data": f"    → {portal['url']}"})

                # 3. Google Dorks for cedula
                q.put({"type": "log", "data": ""})
                q.put({"type": "log", "data": "─" * 50})
                q.put({"type": "log", "data": "[*] Generando Google Dorks para cédula..."})

                dorks = [
                    {"query": f'"{cedula}"', "description": "Búsqueda exacta de cédula", "url": f"https://www.google.com/search?q=%22{cedula}%22"},
                    {"query": f'"{cedula}" filetype:pdf', "description": "Documentos PDF públicos", "url": f"https://www.google.com/search?q=%22{cedula}%22+filetype%3Apdf"},
                    {"query": f'"{cedula}" filetype:xlsx OR filetype:xls OR filetype:csv', "description": "Hojas de cálculo públicas", "url": f"https://www.google.com/search?q=%22{cedula}%22+filetype%3Axlsx+OR+filetype%3Axls+OR+filetype%3Acsv"},
                    {"query": f'"{cedula}" site:gov.co', "description": "Portales gubernamentales", "url": f"https://www.google.com/search?q=%22{cedula}%22+site%3Agov.co"},
                    {"query": f'"{cedula}" site:datos.gov.co', "description": "Datos abiertos Colombia", "url": f"https://www.google.com/search?q=%22{cedula}%22+site%3Adatos.gov.co"},
                    {"query": f'"{cedula}" contrato OR licitación OR adjudicación', "description": "Contratación pública", "url": f"https://www.google.com/search?q=%22{cedula}%22+contrato+OR+licitaci%C3%B3n+OR+adjudicaci%C3%B3n"},
                    {"query": f'"{cedula}" site:secop.gov.co OR site:colombiacompra.gov.co', "description": "SECOP - Contratación estatal", "url": f"https://www.google.com/search?q=%22{cedula}%22+site%3Asecop.gov.co+OR+site%3Acolombiacompra.gov.co"},
                ]

                for i, dork in enumerate(dorks, 1):
                    q.put({"type": "log", "data": f"[+] Dork #{i}: {dork['query']}"})

                report = {
                    "suite_module": "ForenSys CC Intelligence",
                    "target_cedula": cedula,
                    "siri_results": siri_results,
                    "siri_total": len(siri_results),
                    "portals": portals,
                    "dorks": dorks,
                    "findings": findings,
                    "report_file": json_path.replace("./", "")
                }
                with open(json_path, "w", encoding="utf-8") as f:
                    json.dump(report, f, indent=4, ensure_ascii=False)

                q.put({"type": "log", "data": ""})
                q.put({"type": "log", "data": "─" * 50})
                summary_parts = []
                if siri_results:
                    summary_parts.append(f"{len(siri_results)} registros SIRI")
                summary_parts.append(f"{len(portals)} portales")
                summary_parts.append(f"{len(dorks)} dorks")
                q.put({"type": "log", "data": f"[*] Análisis completado. {', '.join(summary_parts)}."})
                q.put({"type": "report", "data": report})
                q.put(None)
            except Exception as e:
                q.put({"type": "log", "data": f"[-] Error fatal: {str(e)}"})
                q.put(None)

        thread = threading.Thread(target=run_cedula_scan, daemon=True)
        thread.start()

        while True:
            try:
                item = q.get_nowait()
                if item is None:
                    break
                yield json.dumps(item) + "\n"
            except queue.Empty:
                await asyncio.sleep(0.1)

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")


# ==========================================
# OSINT — NAME INTELLIGENCE (Nombre Completo)
# ==========================================
class NameIntelRequest(BaseModel):
    name: str

@app.post("/api/osint/name")
async def analyze_name(request: NameIntelRequest):
    from fastapi.responses import StreamingResponse
    import asyncio
    import json

    full_name = request.name.strip()
    if len(full_name) < 3:
        raise HTTPException(status_code=400, detail="Nombre demasiado corto (mínimo 3 caracteres)")

    async def event_generator():
        import queue
        import threading
        q = queue.Queue()

        def run_name_scan():
            try:
                import requests as http_requests
                from urllib.parse import quote_plus

                os.makedirs("./reports", exist_ok=True)
                safe_name = full_name.replace(" ", "_").replace("/", "")[:50]
                json_path = f"./reports/name_report_{safe_name}.json"
                findings = []

                q.put({"type": "log", "data": f"[*] Iniciando Name Intelligence para: {full_name}"})
                q.put({"type": "log", "data": "[*] Motor: Datos Abiertos Colombia + Google Dorks + Redes Sociales"})
                q.put({"type": "log", "data": "─" * 50})

                name_encoded = quote_plus(full_name)

                # 1. SODA API search by name
                q.put({"type": "log", "data": "[*] Consultando Datos Abiertos Colombia (SIRI)..."})
                siri_results = []
                try:
                    # Try searching by name in SIRI
                    soda_url = f"https://www.datos.gov.co/resource/iaeu-rcn6.json?$where=upper(nombre_completo) like '%25{full_name.upper()}%25'&$limit=10"
                    resp = http_requests.get(soda_url, timeout=15, headers={"Accept": "application/json"})
                    if resp.status_code == 200:
                        siri_results = resp.json()
                        if siri_results:
                            q.put({"type": "log", "data": f"[+] Registros encontrados en SIRI: {len(siri_results)}"})
                            for r in siri_results[:5]:
                                name_r = r.get("nombre_completo", "N/A")
                                cedula_r = r.get("numero_de_identificaci_n", "N/A")
                                sancion = r.get("clase_de_falta", r.get("sanci_n", "N/A"))
                                q.put({"type": "log", "data": f"    → {name_r} (CC: {cedula_r})"})
                                q.put({"type": "log", "data": f"      Sanción: {sancion}"})
                                findings.append({
                                    "source": "SIRI - Procuraduría",
                                    "name": name_r,
                                    "cedula": cedula_r,
                                    "sanction": sancion,
                                    "raw": r
                                })
                        else:
                            q.put({"type": "log", "data": "[*] Sin registros en SIRI para este nombre."})
                    else:
                        q.put({"type": "log", "data": f"[!] SODA API: código {resp.status_code}"})
                except Exception as e:
                    q.put({"type": "log", "data": f"[!] Error consultando SODA: {str(e)}"})

                # 2. Google Dorks for name
                q.put({"type": "log", "data": ""})
                q.put({"type": "log", "data": "─" * 50})
                q.put({"type": "log", "data": "[*] Generando Google Dorks para nombre completo..."})

                dorks = [
                    {"query": f'"{full_name}"', "description": "Búsqueda exacta del nombre", "url": f"https://www.google.com/search?q=%22{name_encoded}%22"},
                    {"query": f'"{full_name}" site:gov.co', "description": "Portales gubernamentales", "url": f"https://www.google.com/search?q=%22{name_encoded}%22+site%3Agov.co"},
                    {"query": f'"{full_name}" filetype:pdf', "description": "Documentos PDF públicos", "url": f"https://www.google.com/search?q=%22{name_encoded}%22+filetype%3Apdf"},
                    {"query": f'"{full_name}" filetype:xlsx OR filetype:xls OR filetype:csv', "description": "Hojas de cálculo", "url": f"https://www.google.com/search?q=%22{name_encoded}%22+filetype%3Axlsx+OR+filetype%3Axls"},
                    {"query": f'"{full_name}" contrato OR licitación', "description": "Contratación pública", "url": f"https://www.google.com/search?q=%22{name_encoded}%22+contrato+OR+licitaci%C3%B3n"},
                    {"query": f'"{full_name}" site:secop.gov.co', "description": "SECOP contratación", "url": f"https://www.google.com/search?q=%22{name_encoded}%22+site%3Asecop.gov.co"},
                    {"query": f'"{full_name}" site:datos.gov.co', "description": "Datos abiertos", "url": f"https://www.google.com/search?q=%22{name_encoded}%22+site%3Adatos.gov.co"},
                ]

                for i, dork in enumerate(dorks, 1):
                    q.put({"type": "log", "data": f"[+] Dork #{i}: {dork['query']}"})

                # 3. Social media search links
                q.put({"type": "log", "data": ""})
                q.put({"type": "log", "data": "─" * 50})
                q.put({"type": "log", "data": "[*] Generando enlaces de búsqueda en redes sociales..."})

                social_links = [
                    {"platform": "Facebook", "url": f"https://www.facebook.com/search/people/?q={name_encoded}", "icon": "[Social]"},
                    {"platform": "LinkedIn", "url": f"https://www.linkedin.com/search/results/people/?keywords={name_encoded}", "icon": "[Social]"},
                    {"platform": "Instagram", "url": f"https://www.google.com/search?q=site%3Ainstagram.com+%22{name_encoded}%22", "icon": "[Social]"},
                    {"platform": "Twitter/X", "url": f"https://x.com/search?q=%22{name_encoded}%22&f=user", "icon": "[Social]"},
                    {"platform": "TikTok", "url": f"https://www.google.com/search?q=site%3Atiktok.com+%22{name_encoded}%22", "icon": "[Social]"},
                    {"platform": "YouTube", "url": f"https://www.youtube.com/results?search_query=%22{name_encoded}%22", "icon": "[Social]"},
                ]

                for link in social_links:
                    q.put({"type": "log", "data": f"[+] {link['icon']} {link['platform']}: {link['url']}"})

                report = {
                    "suite_module": "ForenSys Name Intelligence",
                    "target_name": full_name,
                    "siri_results": siri_results,
                    "siri_total": len(siri_results),
                    "dorks": dorks,
                    "social_links": social_links,
                    "findings": findings,
                    "report_file": json_path.replace("./", "")
                }
                with open(json_path, "w", encoding="utf-8") as f:
                    json.dump(report, f, indent=4, ensure_ascii=False)

                q.put({"type": "log", "data": ""})
                q.put({"type": "log", "data": "─" * 50})
                q.put({"type": "log", "data": f"[*] Análisis completado. {len(siri_results)} registros SIRI, {len(dorks)} dorks, {len(social_links)} redes sociales."})
                q.put({"type": "report", "data": report})
                q.put(None)
            except Exception as e:
                q.put({"type": "log", "data": f"[-] Error fatal: {str(e)}"})
                q.put(None)

        thread = threading.Thread(target=run_name_scan, daemon=True)
        thread.start()

        while True:
            try:
                item = q.get_nowait()
                if item is None:
                    break
                yield json.dumps(item) + "\n"
            except queue.Empty:
                await asyncio.sleep(0.1)

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")


# ==========================================
# OSINT — REPORT DOWNLOAD
# ==========================================
@app.get("/api/osint/report/{filename}")
def download_osint_report(filename: str):
    from fastapi.responses import FileResponse
    import re
    # Sanitize filename to prevent path traversal
    safe_filename = re.sub(r'[^a-zA-Z0-9_\-.]', '', filename)
    filepath = os.path.join("reports", safe_filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    return FileResponse(filepath, media_type="application/json", filename=safe_filename)


from fastapi.responses import FileResponse
import shutil

@app.get("/api/database/export")
def export_database(current_user: models.User = Depends(get_current_user)):
    db_path = "ciberforense.db"
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail="Database not found")
    return FileResponse(db_path, media_type="application/octet-stream", filename="ciberforense.db")

@app.post("/api/database/import")
def import_database(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user)):
    db_path = "ciberforense.db"
    engine.dispose()
    with open(db_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"ok": True, "message": "Database imported successfully"}

@app.post("/api/tools/ballistics")
def start_ballistics():
    import subprocess
    import sys
    bat_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "tools", "forensys-ballistics", "iniciar.bat"))
    
    if sys.platform == "win32":
        subprocess.Popen(
            ["cmd.exe", "/k", bat_path],
            creationflags=subprocess.CREATE_NEW_CONSOLE
        )
    return {"status": "started"}

# --- SYSTEM INFO ---
@app.get("/api/system/info", response_model=schemas.SystemInfoResponse)
def get_system_info():
    import socket
    import uuid
    import platform
    from datetime import datetime
    
    hostname = socket.gethostname()
    try:
        ip = socket.gethostbyname(hostname)
    except:
        ip = "127.0.0.1"
        
    mac = ':'.join(['{:02x}'.format((uuid.getnode() >> ele) & 0xff) for ele in range(0,8*6,8)][::-1])
    
    return {
        "ip": ip,
        "mac": mac,
        "hostname": hostname,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "platform": platform.platform()
    }

# --- EVIDENCE & CASES ---
import hashlib

@app.post("/api/cases", response_model=schemas.CaseResponse)
def create_case(case: schemas.CaseCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    case_hash = hashlib.md5(f"{time.time()}_{case.case_name}".encode()).hexdigest()[:12]
    
    db_case = models.Case(
        case_name=case.case_name,
        case_hash=case_hash,
        description=case.description,
        created_by=case.created_by or current_user.username
    )
    db.add(db_case)
    db.commit()
    db.refresh(db_case)
    
    os.makedirs(f"static/evidence/{case_hash}", exist_ok=True)
    return db_case

@app.get("/api/cases", response_model=List[schemas.CaseResponse])
def list_cases(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Case).order_by(models.Case.created_at.desc()).all()

@app.get("/api/cases/{case_id}", response_model=schemas.CaseResponse)
def get_case(case_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")
    return db_case

@app.delete("/api/cases/{case_id}")
def delete_case(case_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    case_path = f"static/evidence/{db_case.case_hash}"
    if os.path.exists(case_path):
        import shutil
        shutil.rmtree(case_path)
        
    db.delete(db_case)
    db.commit()
    return {"ok": True, "id": case_id}

@app.post("/api/cases/{case_id}/evidence", response_model=schemas.EvidenceResponse)
def upload_evidence(
    case_id: int, 
    request: Request,
    file: UploadFile = File(...), 
    uploaded_by: str = Form(None),
    notes: str = Form(None),
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    db_case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    content = file.file.read()
    md5_hash = hashlib.md5(content).hexdigest()
    sha256_hash = hashlib.sha256(content).hexdigest()
    
    ext = os.path.splitext(file.filename)[1] or ""
    unique_filename = f"{md5_hash[:8]}{ext}"
    rel_path = f"evidence/{db_case.case_hash}/{unique_filename}"
    abs_path = f"static/{rel_path}"
    
    with open(abs_path, "wb") as f:
        f.write(content)
        
    import mimetypes
    mime_type, _ = mimetypes.guess_type(file.filename)
    
    db_evidence = models.Evidence(
        case_id=db_case.id,
        file_name=unique_filename,
        original_name=file.filename,
        file_path=rel_path,
        file_type=mime_type or "application/octet-stream",
        file_size=len(content),
        md5_hash=md5_hash,
        sha256_hash=sha256_hash,
        uploaded_by=uploaded_by or current_user.username,
        upload_ip=request.client.host if request.client else None,
        notes=notes
    )
    db.add(db_evidence)
    db.commit()
    db.refresh(db_evidence)
    return db_evidence

@app.delete("/api/evidence/{evidence_id}")
def delete_evidence(evidence_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_evidence = db.query(models.Evidence).filter(models.Evidence.id == evidence_id).first()
    if not db_evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
        
    abs_path = f"static/{db_evidence.file_path}"
    if os.path.exists(abs_path):
        os.remove(abs_path)
        
    db.delete(db_evidence)
    db.commit()
    return {"ok": True, "id": evidence_id}

# --- FINGERPRINT COMPARISON ---
import cv2
import numpy as np

@app.post("/api/fingerprint/compare")
async def compare_fingerprints(file1: UploadFile = File(...), file2: UploadFile = File(...)):
    try:
        content1 = await file1.read()
        content2 = await file2.read()
        
        nparr1 = np.frombuffer(content1, np.uint8)
        nparr2 = np.frombuffer(content2, np.uint8)
        
        img1 = cv2.imdecode(nparr1, cv2.IMREAD_GRAYSCALE)
        img2 = cv2.imdecode(nparr2, cv2.IMREAD_GRAYSCALE)
        
        if img1 is None or img2 is None:
            raise HTTPException(status_code=400, detail="Invalid image formats")
            
        orb = cv2.ORB_create()
        
        kp1, des1 = orb.detectAndCompute(img1, None)
        kp2, des2 = orb.detectAndCompute(img2, None)
        
        if des1 is None or des2 is None:
             return {
                "score": 0.0,
                "matched_points": 0,
                "total_points_1": len(kp1),
                "total_points_2": len(kp2),
                "message": "No features detected"
            }
            
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        matches = bf.match(des1, des2)
        matches = sorted(matches, key=lambda x: x.distance)
        good_matches = [m for m in matches if m.distance < 50]
        
        min_keypoints = min(len(kp1), len(kp2))
        score = 0
        if min_keypoints > 0:
            score = (len(good_matches) / min_keypoints) * 100.0
            
        score = min(score, 100.0)
        
        return {
            "score": round(score, 2),
            "matched_points": len(good_matches),
            "total_points_1": len(kp1),
            "total_points_2": len(kp2),
            "message": "Comparison successful"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if not os.path.exists("static"):
    os.makedirs("static")
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
