// Background styles constants for the background generator

export const BACKGROUND_STYLES = [
  {
    id: 'beach',
    name: 'Bãi Biển',
    prompt:
      'golden sand dunes with gentle waves washing ashore, crystal clear turquoise water, soft natural sunlight from top-left at 30-degree angle, warm golden hour glow, scattered seashells, gentle medium-intensity shadows stretching right, bokeh water reflections',
    description: 'Bãi biển nhiệt đới với ánh sáng vàng',
    category: 'nature',
    thumbnail: '/assets/styles/beach.jpg',
    popular: true,
  },
  {
    id: 'space',
    name: 'Ngoài Vũ Trụ',
    prompt:
      'deep space nebula with purple and blue cosmic dust clouds, distant twinkling stars scattered across dark void, ethereal galaxy spiral arms, rim lighting from behind, floating asteroid particles, minimal soft shadows, cosmic ray lighting effects',
    description: 'Không gian vũ trụ huyền bí',
    category: 'fantasy',
    thumbnail: '/assets/styles/space.jpg',
    popular: true,
  },
  {
    id: 'cyber',
    name: 'Cyber',
    prompt:
      'neon grid lines pulsating electric blue and magenta, holographic data streams flowing vertically, digital particles floating, LED strip lighting from multiple angles, chrome reflective surfaces, sharp high-contrast shadows, matrix-style code rain effect',
    description: 'Thế giới cyber tương lai',
    category: 'technology',
    thumbnail: '/assets/styles/cyber.jpg',
    popular: true,
  },
  {
    id: 'warm-studio',
    name: 'Studio Ấm Áp',
    prompt:
      'warm golden studio lighting with key light from 45-degree front-left, honey-colored ambient glow, wooden accent panels, vintage brass fixtures, soft fabric draping, gentle medium shadows beneath objects, intimate craftsman workshop atmosphere',
    description: 'Studio với ánh sáng ấm áp',
    category: 'studio',
    thumbnail: '/assets/styles/warm-studio.jpg',
    popular: true,
  },
  {
    id: 'living-room',
    name: 'Phòng Khách Sofa',
    prompt:
      'luxurious velvet sofa in deep emerald green, marble coffee table with gold veining, large windows with afternoon sunlight streaming from right side, fresh flowers in crystal vase, soft natural shadows cast leftward, elegant home ambiance',
    description: 'Phòng khách sang trọng với sofa',
    category: 'interior',
    thumbnail: '/assets/styles/living-room.jpg',
    popular: false,
  },
  {
    id: 'glass-studio',
    name: 'Studio Kính',
    prompt:
      'infinity mirror setup with crystal clear glass panels, multiple reflective surfaces creating depth illusion, circular LED ring lights from above, pristine white acrylic base, geometric pattern reflections, minimal subtle shadows, ultra-clean aesthetic',
    description: 'Studio với hiệu ứng kính phản quang',
    category: 'studio',
    thumbnail: '/assets/styles/glass-studio.jpg',
    popular: false,
  },
  {
    id: 'marble-luxury',
    name: 'Marble Luxury',
    prompt:
      'polished Carrara marble platform with natural veining, rose gold accent lighting strips from beneath, soft pink and white gradient atmosphere, premium cosmetic counter inspiration, gentle uplighting, very light shadow intensity, spa-like serenity',
    description: 'Nền marble sang trọng',
    category: 'luxury',
    thumbnail: '/assets/styles/marble-luxury.jpg',
    popular: true,
  },
  {
    id: 'velvet-texture',
    name: 'Velvet Texture',
    prompt:
      'rich burgundy velvet backdrop with deep fabric folds, brass vintage frames, antique perfume bottles as props, warm amber spotlighting from top-right at 60-degree angle, classical baroque elements, dramatic medium-dark shadows, opulent elegance',
    description: 'Nền nhung sang trọng cổ điển',
    category: 'luxury',
    thumbnail: '/assets/styles/velvet-texture.jpg',
    popular: false,
  },
  {
    id: 'botanical',
    name: 'Botanical Garden',
    prompt:
      'lush green monstera leaves and eucalyptus branches, natural wood shelving with organic curves, soft morning daylight from overhead skylights, earthy terracotta pots, sustainable eco-luxury vibe, soft natural shadow play, fresh botanical setting',
    description: 'Vườn thực vật xanh mát',
    category: 'nature',
    thumbnail: '/assets/styles/botanical.jpg',
    popular: true,
  },
  {
    id: 'crystal-cave',
    name: 'Crystal Cave',
    prompt:
      'translucent crystal formations with prismatic light refraction, amethyst and quartz clusters, mystical purple and white beam lighting from multiple directions, ethereal gemstone sparkle effects, dynamic shadow patterns, magical crystalline atmosphere',
    description: 'Hang động pha lê huyền bí',
    category: 'fantasy',
    thumbnail: '/assets/styles/crystal-cave.jpg',
    popular: false,
  },
];

// Categories for filtering
export const STYLE_CATEGORIES = [
  { id: 'all', name: 'Tất cả', icon: 'solar:gallery-bold' },
  { id: 'studio', name: 'Studio', icon: 'solar:camera-bold' },
  { id: 'nature', name: 'Tự nhiên', icon: 'solar:leaf-bold' },
  { id: 'luxury', name: 'Sang trọng', icon: 'solar:crown-bold' },
  { id: 'technology', name: 'Công nghệ', icon: 'solar:cpu-bolt-bold' },
  { id: 'fantasy', name: 'Huyền bí', icon: 'solar:magic-stick-3-bold' },
  { id: 'interior', name: 'Nội thất', icon: 'solar:home-bold' },
];

// Popular styles (for quick access)
export const POPULAR_STYLES = BACKGROUND_STYLES.filter((style) => style.popular);

// Default style
export const DEFAULT_STYLE = BACKGROUND_STYLES[0]; // Professional Studio
