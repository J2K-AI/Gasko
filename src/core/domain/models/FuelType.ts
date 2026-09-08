export enum FuelType {
  GASOLINA_95 = 'GASOLINA_95',
  GASOLINA_98 = 'GASOLINA_98',
  GASOLEO_A = 'GASOLEO_A',
  GASOLEO_A_PLUS = 'GASOLEO_A_PLUS',
  GASOLEO_B = 'GASOLEO_B',
  GLP = 'GLP',
  GNC = 'GNC',
  GNL = 'GNL',
  HIDROGENO = 'HIDROGENO',
}

export const FUEL_LABELS: Record<FuelType, string> = {
  [FuelType.GASOLINA_95]: 'Gasolina 95',
  [FuelType.GASOLINA_98]: 'Gasolina 98',
  [FuelType.GASOLEO_A]: 'Diésel',
  [FuelType.GASOLEO_A_PLUS]: 'Diésel Plus',
  [FuelType.GASOLEO_B]: 'Gasóleo B',
  [FuelType.GLP]: 'GLP / Autogas',
  [FuelType.GNC]: 'GNC',
  [FuelType.GNL]: 'GNL',
  [FuelType.HIDROGENO]: 'Hidrógeno',
};

/** Precios por tipo de combustible en €/litro (null = no disponible) */
export type FuelPrices = Partial<Record<FuelType, number | null>>;
