import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import {
  TeslaParameter,
  TeslaParameterStatus,
} from './entities/tesla-parameter.entity';
import { CreateTeslaParameterDto } from './dto/create-tesla-parameter.dto';

export interface PublishTeslaParameterData {
  shortDescription: string;
  currentA: number;
  powerW: number;
}

@Injectable()
export class TeslaParametersService {
  constructor(
    @InjectRepository(TeslaParameter)
    private readonly teslaParameterRepository: Repository<TeslaParameter>,
  ) {}

  // ORM: список опубликованных параметров с фильтром по силе тока
  findPublishedParameters(
    minCurrent?: number,
    maxCurrent?: number,
  ): Promise<TeslaParameter[]> {
    return this.teslaParameterRepository.find({
      where: {
        status: TeslaParameterStatus.Published,
        ...this.buildCurrentFilter(minCurrent, maxCurrent),
      },
      relations: { likes: true },
      order: { id: 'ASC' },
    });
  }

  // Двойной слайдер: нижняя и верхняя границы силы тока
  private buildCurrentFilter(minCurrent?: number, maxCurrent?: number) {
    if (minCurrent !== undefined && maxCurrent !== undefined) {
      return { currentA: Between(minCurrent, maxCurrent) };
    }
    if (minCurrent !== undefined) {
      return { currentA: MoreThanOrEqual(minCurrent) };
    }
    if (maxCurrent !== undefined) {
      return { currentA: LessThanOrEqual(maxCurrent) };
    }
    return {};
  }

  // ORM: один опубликованный параметр. Удалённые и черновики не отдаются.
  findPublishedParameterById(id: number): Promise<TeslaParameter | null> {
    return this.teslaParameterRepository.findOne({
      where: { id, status: TeslaParameterStatus.Published },
      relations: { likes: true },
    });
  }

  findFirstPublishedParameter(): Promise<TeslaParameter | null> {
    return this.teslaParameterRepository.findOne({
      where: { status: TeslaParameterStatus.Published },
      relations: { likes: true },
      order: { id: 'ASC' },
    });
  }

  // ORM: следующий опубликованный после id; после последнего — первый
  async findNextPublishedParameter(id: number): Promise<TeslaParameter | null> {
    const next = await this.teslaParameterRepository.findOne({
      where: { status: TeslaParameterStatus.Published, id: MoreThan(id) },
      relations: { likes: true },
      order: { id: 'ASC' },
    });
    return next ?? this.findFirstPublishedParameter();
  }

  // ORM: черновик водителя
  findDraft(creatorId: number): Promise<TeslaParameter | null> {
    return this.teslaParameterRepository.findOne({
      where: { creatorId, status: TeslaParameterStatus.Draft },
    });
  }

  // ORM: создание черновика кнопкой «Далее».
  // Если черновик уже есть — второй не создаётся.
  async createDraft(
    creatorId: number,
    dto: CreateTeslaParameterDto,
  ): Promise<TeslaParameter> {
    const existingDraft = await this.findDraft(creatorId);
    if (existingDraft) {
      return existingDraft;
    }
    const draft = this.teslaParameterRepository.create({
      parameterName: dto.parameterName,
      imageKey: dto.imageKey,
      videoKey: dto.videoKey,
      status: TeslaParameterStatus.Draft,
      creatorId,
    });
    return this.teslaParameterRepository.save(draft);
  }

  // ORM: публикация черновика — заполнение полей и смена статуса
  async publishDraft(
    creatorId: number,
    data: PublishTeslaParameterData,
  ): Promise<TeslaParameter | null> {
    const draft = await this.findDraft(creatorId);
    if (!draft) {
      return null;
    }
    draft.shortDescription = data.shortDescription;
    draft.currentA = data.currentA;
    draft.powerW = data.powerW;
    draft.status = TeslaParameterStatus.Published;
    draft.formedAt = new Date();
    return this.teslaParameterRepository.save(draft);
  }

  // Логическое удаление: сырой SQL UPDATE, без ORM
  async deleteParameterWithSql(id: number): Promise<void> {
    await this.teslaParameterRepository.query(
      `UPDATE tesla_parameters
          SET status = $1
        WHERE id = $2 AND status = $3`,
      [TeslaParameterStatus.Deleted, id, TeslaParameterStatus.Published],
    );
  }
}
