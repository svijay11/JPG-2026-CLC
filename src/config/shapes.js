export const SHAPES = [
  {
    id: 'circle',
    name: 'Circle',
    viewBoxWidth: 100,
    viewBoxHeight: 100,
    svgElement: {
      tag: 'circle',
      props: { cx: 0, cy: 0, r: 46 }
    },
    pathType: 'circle',
    sampleImage: '/samples/circle.png',
    description: 'Digital Gold, 2.5″'
  },
  {
    id: 'tall-label',
    name: 'Tall Label',
    viewBoxWidth: 100,
    viewBoxHeight: 100,
    svgElement: {
      tag: 'rect',
      props: { x: -43, y: -45, width: 86, height: 90, rx: 9, ry: 9 }
    },
    pathType: 'roundRect',
    rectParams: [-43, -45, 86, 90, 9],
    sampleImage: '/samples/tall-label.png',
    description: '4CP, 2.5″ × 3.9″'
  },
  {
    id: 'squircle',
    name: 'Squircle',
    viewBoxWidth: 100,
    viewBoxHeight: 100,
    svgElement: {
      tag: 'rect',
      props: { x: -45, y: -47, width: 90, height: 94, rx: 22, ry: 22 }
    },
    pathType: 'roundRect',
    rectParams: [-45, -47, 90, 94, 22],
    sampleImage: '/samples/squircle.png',
    description: '4CP, 3.25″ × 2.75″'
  },

  // ── USER-SUPPLIED TEMPLATES (Centered around 0,0) ──────────────────────────

  {
    id: 'template_page_14_stepped_badge',
    name: 'Stepped Circle Badge / Bracket Label',
    viewBoxWidth: 100,
    viewBoxHeight: 100,
    svgElement: {
      tag: 'path',
      props: {
        d: 'M 0,-42 C 17,-42 31,-31 31,-18 L 36,-18 A 4,4 0 0,1 40,-14 L 40,14 A 4,4 0 0,1 36,18 L 31,18 C 31,31 17,42 0,42 C -17,42 -31,31 -31,18 L -36,18 A 4,4 0 0,1 -40,14 L -40,-14 A 4,4 0 0,1 -36,-18 L -31,-18 C -31,-31 -17,-42 0,-42 Z'
      }
    },
    pathType: 'path2d',
    path: 'M 0,-42 C 17,-42 31,-31 31,-18 L 36,-18 A 4,4 0 0,1 40,-14 L 40,14 A 4,4 0 0,1 36,18 L 31,18 C 31,31 17,42 0,42 C -17,42 -31,31 -31,18 L -36,18 A 4,4 0 0,1 -40,14 L -40,-14 A 4,4 0 0,1 -36,-18 L -31,-18 C -31,-31 -17,-42 0,-42 Z',
    sampleImage: '/samples/stepped-badge.png',
    description: 'Digital Gold, 4.06″ × 4.01″'
  },

  {
    id: 'template_page_12_tapered_shield',
    name: 'Tapered Shield / Trophy Flagon',
    viewBoxWidth: 100,
    viewBoxHeight: 100,
    svgElement: {
      tag: 'path',
      props: {
        d: 'M 0,-40 C 18,-40 24,-33 30,-30 C 29,-28 34,-28 40,-28 L 30,30 C 24,30 22,30 22,33 C 15,39 8,40 0,40 C -8,40 -15,39 -22,33 C -22,30 -24,30 -30,30 L -40,-28 C -34,-28 -29,-28 -30,-30 C -24,-33 -18,-40 0,-40 Z'
      }
    },
    pathType: 'path2d',
    path: 'M 0,-40 C 18,-40 24,-33 30,-30 C 29,-28 34,-28 40,-28 L 30,30 C 24,30 22,30 22,33 C 15,39 8,40 0,40 C -8,40 -15,39 -22,33 C -22,30 -24,30 -30,30 L -40,-28 C -34,-28 -29,-28 -30,-30 C -24,-33 -18,-40 0,-40 Z',
    sampleImage: '/samples/tapered-shield.png',
    description: 'Digital Gold, 3.36″ × 4.13″'
  },

  {
    id: 'template_page_10_crest_wave',
    name: 'Crest Top with S-Wave Bottom',
    viewBoxWidth: 100,
    viewBoxHeight: 100,
    svgElement: {
      tag: 'path',
      props: {
        d: 'M 0,-38 C 7,-38 12,-41 18,-40 C 24,-39 26,-36 27,-34 L 29,-28 C 34,-26 38,-27 40,-23 L 35,28 C 25,35 12,20 0,26 C -12,32 -25,43 -37,33 L -40,-18 C -37,-22 -33,-21 -29,-24 L -27,-30 C -26,-35 -23,-39 -17,-40 C -11,-41 -6,-38 0,-38 Z'
      }
    },
    pathType: 'path2d',
    path: 'M 0,-38 C 7,-38 12,-41 18,-40 C 24,-39 26,-36 27,-34 L 29,-28 C 34,-26 38,-27 40,-23 L 35,28 C 25,35 12,20 0,26 C -12,32 -25,43 -37,33 L -40,-18 C -37,-22 -33,-21 -29,-24 L -27,-30 C -26,-35 -23,-39 -17,-40 C -11,-41 -6,-38 0,-38 Z',
    sampleImage: '/samples/crest-wave.png',
    description: 'Gold Foil, 3.66″ × 3.82″'
  },

  {
    id: 'template_page_8_perfect_baroque_oval',
    name: 'Baroque Scalloped Oval',
    viewBoxWidth: 100,
    viewBoxHeight: 100,
    svgElement: {
      tag: 'path',
      props: {
        d: 'M 0,-41 c 4,0 7,2 10,5 c 4,-2 8,-2 11,1 c 2,3 2,7 4,9 c 3.5,0.5 6.5,2.5 7,6 c 1.5,3.5 -0.5,7.5 0,11 c 2,3.5 4,6.5 4,10 c 0,4.5 -3.5,8 -4,12.5 c 0.5,3.5 2,7 0.5,10.5 c -1,3.5 -4.5,5.5 -7,8 c -1.5,3 -1,7 -4,9.5 c -3,2 -7,1 -10.5,2.5 c -3,3 -6,5 -11,5 c -5,0 -8,-2 -11,-5 c -3.5,-1.5 -7.5,-0.5 -10.5,-2.5 c -3,-2.5 -2.5,-6.5 -4,-9.5 c -2.5,-2.5 -6,-4.5 -7,-8 c -1.5,-3.5 0,-7 0.5,-10.5 c -0.5,-4.5 -4,-8 -4,-12.5 c 0,-3.5 2,-6.5 4,-10 c 0.5,-3.5 -1.5,-7.5 0,-11 c 0.5,-3.5 3.5,-5.5 7,-6 c 2,-2 2,-6 4,-9 c 3,-3 7,-3 11,-1 c 3,-3 6,-5 10,-5 z'
      }
    },
    pathType: 'path2d',
    path: 'M 0,-41 c 4,0 7,2 10,5 c 4,-2 8,-2 11,1 c 2,3 2,7 4,9 c 3.5,0.5 6.5,2.5 7,6 c 1.5,3.5 -0.5,7.5 0,11 c 2,3.5 4,6.5 4,10 c 0,4.5 -3.5,8 -4,12.5 c 0.5,3.5 2,7 0.5,10.5 c -1,3.5 -4.5,5.5 -7,8 c -1.5,3 -1,7 -4,9.5 c -3,2 -7,1 -10.5,2.5 c -3,3 -6,5 -11,5 c -5,0 -8,-2 -11,-5 c -3.5,-1.5 -7.5,-0.5 -10.5,-2.5 c -3,-2.5 -2.5,-6.5 -4,-9.5 c -2.5,-2.5 -6,-4.5 -7,-8 c -1.5,-3.5 0,-7 0.5,-10.5 c -0.5,-4.5 -4,-8 -4,-12.5 c 0,-3.5 2,-6.5 4,-10 c 0.5,-3.5 -1.5,-7.5 0,-11 c 0.5,-3.5 3.5,-5.5 7,-6 c 2,-2 2,-6 4,-9 c 3,-3 7,-3 11,-1 c 3,-3 6,-5 10,-5 z',
    sampleImage: '/samples/baroque-oval.png',
    description: 'Silver Foil, 3″ × 3.7″'
  }
];
