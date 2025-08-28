from .base import *

DEBUG = True
DATABASES["default"]["NAME"] = BASE_DIR / "test_db.sqlite3"
