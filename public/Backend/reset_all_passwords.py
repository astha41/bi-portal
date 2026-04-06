import asyncio
from app.auth import get_password_hash
from app.database import async_session
from app.models import User
from sqlalchemy import select

DEFAULT_PASSWORD = "ChangeMe123!"  # <=72 chars

async def reset_all_passwords():
    async with async_session() as session:
        # Correct async query using SQLAlchemy select
        result = await session.execute(select(User))
        users = result.scalars().all()  # scalars() gives User objects

        if not users:
            print("No users found in the database.")
            return

        for user in users:
            user.hashed_password = get_password_hash(DEFAULT_PASSWORD)
            session.add(user)
            print(f"Password reset for user: {user.username} (id={user.id})")

        await session.commit()
        print(f"\nAll {len(users)} users' passwords reset safely.")

# Run the async function
asyncio.run(reset_all_passwords())