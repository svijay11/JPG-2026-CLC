export const SHAPES = [
  {
    id: 'circle',
    name: 'Circle',
    viewBoxWidth: 100,
    viewBoxHeight: 100,
    svgElement: {
      tag: 'circle',
      props: { cx: 50, cy: 50, r: 46 }
    },
    pathType: 'circle'
  },
  {
    id: 'tall-label',
    name: 'Tall Label',
    viewBoxWidth: 100,
    viewBoxHeight: 100,
    svgElement: {
      tag: 'rect',
      props: { x: 7, y: 5, width: 86, height: 90, rx: 9, ry: 9 }
    },
    pathType: 'roundRect',
    rectParams: [7, 5, 86, 90, 9]
  },
  {
    id: 'squircle',
    name: 'Squircle',
    viewBoxWidth: 100,
    viewBoxHeight: 100,
    svgElement: {
      tag: 'rect',
      props: { x: 5, y: 3, width: 90, height: 94, rx: 22, ry: 22 }
    },
    pathType: 'roundRect',
    rectParams: [5, 3, 90, 94, 22]
  },
  {
    id: 'ornate-oval',
    name: 'Ornate Oval',
    viewBoxWidth: 100,
    viewBoxHeight: 80,
    svgElement: {
      tag: 'path',
      props: {
        d: `M 50,4
C 55,4 60,8 62,12
C 64,8 68,4 73,4
C 80,4 86,10 86,18
C 90,16 94,18 96,22
C 96,28 92,33 88,35
C 92,40 93,46 91,52
C 89,52 86,54 86,56
C 89,62 88,68 84,73
C 80,73 76,70 74,67
C 71,72 67,76 62,76
C 57,76 53,72 50,68
C 47,72 43,76 38,76
C 33,76 29,72 26,67
C 24,70 20,73 16,73
C 12,68 11,62 14,56
C 14,54 11,52 9,52
C 7,46 8,40 12,35
C 8,33 4,28 4,22
C 6,18 10,16 14,18
C 14,10 20,4 27,4
C 32,4 36,8 38,12
C 40,8 45,4 50,4 Z`
      }
    },
    pathType: 'path2d',
    path: `M 50,4 C 55,4 60,8 62,12 C 64,8 68,4 73,4 C 80,4 86,10 86,18 C 90,16 94,18 96,22 C 96,28 92,33 88,35 C 92,40 93,46 91,52 C 89,52 86,54 86,56 C 89,62 88,68 84,73 C 80,73 76,70 74,67 C 71,72 67,76 62,76 C 57,76 53,72 50,68 C 47,72 43,76 38,76 C 33,76 29,72 26,67 C 24,70 20,73 16,73 C 12,68 11,62 14,56 C 14,54 11,52 9,52 C 7,46 8,40 12,35 C 8,33 4,28 4,22 C 6,18 10,16 14,18 C 14,10 20,4 27,4 C 32,4 36,8 38,12 C 40,8 45,4 50,4 Z`
  },
  {
    id: 'wine-crest',
    name: 'Wine Crest',
    viewBoxWidth: 100,
    viewBoxHeight: 100,
    svgElement: {
      tag: 'path',
      props: {
        d: `M 50,5
C 55,3 65,5 72,8
C 78,6 84,6 88,10
C 94,15 94,22 90,28
C 94,32 96,38 95,44
C 94,52 90,58 86,63
C 82,68 77,72 72,76
C 67,80 62,84 58,88
C 56,90 54,93 50,95
C 46,93 44,90 42,88
C 38,84 33,80 28,76
C 23,72 18,68 14,63
C 10,58 6,52 5,44
C 4,38 6,32 10,28
C 6,22 6,15 12,10
C 16,6 22,6 28,8
C 35,5 45,3 50,5 Z`
      }
    },
    pathType: 'path2d',
    path: `M 50,5 C 55,3 65,5 72,8 C 78,6 84,6 88,10 C 94,15 94,22 90,28 C 94,32 96,38 95,44 C 94,52 90,58 86,63 C 82,68 77,72 72,76 C 67,80 62,84 58,88 C 56,90 54,93 50,95 C 46,93 44,90 42,88 C 38,84 33,80 28,76 C 23,72 18,68 14,63 C 10,58 6,52 5,44 C 4,38 6,32 10,28 C 6,22 6,15 12,10 C 16,6 22,6 28,8 C 35,5 45,3 50,5 Z`
  },
  {
    id: 'classic-shield',
    name: 'Classic Shield',
    viewBoxWidth: 100,
    viewBoxHeight: 110,
    svgElement: {
      tag: 'path',
      props: {
        d: `M 15,8
L 15,12 L 8,12 L 8,18 L 15,18
L 15,22
C 14,35 12,50 10,62
C 8,72 10,82 18,90
C 26,98 38,105 50,107
C 62,105 74,98 82,90
C 90,82 92,72 90,62
C 88,50 86,35 85,22
L 85,18 L 92,18 L 92,12 L 85,12
L 85,8 Z`
      }
    },
    pathType: 'path2d',
    path: `M 15,8 L 15,12 L 8,12 L 8,18 L 15,18 L 15,22 C 14,35 12,50 10,62 C 8,72 10,82 18,90 C 26,98 38,105 50,107 C 62,105 74,98 82,90 C 90,82 92,72 90,62 C 88,50 86,35 85,22 L 85,18 L 92,18 L 92,12 L 85,12 L 85,8 Z`
  },
  {
    id: 'medallion',
    name: 'Medallion',
    viewBoxWidth: 100,
    viewBoxHeight: 100,
    svgElement: {
      tag: 'path',
      props: {
        d: `M 50,5
A 45,45 0 0 1 72,12
L 72,8 L 78,8 L 78,14
A 45,45 0 0 1 95,50
L 92,50 L 92,56 L 78,56
A 45,45 0 0 1 50,95
L 50,92 L 44,92 L 44,78
A 45,45 0 0 1 5,50
L 8,50 L 8,44 L 22,44
A 45,45 0 0 1 50,5 Z`
      }
    },
    pathType: 'path2d',
    path: `M 50,5 A 45,45 0 0 1 72,12 L 72,8 L 78,8 L 78,14 A 45,45 0 0 1 95,50 L 92,50 L 92,56 L 78,56 A 45,45 0 0 1 50,95 L 50,92 L 44,92 L 44,78 A 45,45 0 0 1 5,50 L 8,50 L 8,44 L 22,44 A 45,45 0 0 1 50,5 Z`
  }
];
