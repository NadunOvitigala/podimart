from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT / ".env", extra="ignore")

    app_name: str = "Podimart"
    jwt_secret: str = "podimart-dev-secret-change-in-production"
    jwt_expire_hours: int = 24 * 14
    storage: str = "local"  # local | dynamodb
    aws_region: str = "ap-south-1"
    table_sellers: str = "podimart-sellers"
    table_products: str = "podimart-products"
    s3_bucket: str = ""
    public_asset_base: str = ""
    upload_dir: Path = ROOT / "uploads"
    data_dir: Path = ROOT / "data"
    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:5174,http://127.0.0.1:5174"
    )


settings = Settings()
settings.upload_dir.mkdir(parents=True, exist_ok=True)
settings.data_dir.mkdir(parents=True, exist_ok=True)
