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

  // ── USER-SUPPLIED TEMPLATES ────────────────────────────────────────────────

  {
    id: 'template_page_14_stepped_badge',
    name: 'Stepped Circle Badge / Bracket Label',
    viewBoxWidth: 100,
    viewBoxHeight: 100,
    svgElement: {
      tag: 'path',
      props: {
        d: 'M 50,8 C 67,8 81,19 81,32 L 86,32 A 4,4 0 0,1 90,36 L 90,64 A 4,4 0 0,1 86,68 L 81,68 C 81,81 67,92 50,92 C 33,92 19,81 19,68 L 14,68 A 4,4 0 0,1 10,64 L 10,36 A 4,4 0 0,1 14,32 L 19,32 C 19,19 33,8 50,8 Z'
      }
    },
    pathType: 'path2d',
    path: 'M 50,8 C 67,8 81,19 81,32 L 86,32 A 4,4 0 0,1 90,36 L 90,64 A 4,4 0 0,1 86,68 L 81,68 C 81,81 67,92 50,92 C 33,92 19,81 19,68 L 14,68 A 4,4 0 0,1 10,64 L 10,36 A 4,4 0 0,1 14,32 L 19,32 C 19,19 33,8 50,8 Z'
  },

  {
    id: 'template_page_12_tapered_shield',
    name: 'Tapered Shield / Trophy Flagon',
    viewBoxWidth: 100,
    viewBoxHeight: 100,
    svgElement: {
      tag: 'path',
      props: {
        d: 'M 50,10 C 68,10 74,17 80,20 C 79,22 84,22 90,22 L 80,80 C 74,80 72,80 72,83 C 65,89 58,90 50,90 C 42,90 35,89 28,83 C 28,80 26,80 20,80 L 10,22 C 16,22 21,22 20,20 C 26,17 32,10 50,10 Z'
      }
    },
    pathType: 'path2d',
    path: 'M 50,10 C 68,10 74,17 80,20 C 79,22 84,22 90,22 L 80,80 C 74,80 72,80 72,83 C 65,89 58,90 50,90 C 42,90 35,89 28,83 C 28,80 26,80 20,80 L 10,22 C 16,22 21,22 20,20 C 26,17 32,10 50,10 Z'
  },

  {
    id: 'template_page_10_crest_wave',
    name: 'Crest Top with S-Wave Bottom',
    viewBoxWidth: 100,
    viewBoxHeight: 100,
    svgElement: {
      tag: 'path',
      props: {
        d: 'M 50,12 C 57,12 62,9 68,10 C 74,11 76,14 77,16 L 79,22 C 84,24 88,23 90,27 L 85,78 C 75,85 62,70 50,76 C 38,82 25,93 13,83 L 10,32 C 13,28 17,29 21,26 L 23,20 C 24,15 27,11 33,10 C 39,9 44,12 50,12 Z'
      }
    },
    pathType: 'path2d',
    path: 'M 50,12 C 57,12 62,9 68,10 C 74,11 76,14 77,16 L 79,22 C 84,24 88,23 90,27 L 85,78 C 75,85 62,70 50,76 C 38,82 25,93 13,83 L 10,32 C 13,28 17,29 21,26 L 23,20 C 24,15 27,11 33,10 C 39,9 44,12 50,12 Z'
  },

  {
    id: 'template_page_8_perfect_baroque_oval',
    name: 'Baroque Scalloped Oval',
    viewBoxWidth: 100,
    viewBoxHeight: 100,
    svgElement: {
      tag: 'path',
      props: {
        d: 'M 50,12 c 4,0 7,2 10,5 c 4,-2 8,-2 11,1 c 2,3 2,7 4,9 c 3.5,0.5 6.5,2.5 7,6 c 1.5,3.5 -0.5,7.5 0,11 c 2,3.5 4,6.5 4,10 c 0,4.5 -3.5,8 -4,12.5 c 0.5,3.5 2,7 0.5,10.5 c -1,3.5 -4.5,5.5 -7,8 c -1.5,3 -1,7 -4,9.5 c -3,2 -7,1 -10.5,2.5 c -3,3 -6,5 -11,5 c -5,0 -8,-2 -11,-5 c -3.5,-1.5 -7.5,-0.5 -10.5,-2.5 c -3,-2.5 -2.5,-6.5 -4,-9.5 c -2.5,-2.5 -6,-4.5 -7,-8 c -1.5,-3.5 0,-7 0.5,-10.5 c -0.5,-4.5 -4,-8 -4,-12.5 c 0,-3.5 2,-6.5 4,-10 c 0.5,-3.5 -1.5,-7.5 0,-11 c 0.5,-3.5 3.5,-5.5 7,-6 c 2,-2 2,-6 4,-9 c 3,-3 7,-3 11,-1 c 3,-3 6,-5 10,-5 z'
      }
    },
    pathType: 'path2d',
    path: 'M 50,12 c 4,0 7,2 10,5 c 4,-2 8,-2 11,1 c 2,3 2,7 4,9 c 3.5,0.5 6.5,2.5 7,6 c 1.5,3.5 -0.5,7.5 0,11 c 2,3.5 4,6.5 4,10 c 0,4.5 -3.5,8 -4,12.5 c 0.5,3.5 2,7 0.5,10.5 c -1,3.5 -4.5,5.5 -7,8 c -1.5,3 -1,7 -4,9.5 c -3,2 -7,1 -10.5,2.5 c -3,3 -6,5 -11,5 c -5,0 -8,-2 -11,-5 c -3.5,-1.5 -7.5,-0.5 -10.5,-2.5 c -3,-2.5 -2.5,-6.5 -4,-9.5 c -2.5,-2.5 -6,-4.5 -7,-8 c -1.5,-3.5 0,-7 0.5,-10.5 c -0.5,-4.5 -4,-8 -4,-12.5 c 0,-3.5 2,-6.5 4,-10 c 0.5,-3.5 -1.5,-7.5 0,-11 c 0.5,-3.5 3.5,-5.5 7,-6 c 2,-2 2,-6 4,-9 c 3,-3 7,-3 11,-1 c 3,-3 6,-5 10,-5 z'
  }
];
