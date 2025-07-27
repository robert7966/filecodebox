# @Time    : 2024/01/01 12:00
# @Author  : Assistant
# @File    : migrations_003.py
# @Software: PyCharm

from tortoise import Tortoise

async def migrate():
    """
    添加音频支持相关字段到FileCodes表
    """
    connection = Tortoise.get_connection("default")
    
    # 添加file_type字段，默认为'file'
    await connection.execute_script("""
        ALTER TABLE filecodes ADD COLUMN file_type VARCHAR(50) DEFAULT 'file';
    """)
    
    # 添加metadata字段用于存储音频元数据
    await connection.execute_script("""
        ALTER TABLE filecodes ADD COLUMN metadata JSON NULL;
    """)
    
    print("Migration 003: Added audio support fields to FileCodes table")

if __name__ == "__main__":
    import asyncio
    from core.database import init_db
    
    async def run_migration():
        await init_db()
        await migrate()
    
    asyncio.run(run_migration()) 