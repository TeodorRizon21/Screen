import rawCarsData from './cars.json';

export interface CarModel {
  model: string;
  generations: string[];
}

export interface CarData {
  make: string;
  models: CarModel[];
}

export const carsData = rawCarsData as CarData[]; 