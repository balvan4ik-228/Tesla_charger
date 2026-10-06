import { TeslaParameterStatus } from './entities/tesla-parameter.entity';

// Данные параметра, которые контроллер передаёт в шаблон
export interface TeslaParameterView {
  id: number;
  parameterName: string;
  shortDescription: string;
  currentA: number | null;
  powerW: number | null;
  status: TeslaParameterStatus;
  imageUrl: string;
  videoUrl: string;
  likesCount: number;
}
