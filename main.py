import os
import shutil
import base64
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Body
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
    import hashlib
    # MOCK OSINT ENGINE FOR V1
    # Simularemos la respuesta de herramientas como Sherlock o Maltego
    query = request.query.lower().strip()
    
    # Nodo Central (El objetivo)
    nodes = [{"id": 1, "label": query, "group": "target", "title": f"Búsqueda Original: {query}"}]
    edges = []
    
    # Generar algunos nodos relacionados basados en un hash simple del query para que sea determinista
    h = int(hashlib.md5(query.encode()).hexdigest()[:8], 16)
    
    # Simular un perfil de correo
    if "@" not in query:
        email = f"{query}{h%100}@gmail.com"
        nodes.append({"id": 2, "label": email, "group": "email", "title": "Correo asociado en brecha de datos"})
        edges.append({"from": 1, "to": 2, "label": "vinculado a"})
    else:
        username = query.split("@")[0]
        nodes.append({"id": 2, "label": username, "group": "alias", "title": "Alias extraído del correo"})
        edges.append({"from": 1, "to": 2, "label": "alias probable"})
        
    # Simular IPs y ubicaciones
    ip1 = f"192.168.{h%255}.{(h//255)%255}"
    nodes.append({"id": 3, "label": ip1, "group": "ip", "title": "Última IP conocida (Foro Hack)"})
    edges.append({"from": 1, "to": 3, "label": "conexión directa"})
    
    # Simular Redes Sociales (Estilo Sherlock)
    nodes.append({"id": 4, "label": "Twitter", "group": "social", "title": "Cuenta activa detectada"})
    edges.append({"from": 1, "to": 4, "label": "perfil encontrado"})
    
    nodes.append({"id": 5, "label": "Github", "group": "social", "title": "Cuenta inactiva detectada"})
    edges.append({"from": 1, "to": 5, "label": "perfil encontrado"})
    
    # Conexión secundaria (Grafo más complejo)
    nodes.append({"id": 6, "label": f"{query}_admin", "group": "alias", "title": "Alias alternativo en la misma IP"})
    edges.append({"from": 3, "to": 6, "label": "comparte IP"})
    
    # Simular un dispositivo
    nodes.append({"id": 7, "label": "MacBook Pro", "group": "device", "title": "User-Agent frecuente"})
    edges.append({"from": 3, "to": 7, "label": "fingerprint"})

    return {
        "status": "success",
        "query": query,
        "graph": {
            "nodes": nodes,
            "edges": edges
        }
    }

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


if not os.path.exists("static"):
    os.makedirs("static")
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
