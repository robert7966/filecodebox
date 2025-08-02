import hashlib
import uuid

from fastapi import APIRouter, Form, UploadFile, File, Depends, HTTPException
from starlette import status

from apps.admin.dependencies import share_required_login
from apps.base.models import FileCodes, UploadChunk
from apps.base.schemas import SelectFileModel, InitChunkUploadModel, CompleteUploadModel, AudioUploadModel
from apps.base.utils import get_expire_info, get_file_path_name, ip_limit, get_chunk_file_path_name, get_audio_file_path_name
from core.response import APIResponse
from core.settings import settings
from core.storage import storages, FileStorageInterface
from core.utils import get_select_token

share_api = APIRouter(prefix="/share", tags=["分享"])


async def validate_file_size(file: UploadFile, max_size: int):
    if file.size > max_size:
        max_size_mb = max_size / (1024 * 1024)
        raise HTTPException(
            status_code=403, detail=f"大小超过限制,最大为{max_size_mb:.2f} MB"
        )


async def create_file_code(code, **kwargs):
    return await FileCodes.create(code=code, **kwargs)


@share_api.post("/text/", dependencies=[Depends(share_required_login)])
async def share_text(
        text: str = Form(...),
        expire_value: int = Form(default=1, gt=0),
        expire_style: str = Form(default="day"),
        code: str = Form(default=None),  # 添加可选的预定义取件码
        ip: str = Depends(ip_limit["upload"]),
):
    text_size = len(text.encode("utf-8"))
    max_txt_size = 222 * 1024
    if text_size > max_txt_size:
        raise HTTPException(status_code=403, detail="内容过多,建议采用文件形式")

    # 如果提供了预定义取件码，验证其是否已存在
    if code and await FileCodes.filter(code=code).exists():
        raise HTTPException(status_code=400, detail="取件码已存在，请重新生成")

    expired_at, expired_count, used_count, code = await get_expire_info(
        expire_value, expire_style, code
    )
    await create_file_code(
        code=code,
        text=text,
        expired_at=expired_at,
        expired_count=expired_count,
        used_count=used_count,
        size=len(text),
        prefix="Text",
    )
    ip_limit["upload"].add_ip(ip)
    return APIResponse(detail={"code": code})


@share_api.post("/file/", dependencies=[Depends(share_required_login)])
async def share_file(
        expire_value: int = Form(default=1, gt=0),
        expire_style: str = Form(default="day"),
        file: UploadFile = File(...),
        code: str = Form(default=None),  # 添加可选的预定义取件码
        ip: str = Depends(ip_limit["upload"]),
):
    await validate_file_size(file, settings.uploadSize)
    if expire_style not in settings.expireStyle:
        raise HTTPException(status_code=400, detail="过期时间类型错误")
    
    # 如果提供了预定义取件码，验证其是否已存在
    if code and await FileCodes.filter(code=code).exists():
        raise HTTPException(status_code=400, detail="取件码已存在，请重新生成")
    
    expired_at, expired_count, used_count, code = await get_expire_info(expire_value, expire_style, code)
    path, suffix, prefix, uuid_file_name, save_path = await get_file_path_name(file)
    file_storage: FileStorageInterface = storages[settings.file_storage]()
    await file_storage.save_file(file, save_path)
    await create_file_code(
        code=code,
        prefix=prefix,
        suffix=suffix,
        uuid_file_name=uuid_file_name,
        file_path=path,
        size=file.size,
        expired_at=expired_at,
        expired_count=expired_count,
        used_count=used_count,
    )
    ip_limit["upload"].add_ip(ip)
    return APIResponse(detail={"code": code, "name": file.filename})


@share_api.post("/audio/", dependencies=[Depends(share_required_login)])
async def share_audio_recording(
    audio_file: UploadFile = File(...),
    name: str = Form(default="录音文件"),
    duration: float = Form(...),
    format: str = Form(default="webm"),
    expire_value: int = Form(default=1, gt=0),
    expire_style: str = Form(default="day"),
    code: str = Form(default=None),  # 添加可选的预定义取件码
    ip: str = Depends(ip_limit["upload"]),
):
    """
    上传音频录制文件
    """
    # 验证音频格式
    allowed_formats = ["webm", "mp3", "wav", "ogg", "m4a"]
    if format.lower() not in allowed_formats:
        raise HTTPException(status_code=400, detail="不支持的音频格式")
    
    # 验证文件大小（音频文件通常比较小，设置合理的限制）
    max_audio_size = min(settings.uploadSize, 50 * 1024 * 1024)  # 最大50MB
    await validate_file_size(audio_file, max_audio_size)
    
    # 验证过期时间类型
    if expire_style not in settings.expireStyle:
        raise HTTPException(status_code=400, detail="过期时间类型错误")
    
    # 如果提供了预定义取件码，验证其是否已存在
    if code and await FileCodes.filter(code=code).exists():
        raise HTTPException(status_code=400, detail="取件码已存在，请重新生成")
    
    # 获取过期信息和生成分享码
    expired_at, expired_count, used_count, code = await get_expire_info(expire_value, expire_style, code)
    
    # 处理音频文件路径和命名
    path, suffix, prefix, uuid_file_name, save_path = await get_audio_file_path_name(
        name, format, duration
    )
    
    # 保存文件到存储系统
    file_storage: FileStorageInterface = storages[settings.file_storage]()
    await file_storage.save_file(audio_file, save_path)
    
    # 创建文件记录，标记为音频类型
    await create_file_code(
        code=code,
        prefix=prefix,
        suffix=suffix,
        uuid_file_name=uuid_file_name,
        file_path=path,
        size=audio_file.size,
        expired_at=expired_at,
        expired_count=expired_count,
        used_count=used_count,
        file_type="audio",  # 标记为音频文件
        metadata={
            "duration": duration,
            "format": format,
            "original_name": name
        }
    )
    
    # 更新IP限制
    ip_limit["upload"].add_ip(ip)
    
    return APIResponse(detail={
        "code": code, 
        "name": f"{name}.{format}",
        "duration": duration,
        "type": "audio"
    })


async def get_code_file_by_code(code, check=True):
    file_code = await FileCodes.filter(code=code).first()
    if not file_code:
        return False, "文件不存在"
    if await file_code.is_expired() and check:
        return False, "文件已过期"
    return True, file_code


async def update_file_usage(file_code):
    file_code.used_count += 1
    if file_code.expired_count > 0:
        file_code.expired_count -= 1
    await file_code.save()


@share_api.get("/select/")
async def get_code_file(code: str, ip: str = Depends(ip_limit["error"])):
    file_storage: FileStorageInterface = storages[settings.file_storage]()
    has, file_code = await get_code_file_by_code(code)
    if not has:
        ip_limit["error"].add_ip(ip)
        return APIResponse(code=404, detail=file_code)

    await update_file_usage(file_code)
    return await file_storage.get_file_response(file_code)


@share_api.post("/select/")
async def select_file(data: SelectFileModel, ip: str = Depends(ip_limit["error"])):
    file_storage: FileStorageInterface = storages[settings.file_storage]()
    has, file_code = await get_code_file_by_code(data.code)
    if not has:
        ip_limit["error"].add_ip(ip)
        return APIResponse(code=404, detail=file_code)

    await update_file_usage(file_code)

    # 为音频文件提供特殊的响应格式
    if file_code.is_audio():
        return APIResponse(
            detail={
                "code": file_code.code,
                "name": file_code.prefix + file_code.suffix,
                "size": file_code.size,
                "type": "audio",
                "duration": file_code.get_duration(),
                "format": file_code.get_audio_format(),
                "text": (
                    file_code.text
                    if file_code.text is not None
                    else await file_storage.get_file_url(file_code)
                ),
            }
        )

    # 为图片文件提供特殊的响应格式
    if file_code.is_image():
        return APIResponse(
            detail={
                "code": file_code.code,
                "name": file_code.prefix + file_code.suffix,
                "size": file_code.size,
                "type": "image",
                "text": (
                    file_code.text
                    if file_code.text is not None
                    else await file_storage.get_file_url(file_code)
                ),
            }
        )

    # 为视频文件提供特殊的响应格式
    if file_code.is_video():
        return APIResponse(
            detail={
                "code": file_code.code,
                "name": file_code.prefix + file_code.suffix,
                "size": file_code.size,
                "type": "video",
                "text": (
                    file_code.text
                    if file_code.text is not None
                    else await file_storage.get_file_url(file_code)
                ),
            }
        )

    # 普通文件的原有逻辑
    return APIResponse(
        detail={
            "code": file_code.code,
            "name": file_code.prefix + file_code.suffix,
            "size": file_code.size,
            "text": (
                file_code.text
                if file_code.text is not None
                else await file_storage.get_file_url(file_code)
            ),
        }
    )


@share_api.get("/download")
async def download_file(key: str, code: str, ip: str = Depends(ip_limit["error"])):
    file_storage: FileStorageInterface = storages[settings.file_storage]()
    if await get_select_token(code) != key:
        ip_limit["error"].add_ip(ip)
    has, file_code = await get_code_file_by_code(code, False)
    if not has:
        return APIResponse(code=404, detail="文件不存在")
    return (
        APIResponse(detail=file_code.text)
        if file_code.text
        else await file_storage.get_file_response(file_code)
    )


chunk_api = APIRouter(prefix="/chunk", tags=["切片"])


@chunk_api.post("/upload/init/", dependencies=[Depends(share_required_login)])
async def init_chunk_upload(data: InitChunkUploadModel):
    # # 秒传检查
    # existing = await FileCodes.filter(file_hash=data.file_hash).first()
    # if existing:
    #     if await existing.is_expired():
    #         file_storage: FileStorageInterface = storages[settings.file_storage](
    #         )
    #         await file_storage.delete_file(existing)
    #         await existing.delete()
    #     else:
    #         return APIResponse(detail={
    #             "code": existing.code,
    #             "existed": True,
    #             "name": f'{existing.prefix}{existing.suffix}'
    #         })

    # 创建上传会话
    upload_id = uuid.uuid4().hex
    total_chunks = (data.file_size + data.chunk_size - 1) // data.chunk_size
    await UploadChunk.create(
        upload_id=upload_id,
        chunk_index=-1,
        total_chunks=total_chunks,
        file_size=data.file_size,
        chunk_size=data.chunk_size,
        chunk_hash=data.file_hash,
        file_name=data.file_name,
    )
    # 获取已上传的分片列表
    uploaded_chunks = await UploadChunk.filter(
        upload_id=upload_id,
        completed=True
    ).values_list('chunk_index', flat=True)
    return APIResponse(detail={
        "existed": False,
        "upload_id": upload_id,
        "chunk_size": data.chunk_size,
        "total_chunks": total_chunks,
        "uploaded_chunks": uploaded_chunks
    })


@chunk_api.post("/upload/chunk/{upload_id}/{chunk_index}", dependencies=[Depends(share_required_login)])
async def upload_chunk(
        upload_id: str,
        chunk_index: int,
        chunk: UploadFile = File(...),
):
    # 获取上传会话信息
    chunk_info = await UploadChunk.filter(upload_id=upload_id, chunk_index=-1).first()
    if not chunk_info:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="上传会话不存在")

    # 检查分片索引有效性
    if chunk_index < 0 or chunk_index >= chunk_info.total_chunks:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="无效的分片索引")

    # 读取分片数据并计算哈希
    chunk_data = await chunk.read()
    chunk_hash = hashlib.sha256(chunk_data).hexdigest()

    # 更新或创建分片记录
    await UploadChunk.update_or_create(
        upload_id=upload_id,
        chunk_index=chunk_index,
        defaults={
            'chunk_hash': chunk_hash,
            'completed': True,
            'file_size': chunk_info.file_size,
            'total_chunks': chunk_info.total_chunks,
            'chunk_size': chunk_info.chunk_size,
            'file_name': chunk_info.file_name
        }
    )
    # 获取文件路径
    _, _, _, _, save_path = await get_chunk_file_path_name(chunk_info.file_name, upload_id)
    # 保存分片到存储
    storage = storages[settings.file_storage]()
    await storage.save_chunk(upload_id, chunk_index, chunk_data, chunk_hash, save_path)
    return APIResponse(detail={"chunk_hash": chunk_hash})


@chunk_api.post("/upload/complete/{upload_id}", dependencies=[Depends(share_required_login)])
async def complete_upload(upload_id: str, data: CompleteUploadModel, ip: str = Depends(ip_limit["upload"])):
    # 获取上传基本信息
    chunk_info = await UploadChunk.filter(upload_id=upload_id, chunk_index=-1).first()
    if not chunk_info:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="上传会话不存在")

    # 如果提供了预定义取件码，验证其是否已存在
    if data.code and await FileCodes.filter(code=data.code).exists():
        raise HTTPException(status_code=400, detail="取件码已存在，请重新生成")

    storage = storages[settings.file_storage]()
    # 验证所有分片
    completed_chunks = await UploadChunk.filter(
        upload_id=upload_id,
        completed=True
    ).count()
    if completed_chunks != chunk_info.total_chunks:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="分片不完整")
    # 获取文件路径
    path, suffix, prefix, _, save_path = await get_chunk_file_path_name(chunk_info.file_name, upload_id)
    # 合并文件并计算哈希
    await storage.merge_chunks(upload_id, chunk_info, save_path)
    # 创建文件记录
    expired_at, expired_count, used_count, code = await get_expire_info(data.expire_value, data.expire_style, data.code)
    await FileCodes.create(
        code=code,
        file_hash=chunk_info.chunk_hash,
        is_chunked=True,
        upload_id=upload_id,
        size=chunk_info.file_size,
        expired_at=expired_at,
        expired_count=expired_count,
        used_count=used_count,
        file_path=path,
        uuid_file_name=f"{prefix}{suffix}",
        prefix=prefix,
        suffix=suffix
    )
    # 清理临时文件
    await storage.clean_chunks(upload_id, save_path)
    return APIResponse(detail={"code": code, "name": chunk_info.file_name})
