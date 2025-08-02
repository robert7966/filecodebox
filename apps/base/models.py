# @Time    : 2023/8/13 20:43
# @Author  : Lan
# @File    : models.py
# @Software: PyCharm
from typing import Optional

from tortoise.models import Model
from tortoise.contrib.pydantic import pydantic_model_creator

from tortoise import fields, models
from datetime import datetime
from core.utils import get_now


class FileCodes(models.Model):
    id = fields.IntField(pk=True)
    code = fields.CharField(max_length=255, unique=True, index=True)
    prefix = fields.CharField(max_length=255, default="")
    suffix = fields.CharField(max_length=255, default="")
    uuid_file_name = fields.CharField(max_length=255, null=True)
    file_path = fields.CharField(max_length=255, null=True)
    size = fields.IntField(default=0)
    text = fields.TextField(null=True)
    expired_at = fields.DatetimeField(null=True)
    expired_count = fields.IntField(default=0)
    used_count = fields.IntField(default=0)
    created_at = fields.DatetimeField(auto_now_add=True)
    file_hash = fields.CharField(max_length=64, null=True)
    is_chunked = fields.BooleanField(default=False)
    upload_id = fields.CharField(max_length=36, null=True)
    # 新增音频相关字段
    file_type = fields.CharField(max_length=50, default="file")  # file, audio, text等
    metadata = fields.JSONField(null=True)  # 存储额外的元数据信息

    async def is_expired(self):
        if self.expired_at is None:
            return False
        if self.expired_at and self.expired_count < 0:
            return self.expired_at < await get_now()
        return self.expired_count <= 0

    async def get_file_path(self):
        return f"{self.file_path}/{self.uuid_file_name}"

    def is_audio(self):
        """检查是否为音频文件"""
        return self.file_type == "audio"

    def is_image(self):
        """检查是否为图片文件"""
        if self.file_type == "image":
            return True
        # 通过文件扩展名检测
        if self.suffix:
            image_extensions = [
                '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',
                '.svg', '.ico', '.tiff', '.tif', '.avif', '.heic', '.heif'
            ]
            return self.suffix.lower() in image_extensions
        return False

    def is_video(self):
        """检查是否为视频文件"""
        if self.file_type == "video":
            return True
        # 通过文件扩展名检测
        if self.suffix:
            video_extensions = [
                '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv',
                '.m4v', '.3gp', '.ogv', '.ts', '.mts', '.m2ts'
            ]
            return self.suffix.lower() in video_extensions
        return False

    def get_duration(self):
        """获取音频时长"""
        if self.is_audio() and self.metadata:
            return self.metadata.get("duration", 0)
        return 0

    def get_audio_format(self):
        """获取音频格式"""
        if self.is_audio() and self.metadata:
            return self.metadata.get("format", "webm")
        return None


class UploadChunk(models.Model):
    id = fields.IntField(pk=True)
    upload_id = fields.CharField(max_length=36, index=True)
    chunk_index = fields.IntField()
    chunk_hash = fields.CharField(max_length=64)
    total_chunks = fields.IntField()
    file_size = fields.BigIntField()
    chunk_size = fields.IntField()
    file_name = fields.CharField(max_length=255)
    created_at = fields.DatetimeField(auto_now_add=True)
    completed = fields.BooleanField(default=False)


class KeyValue(Model):
    id: Optional[int] = fields.IntField(pk=True)
    key: Optional[str] = fields.CharField(
        max_length=255, description="键", index=True, unique=True
    )
    value: Optional[str] = fields.JSONField(description="值", null=True)
    created_at: Optional[datetime] = fields.DatetimeField(
        auto_now_add=True, description="创建时间"
    )


file_codes_pydantic = pydantic_model_creator(FileCodes, name="FileCodes")
upload_chunk_pydantic = pydantic_model_creator(UploadChunk, name="UploadChunk")
key_value_pydantic = pydantic_model_creator(KeyValue, name="KeyValue")
