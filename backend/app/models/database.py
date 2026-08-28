import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class GroupModel(Base):
    __tablename__ = "groups"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    images = relationship("ImageModel", back_populates="group", cascade="all, delete-orphan")
    preference = relationship("PreferenceModel", back_populates="group", uselist=False)


class ImageModel(Base):
    __tablename__ = "images"

    id = Column(String, primary_key=True, index=True)
    group_id = Column(String, ForeignKey("groups.id"), nullable=False, index=True)
    storage_path = Column(String, nullable=True)
    face_score = Column(Float, default=1.0)
    sharpness_score = Column(Float, default=1.0)
    total_score = Column(Float, default=1.0)

    group = relationship("GroupModel", back_populates="images")


class PreferenceModel(Base):
    __tablename__ = "preferences"

    id = Column(String, primary_key=True, index=True)
    group_id = Column(String, ForeignKey("groups.id"), nullable=False, index=True)
    winner_image_id = Column(String, nullable=False)
    loser_image_ids = Column(JSON, default=list)
    is_user_modified = Column(Boolean, default=False)
    zoom_attention_x = Column(Float, nullable=True)
    zoom_attention_y = Column(Float, nullable=True)
    zoom_attention_scale = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    group = relationship("GroupModel", back_populates="preference")
