import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MinioMediaKeys {
  imageKeys: string[];
  videoKeys: string[];
}

// Читает список объектов бакета Minio, чтобы на странице добавления
// можно было выбрать фото и видео из уже загруженных файлов.
@Injectable()
export class MinioObjectsService {
  private readonly logger = new Logger(MinioObjectsService.name);
  private readonly bucketUrl: string;

  constructor(config: ConfigService) {
    this.bucketUrl = config.get<string>(
      'MINIO_BUCKET_URL',
      'http://localhost:9000/tesla-parameters',
    );
  }

  buildUrl(key: string): string {
    return `${this.bucketUrl}/${key}`;
  }

  async listMediaKeys(): Promise<MinioMediaKeys> {
    const keys = await this.listBucketKeys();
    return {
      imageKeys: keys.filter((key) => /\.(jpg|jpeg|png|webp)$/i.test(key)).sort(),
      videoKeys: keys.filter((key) => /\.(mp4|webm)$/i.test(key)).sort(),
    };
  }

  // Minio отвечает по протоколу S3: список объектов приходит в XML
  private async listBucketKeys(): Promise<string[]> {
    try {
      const response = await fetch(`${this.bucketUrl}/`);
      if (!response.ok) {
        this.logger.warn(`Minio вернул статус ${response.status}`);
        return [];
      }
      const xml = await response.text();
      return Array.from(xml.matchAll(/<Key>([^<]+)<\/Key>/g)).map(
        (match) => match[1],
      );
    } catch (error) {
      this.logger.warn(`Minio недоступен: ${String(error)}`);
      return [];
    }
  }
}
