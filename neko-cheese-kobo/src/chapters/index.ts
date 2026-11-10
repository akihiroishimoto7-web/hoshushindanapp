import { lazy } from 'react';

/** 章ごとに 別ファイルに分けて、必要になったときだけ読みこむ */
export const SCENES = [
  lazy(() => import('./ch1-farm/Scene')),
  lazy(() => import('./ch2-micro/Scene')),
  lazy(() => import('./ch3-curd/Scene')),
  lazy(() => import('./ch4-maker/Scene')),
  lazy(() => import('./ch5-aging/Scene')),
  lazy(() => import('./ch6-shop/Scene')),
];
