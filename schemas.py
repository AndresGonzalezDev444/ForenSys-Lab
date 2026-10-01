from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str
    role: str = "investigator"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    class Config:
        from_attributes = True

class FacePhotoResponse(BaseModel):
    id: int
    suspect_id: int
    file_path: str
    angle: Optional[str] = None
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class SuspectBase(BaseModel):
    first_name: str
    last_name: str
    identification: str
    behavior_profile: Optional[str] = None

class SuspectCreate(SuspectBase):
    pass

class SuspectResponse(SuspectBase):
    id: int
    photo_path: Optional[str] = None
    fingerprint_path: Optional[str] = None
    face_photos: List[FacePhotoResponse] = []
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# --- Evidence Management Schemas ---

class EvidenceResponse(BaseModel):
    id: int
    case_id: int
    file_name: str
    original_name: str
    file_path: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    md5_hash: Optional[str] = None
    sha256_hash: Optional[str] = None
    uploaded_by: Optional[str] = None
    upload_ip: Optional[str] = None
    upload_timestamp: Optional[datetime] = None
    notes: Optional[str] = None
    class Config:
        from_attributes = True

class CaseCreate(BaseModel):
    case_name: str
    description: Optional[str] = None
    created_by: Optional[str] = None

class CaseResponse(BaseModel):
    id: int
    case_name: str
    case_hash: str
    description: Optional[str] = None
    created_by: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    evidences: List[EvidenceResponse] = []
    class Config:
        from_attributes = True

class SystemInfoResponse(BaseModel):
    ip: str
    mac: str
    hostname: str
    timestamp: str
    platform: str
