"""
Run on every new deploy -- Check for any missing tables and create them if needed.
"""
import dotenv

dotenv.load_dotenv()

from database import engine, Base
import models  # importing models registers them with Base so create_all knows about them

print("Creating any missing tables...")
Base.metadata.create_all(engine)

print("Done. Active tables:")
for table in Base.metadata.sorted_tables:
    print(f"  - {table.name}")
