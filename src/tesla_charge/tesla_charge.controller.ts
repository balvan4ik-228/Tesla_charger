import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Render,
} from '@nestjs/common';
import { TeslaChargeService } from './tesla_charge.service';
import type { DrivingMode, DrivingModeView } from './driving-mode.interface';

// Бакет Minio, в котором лежат изображения и видео режимов езды
const MINIO_BUCKET_URL = 'http://localhost:9000/tesla-charge';

@Controller()
export class TeslaChargeController {
  constructor(private readonly teslaChargeService: TeslaChargeService) {}

  // GET /feed, GET /feed/:modeId, GET /feed/:modeId?next=true
  @Get(['feed', 'feed/:modeId'])
  @Render('feed')
  getFeed(@Param('modeId') modeId?: string, @Query('next') next?: string) {
    let drivingMode: DrivingMode | undefined;

    if (modeId === undefined) {
      drivingMode = this.teslaChargeService.getFirstPublishedMode();
    } else {
      const id = Number(modeId);
      if (!Number.isInteger(id)) {
        throw new BadRequestException('Некорректный идентификатор режима езды');
      }
      drivingMode =
        next === 'true'
          ? this.teslaChargeService.getNextPublishedMode(id)
          : this.teslaChargeService.getPublishedModeById(id);
    }

    if (!drivingMode) {
      throw new NotFoundException('Режим езды не найден');
    }

    return {
      title: drivingMode.modeName,
      activeTab: { feed: true },
      mode: this.toView(drivingMode),
    };
  }

  // GET /draft — режим в статусе черновик, без сохранения
  @Get('draft')
  @Render('draft')
  getDraft() {
    const draftMode = this.teslaChargeService.getDraftMode();
    if (!draftMode) {
      throw new NotFoundException('Черновик режима езды не найден');
    }

    return {
      title: 'Новый режим езды',
      activeTab: { draft: true },
      mode: this.toView(draftMode),
    };
  }

  // GET /modes?maxEnergy=20 — плитка с фильтрацией по расходу
  @Get('modes')
  @Render('modes')
  getModes(@Query('maxEnergy') maxEnergy?: string) {
    const parsed = Number(maxEnergy);
    const energyFilter = parsed > 0 ? parsed : undefined;

    const modes = this.teslaChargeService.getPublishedModes(energyFilter);

    return {
      title: 'Режимы езды',
      activeTab: { modes: true },
      // Возвращаем введённое значение, чтобы оно осталось в поле фильтра
      maxEnergy: maxEnergy ?? '',
      modes: modes.map((mode) => this.toView(mode)),
    };
  }

  // Количество лайков и адреса файлов в Minio вычисляются в контроллере
  private toView(mode: DrivingMode): DrivingModeView {
    return {
      id: mode.id,
      modeName: mode.modeName,
      shortDescription: mode.shortDescription,
      averageSpeedKmh: mode.averageSpeedKmh,
      energyPer100Km: mode.energyPer100Km,
      status: mode.status,
      imageUrl: `${MINIO_BUCKET_URL}/${mode.imageKey}`,
      videoUrl: `${MINIO_BUCKET_URL}/${mode.videoKey}`,
      likesCount: mode.likedByDriverIds.length,
    };
  }
}
