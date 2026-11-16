// Phone / device models for "Shop by Model". Products list the models they fit in `models`
// (admin panel → product → Compatible models); names here must match those exactly.

export interface DeviceSeries {
  name: string;
  models: string[];
}

export interface DeviceFamily {
  id: string;
  name: string;
  series: DeviceSeries[];
}

export const deviceFamilies: DeviceFamily[] = [
  {
    id: 'apple-iphone',
    name: 'Apple iPhone',
    series: [
      { name: 'iPhone 17', models: ['iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone Air', 'iPhone 17'] },
      { name: 'iPhone 16', models: ['iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16', 'iPhone 16e'] },
      { name: 'iPhone 15', models: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15'] },
      { name: 'iPhone 14', models: ['iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14'] },
      { name: 'iPhone 13', models: ['iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 mini'] },
    ],
  },
  {
    id: 'samsung-galaxy',
    name: 'Samsung Galaxy',
    series: [
      { name: 'Galaxy S26', models: ['Galaxy S26 Ultra', 'Galaxy S26+', 'Galaxy S26'] },
      { name: 'Galaxy S25', models: ['Galaxy S25 Ultra', 'Galaxy S25 Edge', 'Galaxy S25+', 'Galaxy S25'] },
      { name: 'Galaxy Z', models: ['Galaxy Z Fold 7', 'Galaxy Z Flip 7'] },
      { name: 'Galaxy A', models: ['Galaxy A56', 'Galaxy A36', 'Galaxy A16'] },
    ],
  },
  {
    id: 'google-pixel',
    name: 'Google Pixel',
    series: [{ name: 'Pixel', models: ['Pixel 10 Pro XL', 'Pixel 10 Pro', 'Pixel 10', 'Pixel 9a'] }],
  },
  {
    id: 'xiaomi',
    name: 'Xiaomi & Redmi',
    series: [{ name: 'Xiaomi', models: ['Xiaomi 15', 'Redmi Note 14 Pro', 'Redmi Note 14'] }],
  },
  {
    id: 'airpods',
    name: 'AirPods',
    series: [{ name: 'AirPods', models: ['AirPods Pro 3', 'AirPods Pro 2', 'AirPods 4'] }],
  },
  {
    id: 'apple-watch',
    name: 'Apple Watch',
    series: [{ name: 'Apple Watch', models: ['Apple Watch Ultra 3', 'Apple Watch Series 11', 'Apple Watch SE 3'] }],
  },
];

export const allModels = deviceFamilies.flatMap((f) => f.series.flatMap((s) => s.models));
