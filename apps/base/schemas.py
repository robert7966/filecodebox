from pydantic import BaseModel


class SelectFileModel(BaseModel):
    code: str


class InitChunkUploadModel(BaseModel):
    file_name: str
    chunk_size: int = 5 * 1024 * 1024
    file_size: int
    file_hash: str


class CompleteUploadModel(BaseModel):
    expire_value: int
    expire_style: str


class AudioRecordingModel(BaseModel):
    duration: float  # 录音时长（秒）
    format: str = "webm"  # 音频格式
    expire_value: int = 1
    expire_style: str = "day"


class AudioUploadModel(BaseModel):
    name: str = "录音文件"  # 音频文件名
    duration: float  # 录音时长（秒）
    format: str = "webm"  # 音频格式
    expire_value: int = 1
    expire_style: str = "day"
