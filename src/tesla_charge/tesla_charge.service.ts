import { Injectable } from '@nestjs/common';
import { DrivingMode, DrivingModeStatus } from './driving-mode.interface';

@Injectable()
export class TeslaChargeService {
  // Коллекция режимов езды. В первой лабораторной БД нет — данные в памяти.
  private readonly drivingModes: DrivingMode[] = [
    {
      id: 1,
      modeName: 'Шоссе 120 км/ч',
      shortDescription:
        'Движение по автомагистрали с постоянной скоростью. Аэродинамическое сопротивление растёт квадратично, поэтому расход на трассе заметно выше городского. Рекуперация почти не работает: торможений мало.',
      averageSpeedKmh: 120,
      energyPer100Km: 22.5,
      imageKey: 'highway_cruise.jpg',
      videoKey: 'highway_cruise.mp4',
      status: DrivingModeStatus.Published,
      likedByDriverIds: [1, 2, 4, 7],
    },
    {
      id: 2,
      modeName: 'Городской цикл с рекуперацией',
      shortDescription:
        'Частые остановки и разгоны на скорости до 60 км/ч. Рекуперативное торможение возвращает в батарею до 20 процентов энергии, поэтому расход в городе минимальный.',
      averageSpeedKmh: 40,
      energyPer100Km: 14.8,
      imageKey: 'city_regen.jpg',
      videoKey: 'city_regen.mp4',
      status: DrivingModeStatus.Published,
      likedByDriverIds: [2, 3],
    },
    {
      id: 3,
      modeName: 'Обогрев салона при минус 15',
      shortDescription:
        'Тепловой насос и обогрев батареи забирают до 4 кВт дополнительно. На коротких зимних поездках доля обогрева в общем расходе доходит до трети.',
      averageSpeedKmh: 90,
      energyPer100Km: 28.4,
      imageKey: 'cabin_heating.jpg',
      videoKey: 'cabin_heating.mp4',
      status: DrivingModeStatus.Published,
      likedByDriverIds: [1, 5, 6],
    },
    {
      id: 4,
      modeName: 'Подогрев сидений и руля',
      shortDescription:
        'Точечный обогрев вместо прогрева всего салона. Потребляет около 0,5 кВт и почти не влияет на запас хода.',
      averageSpeedKmh: 60,
      energyPer100Km: 16.2,
      imageKey: 'seat_heating.jpg',
      videoKey: 'seat_heating.mp4',
      status: DrivingModeStatus.Draft,
      likedByDriverIds: [],
    },
    {
      id: 5,
      modeName: 'Кондиционер при плюс 35',
      shortDescription: 'Охлаждение салона и батареи в жару.',
      averageSpeedKmh: 100,
      energyPer100Km: 24.0,
      imageKey: 'air_conditioning.jpg',
      videoKey: 'air_conditioning.mp4',
      status: DrivingModeStatus.Deleted,
      likedByDriverIds: [3],
    },
  ];

  // Удалённые и черновик в интерфейсе не показываются
  private getPublished(): DrivingMode[] {
    return this.drivingModes.filter(
      (mode) => mode.status === DrivingModeStatus.Published,
    );
  }

  // Плитка: фильтрация по расходу энергии на сервере
  getPublishedModes(maxEnergy?: number): DrivingMode[] {
    const published = this.getPublished();
    if (maxEnergy === undefined) {
      return published;
    }
    return published.filter((mode) => mode.energyPer100Km <= maxEnergy);
  }

  getPublishedModeById(id: number): DrivingMode | undefined {
    return this.getPublished().find((mode) => mode.id === id);
  }

  // Лента из панели вкладок открывается без ID — показываем первый режим
  getFirstPublishedMode(): DrivingMode | undefined {
    return this.getPublished()[0];
  }

  // Следующий опубликованный режим; после последнего — снова первый
  getNextPublishedMode(id: number): DrivingMode | undefined {
    const published = this.getPublished();
    if (published.length === 0) {
      return undefined;
    }
    const index = published.findIndex((mode) => mode.id === id);
    return published[(index + 1) % published.length];
  }

  // Единственный режим в статусе черновик
  getDraftMode(): DrivingMode | undefined {
    return this.drivingModes.find(
      (mode) => mode.status === DrivingModeStatus.Draft,
    );
  }
}
