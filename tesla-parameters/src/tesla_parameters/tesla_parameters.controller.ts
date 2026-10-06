import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Redirect,
  Render,
} from '@nestjs/common';
import { TeslaParametersService } from './tesla_parameters.service';
import { MinioObjectsService } from './minio-objects.service';
import { CreateTeslaParameterDto } from './dto/create-tesla-parameter.dto';
import { PublishTeslaParameterDto } from './dto/publish-tesla-parameter.dto';
import { CURRENT_DRIVER_ID } from './current-driver';
import type { TeslaParameter } from './entities/tesla-parameter.entity';
import type { TeslaParameterView } from './tesla-parameter.view';

// Границы двойного слайдера фильтрации по силе тока, А
const CURRENT_SLIDER_MIN = 0;
const CURRENT_SLIDER_MAX = 60;
const CURRENT_SLIDER_STEP = 0.5;

@Controller()
export class TeslaParametersController {
  constructor(
    private readonly teslaParametersService: TeslaParametersService,
    private readonly minioObjectsService: MinioObjectsService,
  ) {}

  // GET /parameter-feed, /parameter-feed/:parameterId, ?next=true
  @Get(['parameter-feed', 'parameter-feed/:parameterId'])
  @Render('parameter-feed')
  async getParameterFeed(
    @Param('parameterId') parameterId?: string,
    @Query('next') next?: string,
  ) {
    let teslaParameter: TeslaParameter | null;

    if (parameterId === undefined) {
      teslaParameter =
        await this.teslaParametersService.findFirstPublishedParameter();
    } else {
      const id = Number(parameterId);
      if (!Number.isInteger(id)) {
        throw new BadRequestException('Некорректный идентификатор параметра');
      }
      teslaParameter =
        next === 'true'
          ? await this.teslaParametersService.findNextPublishedParameter(id)
          : await this.teslaParametersService.findPublishedParameterById(id);
    }

    if (!teslaParameter) {
      throw new NotFoundException('Параметр потребления не найден');
    }

    return {
      title: teslaParameter.parameterName,
      activeTab: { feed: true },
      parameter: this.toView(teslaParameter),
    };
  }

  // GET /parameter-draft — черновик или форма выбора файлов
  @Get('parameter-draft')
  @Render('parameter-draft')
  async getParameterDraft() {
    const draft = await this.teslaParametersService.findDraft(CURRENT_DRIVER_ID);

    // Файлы выбираются из бакета Minio только до нажатия «Далее»
    const mediaKeys = draft
      ? { imageKeys: [], videoKeys: [] }
      : await this.minioObjectsService.listMediaKeys();

    return {
      title: 'Новый параметр потребления',
      activeTab: { draft: true },
      parameter: draft ? this.toView(draft) : null,
      imageKeys: mediaKeys.imageKeys,
      videoKeys: mediaKeys.videoKeys,
    };
  }

  // POST /parameter-draft — кнопка «Далее»
  @Post('parameter-draft')
  @Redirect('/parameter-draft', 302)
  async createParameterDraft(@Body() dto: CreateTeslaParameterDto) {
    const parameterName = (dto.parameterName ?? '').trim();
    const imageKey = (dto.imageKey ?? '').trim();
    const videoKey = (dto.videoKey ?? '').trim();

    if (!parameterName || !imageKey || !videoKey) {
      throw new BadRequestException('Выберите фото, видео и укажите название');
    }
    if (parameterName.length > 100) {
      throw new BadRequestException('Название длиннее 100 символов');
    }

    await this.teslaParametersService.createDraft(CURRENT_DRIVER_ID, {
      parameterName,
      imageKey,
      videoKey,
    });
  }

  // POST /parameter-draft/publish — кнопка «Опубликовать»
  @Post('parameter-draft/publish')
  @Redirect('/parameter-feed', 302)
  async publishParameterDraft(@Body() dto: PublishTeslaParameterDto) {
    const shortDescription = (dto.shortDescription ?? '').trim();
    const currentA = Number(dto.currentA);
    const powerW = Number(dto.powerW);

    if (!shortDescription) {
      throw new BadRequestException('Заполните краткое описание');
    }
    if (!Number.isFinite(currentA) || currentA <= 0 || currentA >= 10000) {
      throw new BadRequestException('Сила тока — число от 0,1 до 9999,9 А');
    }
    if (!Number.isInteger(powerW) || powerW <= 0) {
      throw new BadRequestException('Мощность — целое число больше нуля, Вт');
    }

    const published = await this.teslaParametersService.publishDraft(
      CURRENT_DRIVER_ID,
      { shortDescription, currentA, powerW },
    );
    if (!published) {
      throw new NotFoundException('Черновик параметра не найден');
    }

    // После публикации — сразу в ленту на новую карточку
    return { url: `/parameter-feed/${published.id}` };
  }

  // GET /parameters?minCurrent=5&maxCurrent=30 — плитка с двойным слайдером
  @Get('parameters')
  @Render('parameters')
  async getParameters(
    @Query('minCurrent') minCurrent?: string,
    @Query('maxCurrent') maxCurrent?: string,
  ) {
    const minValue = this.parseSliderValue(minCurrent, CURRENT_SLIDER_MIN);
    const maxValue = this.parseSliderValue(maxCurrent, CURRENT_SLIDER_MAX);

    // Если ползунки перепутаны местами — меняем границы
    const fromCurrent = Math.min(minValue, maxValue);
    const toCurrent = Math.max(minValue, maxValue);

    const parameters =
      await this.teslaParametersService.findPublishedParameters(
        fromCurrent,
        toCurrent,
      );

    return {
      title: 'Параметры потребления',
      activeTab: { parameters: true },
      // Значения возвращаются в слайдер, чтобы фильтр сохранялся после запроса
      minCurrent: fromCurrent,
      maxCurrent: toCurrent,
      sliderMin: CURRENT_SLIDER_MIN,
      sliderMax: CURRENT_SLIDER_MAX,
      sliderStep: CURRENT_SLIDER_STEP,
      parameters: parameters.map((parameter) => this.toView(parameter)),
    };
  }

  // POST /parameters/:parameterId/delete — логическое удаление через SQL UPDATE
  @Post('parameters/:parameterId/delete')
  @Redirect('/parameters', 302)
  async deleteParameter(@Param('parameterId', ParseIntPipe) parameterId: number) {
    await this.teslaParametersService.deleteParameterWithSql(parameterId);
  }

  private parseSliderValue(raw: string | undefined, fallback: number): number {
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return Math.min(Math.max(value, CURRENT_SLIDER_MIN), CURRENT_SLIDER_MAX);
  }

  // Количество лайков и адреса файлов Minio вычисляются в контроллере
  private toView(parameter: TeslaParameter): TeslaParameterView {
    return {
      id: parameter.id,
      parameterName: parameter.parameterName,
      shortDescription: parameter.shortDescription ?? '',
      currentA: parameter.currentA,
      powerW: parameter.powerW,
      status: parameter.status,
      imageUrl: this.minioObjectsService.buildUrl(parameter.imageKey),
      videoUrl: this.minioObjectsService.buildUrl(parameter.videoKey),
      likesCount: parameter.likes?.length ?? 0,
    };
  }
}
