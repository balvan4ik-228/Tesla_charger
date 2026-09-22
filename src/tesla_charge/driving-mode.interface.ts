// Статусы режима езды — системное поле, задаётся бэкендом
export enum DrivingModeStatus {
  Draft = 'черновик',
  Published = 'опубликован',
  Deleted = 'удален',
}

// Режим езды Tesla Model S — сущность «услуга» по варианту.
// Все поля атомарные; единственный массив — лайки водителей,
// он разрешён заданием.
export interface DrivingMode {
  id: number;
  modeName: string;
  shortDescription: string;
  averageSpeedKmh: number; // поле по теме: средняя скорость, км/ч
  energyPer100Km: number; // поле по теме: расход, кВт·ч/100 км
  imageKey: string; // ключ изображения в Minio, латиница
  videoKey: string; // ключ видео в Minio, латиница
  status: DrivingModeStatus;
  likedByDriverIds: number[]; // ID водителей, поставивших лайк
}

// Данные, которые контроллер передаёт в шаблон
export interface DrivingModeView {
  id: number;
  modeName: string;
  shortDescription: string;
  averageSpeedKmh: number;
  energyPer100Km: number;
  status: DrivingModeStatus;
  imageUrl: string;
  videoUrl: string;
  likesCount: number;
}
