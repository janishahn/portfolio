from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    github_username: str = "janishahn"
    openrouter_api_key: str = ""
    openrouter_summary_model: str = "google/gemma-3-27b-it:free"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
