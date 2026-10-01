from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="investigator")

class Suspect(Base):
    __tablename__ = "suspects"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    identification = Column(String, unique=True, index=True)
    photo_path = Column(String, nullable=True)
    fingerprint_path = Column(String, nullable=True)
    behavior_profile = Column(Text, nullable=True)
    alerts = relationship("Alert", back_populates="suspect")
    face_photos = relationship("FacePhoto", back_populates="suspect", cascade="all, delete-orphan")

class FacePhoto(Base):
    __tablename__ = "face_photos"
    id = Column(Integer, primary_key=True, index=True)
    suspect_id = Column(Integer, ForeignKey("suspects.id"))
    file_path = Column(String, nullable=False)
    angle = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    suspect = relationship("Suspect", back_populates="face_photos")

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    suspect_id = Column(Integer, ForeignKey("suspects.id"))
    detection_type = Column(String)
    location = Column(String, nullable=True)
    details = Column(Text, nullable=True)
    suspect = relationship("Suspect", back_populates="alerts")

class Case(Base):
    __tablename__ = "cases"
    id = Column(Integer, primary_key=True, index=True)
    case_name = Column(String, nullable=False)
    case_hash = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(String, nullable=True)
    status = Column(String, default="abierto")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    evidences = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")

class Evidence(Base):
    __tablename__ = "evidences"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    file_name = Column(String, nullable=False)
    original_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    md5_hash = Column(String, nullable=True)
    sha256_hash = Column(String, nullable=True)
    uploaded_by = Column(String, nullable=True)
    upload_ip = Column(String, nullable=True)
    upload_timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(Text, nullable=True)
    case = relationship("Case", back_populates="evidences")
