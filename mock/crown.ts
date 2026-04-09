import type { Request, Response } from 'express';

const waitTime = (time: number = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
};

// User model mock data
const userData = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    first_name: 'System',
    last_name: 'Administrator',
    is_active: true,
    is_staff: true,
    department: 'IT',
    role: 'admin',
    created_at: 1704067200,
    last_login: 1705314600,
  },
  {
    id: 2,
    username: 'john_doe',
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    is_active: true,
    is_staff: false,
    department: 'Sales',
    role: 'user',
    created_at: 1704186900,
    last_login: 1705250700,
  },
  {
    id: 3,
    username: 'jane_smith',
    email: 'jane.smith@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
    is_active: true,
    is_staff: true,
    department: 'HR',
    role: 'manager',
    created_at: 1704291600,
    last_login: 1705144200,
  },
  {
    id: 4,
    username: 'bob_wilson',
    email: 'bob.wilson@example.com',
    first_name: 'Bob',
    last_name: 'Wilson',
    is_active: false,
    is_staff: false,
    department: 'Finance',
    role: 'user',
    created_at: 1704357000,
    last_login: 1704906900,
  },
];

// Crown model mock data
const crownData = [
  {
    id: 1,
    name: 'Golden Crown',
    type: 'gold',
    level: 5,
    price: 9999.99,
    is_active: true,
    created_at: 1705314600,
    updated_at: 1705760400,
    rich_description:
      '{"time":1703097600000,"blocks":[{"id":"heading","type":"header","data":{"text":"Golden Crown of Arthur","level":2}},{"id":"intro","type":"paragraph","data":{"text":"This magnificent <strong>Golden Crown of Arthur</strong> represents the pinnacle of medieval craftsmanship."}},{"id":"features-header","type":"header","data":{"text":"Features:","level":3}},{"id":"features-list","type":"list","data":{"style":"unordered","items":["Crafted from <mark>24-karat pure gold</mark>","Adorned with precious gems: <em>diamonds, rubies, emeralds</em>","Historical significance dating back to <u>6th century</u>","Weight: <code>2.5 kg</code>"]}},{"id":"quote","type":"quote","data":{"text":"A truly <em>legendary</em> piece of royal heritage that has witnessed countless coronations.","caption":"Royal Heritage Museum"}},{"id":"note","type":"paragraph","data":{"text":"<strong>Note:</strong> This crown is currently on display at the Royal Museum."}}],"version":"2.28.2"}',
    image_url:
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    owner: 'King Arthur',
    weight: 2.5,
    material: 'pure_gold',
    gems: ['diamond', 'ruby', 'emerald'],
    region: 'Europe',
    status: 'available',
    metadata: {
      certification: 'Royal Heritage Certified',
      appraisal_date: 1704844800,
      insurance_value: 15000000,
      exhibition_history: ['British Museum 2020', 'Louvre 2022', 'Met 2023'],
      condition: 'excellent',
      provenance: {
        original_owner: 'King Arthur',
        year_created: 520,
        documented_since: 1066,
      },
    },
    specifications: {
      dimensions: {
        height_cm: 25,
        diameter_cm: 18,
        circumference_cm: 56.5,
      },
      materials_breakdown: {
        gold_purity: '24k',
        gold_weight_grams: 2100,
        gems_total_carats: 45.5,
      },
      craftsmanship: {
        technique: 'lost-wax casting',
        artisan: 'Master Goldsmith Guild',
        restoration_count: 3,
      },
    },
  },
  {
    id: 2,
    name: 'Diamond Crown',
    type: 'diamond',
    level: 6,
    price: 19999.99,
    is_active: true,
    created_at: 1705396500,
    updated_at: 1705941900,
    rich_description:
      '{"time":1703184000000,"blocks":[{"id":"title","type":"header","data":{"text":"Diamond Crown Excellence","level":2}},{"id":"intro","type":"paragraph","data":{"text":"Exquisite <strong>Diamond Crown</strong> featuring <mark>99 flawless diamonds</mark>."}},{"id":"quote","type":"quote","data":{"text":"A masterpiece of modern royal jewelry design that captures light like no other.","caption":"Chief Designer, Royal Jewelers"}},{"id":"specs-header","type":"header","data":{"text":"Technical Specifications:","level":3}},{"id":"specs-list","type":"list","data":{"style":"ordered","items":["<strong>Diamonds:</strong> 99 premium cut stones","<strong>Setting:</strong> Platinum framework","<strong>Weight:</strong> 1.8 kg","<strong>Design:</strong> Contemporary minimalist approach"]}},{"id":"usage","type":"paragraph","data":{"text":"Perfect for <u>ceremonial occasions</u> and <u>state functions</u>."}}],"version":"2.28.2"}',
    image_url:
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=300&fit=crop',
    owner: 'Queen Elizabeth',
    weight: 1.8,
    material: 'platinum',
    gems: ['diamond'],
    region: 'Britain',
    status: 'reserved',
    metadata: {
      certification: 'GIA Certified',
      appraisal_date: 1705276800,
      insurance_value: 35000000,
      exhibition_history: ['Tower of London 2021', 'Buckingham Palace 2023'],
      condition: 'pristine',
      provenance: {
        original_owner: 'House of Windsor',
        year_created: 1953,
        documented_since: 1953,
      },
    },
    specifications: {
      dimensions: {
        height_cm: 22,
        diameter_cm: 16,
        circumference_cm: 52,
      },
      materials_breakdown: {
        platinum_weight_grams: 1500,
        diamonds_count: 99,
        diamonds_total_carats: 125.8,
        largest_diamond_carats: 15.2,
      },
      craftsmanship: {
        technique: 'precision setting',
        artisan: 'Garrard & Co',
        restoration_count: 0,
      },
    },
  },
  {
    id: 3,
    name: 'Jade Crown',
    type: 'jade',
    level: 4,
    price: 8888.88,
    description: 'Oriental crown carved from finest jade stones',
    is_active: false,
    created_at: 1705504800,
    updated_at: 1706182200,
    owner: 'Emperor Wu',
    weight: 3.2,
    material: 'jade',
    gems: ['jade', 'pearl'],
    region: 'Asia',
    status: 'sold',
    metadata: {
      certification: 'Imperial Palace Museum Verified',
      dynasty: 'Han Dynasty',
      cultural_significance: 'Symbol of Imperial Authority',
      condition: 'good',
    },
    specifications: {
      dimensions: { height_cm: 28, diameter_cm: 20 },
      jade_type: 'Hetian nephrite',
      jade_grade: 'A+',
      pearl_count: 12,
    },
  },
  {
    id: 4,
    name: 'Crystal Crown',
    type: 'crystal',
    level: 3,
    price: 5555.55,
    description:
      'Pure and flawless crystal crown with crystalline transparency',
    is_active: true,
    created_at: 1705579200,
    updated_at: 1706260200,
    owner: 'Ice Queen',
    weight: 1.2,
    material: 'crystal',
    gems: ['crystal'],
    region: 'Arctic',
    status: 'available',
    metadata: {
      source: 'Alpine Crystal Mines',
      clarity: 'flawless',
      special_properties: ['light refraction', 'temperature resistant'],
      storage_requirements: { temperature_c: -10, humidity_percent: 30 },
    },
    specifications: {
      dimensions: { height_cm: 20, diameter_cm: 15 },
      crystal_type: 'quartz',
      facets_count: 256,
      light_transmission: 0.98,
    },
  },
  {
    id: 5,
    name: 'Ruby Crown',
    type: 'ruby',
    level: 5,
    price: 12345.67,
    description: 'Blood-red ruby crown imbued with mysterious powers',
    is_active: true,
    created_at: 1705653900,
    updated_at: 1706361900,
    owner: 'Fire Lord',
    weight: 2.1,
    material: 'gold',
    gems: ['ruby', 'garnet'],
    region: 'Middle East',
    status: 'maintenance',
    metadata: {
      maintenance_reason: 'gem realignment',
      estimated_completion: 1707955200,
      service_provider: 'Royal Jewelers Guild',
    },
    specifications: {
      dimensions: { height_cm: 24, diameter_cm: 17 },
      ruby_count: 48,
      ruby_total_carats: 89.5,
    },
  },
  {
    id: 6,
    name: 'Sapphire Crown',
    type: 'sapphire',
    level: 5,
    price: 11111.11,
    description: 'Deep blue sapphire crown mysterious as the ocean depths',
    is_active: true,
    created_at: 1705761000,
    updated_at: 1706436900,
    owner: 'Sea King',
    weight: 2.3,
    material: 'silver',
    gems: ['sapphire', 'aquamarine'],
    region: 'Oceania',
    status: 'available',
    metadata: {
      origin: 'Pacific Islands',
      legend: 'Said to calm the seas',
      previous_owners: ['Neptune', 'Poseidon', 'Sea King'],
    },
    specifications: {
      dimensions: { height_cm: 23, diameter_cm: 18 },
      sapphire_count: 36,
      aquamarine_count: 24,
    },
  },
  {
    id: 7,
    name: 'Rainbow Crown',
    type: 'rainbow',
    level: 7,
    price: 25000.0,
    description: 'Ultimate crown combining all precious gems in harmony',
    is_active: true,
    created_at: 1705854000,
    updated_at: 1706532000,
    owner: 'Rainbow Monarch',
    weight: 3.5,
    material: 'mythril',
    gems: ['diamond', 'ruby', 'emerald', 'sapphire', 'topaz', 'amethyst'],
    region: 'Fantasy',
    status: 'legendary',
    metadata: {
      rarity: 'unique',
      powers: ['light manipulation', 'harmony blessing', 'spectrum shield'],
      forged_by: 'Ancient Elven Smiths',
      age_years: 10000,
    },
    specifications: {
      dimensions: { height_cm: 30, diameter_cm: 22 },
      gem_distribution: {
        diamond: 12,
        ruby: 8,
        emerald: 8,
        sapphire: 8,
        topaz: 6,
        amethyst: 6,
      },
      total_carats: 250,
      mythril_purity: 0.999,
    },
  },
  {
    id: 8,
    name: 'Antique Crown',
    type: 'antique',
    level: 4,
    price: 7777.77,
    description: 'Ancient crown with a thousand years of history',
    is_active: false,
    created_at: 1705921800,
    updated_at: 1706630100,
    owner: 'Ancient Emperor',
    weight: 4.0,
    material: 'bronze',
    gems: ['turquoise', 'lapis'],
    region: 'Ancient',
    status: 'museum',
  },
];

// Crown History model mock data
const crownHistoryData = [
  {
    id: 1,
    crown_id: 1,
    event_type: 'created',
    description: 'Crown was forged by master craftsman in the royal forge',
    event_date: 1705314600,
    created_at: 1705314600,
    updated_at: 1705314600,
  },
  {
    id: 2,
    crown_id: 1,
    event_type: 'transferred',
    description: 'Crown transferred to King Arthur during coronation ceremony',
    event_date: 1705413600,
    created_at: 1705413600,
    updated_at: 1705413600,
  },
  {
    id: 3,
    crown_id: 1,
    event_type: 'maintenance',
    description: 'Regular maintenance and gem polishing performed',
    event_date: 1705742100,
    created_at: 1705742100,
    updated_at: 1705742100,
  },
  {
    id: 4,
    crown_id: 2,
    event_type: 'created',
    description: 'Diamond Crown crafted with 99 premium diamonds',
    event_date: 1705396500,
    created_at: 1705396500,
    updated_at: 1705396500,
  },
  {
    id: 5,
    crown_id: 2,
    event_type: 'reserved',
    description: 'Crown reserved for Queen Elizabeth special ceremony',
    event_date: 1705923000,
    created_at: 1705923000,
    updated_at: 1705923000,
  },
  {
    id: 6,
    crown_id: 3,
    event_type: 'created',
    description: 'Jade Crown carved from ancient jade stone',
    event_date: 1705481100,
    created_at: 1705481100,
    updated_at: 1705481100,
  },
  {
    id: 7,
    crown_id: 3,
    event_type: 'appraised',
    description: 'Crown appraised by jade expert, confirmed authenticity',
    event_date: 1705591200,
    created_at: 1705591200,
    updated_at: 1705591200,
  },
  {
    id: 8,
    crown_id: 4,
    event_type: 'created',
    description: 'Silver Crown forged with traditional techniques',
    event_date: 1705579200,
    created_at: 1705579200,
    updated_at: 1705579200,
  },
  {
    id: 9,
    crown_id: 4,
    event_type: 'sold',
    description: 'Crown sold to Noble House collector',
    event_date: 1705833900,
    created_at: 1705833900,
    updated_at: 1705833900,
  },
  {
    id: 10,
    crown_id: 5,
    event_type: 'created',
    description: 'Crystal Crown crafted with rare magical crystals',
    event_date: 1705681800,
    created_at: 1705681800,
    updated_at: 1705681800,
  },
  {
    id: 11,
    crown_id: 1,
    event_type: 'inspection',
    description: 'Annual quality inspection completed successfully',
    event_date: 1706191200,
    created_at: 1706191200,
    updated_at: 1706191200,
  },
  {
    id: 12,
    crown_id: 2,
    event_type: 'exhibition',
    description: 'Crown displayed in Royal Heritage Exhibition',
    event_date: 1706263200,
    created_at: 1706263200,
    updated_at: 1706263200,
  },
];

// Crown Tags model mock data (m2m relation)
const crownTagsData = [
  { id: 1, name: 'luxury', description: 'High-end luxury items' },
  { id: 2, name: 'antique', description: 'Historical antique pieces' },
  { id: 3, name: 'royal', description: 'Royal collection items' },
  { id: 4, name: 'ceremonial', description: 'Used in ceremonies' },
  { id: 5, name: 'decorative', description: 'Decorative purposes only' },
  { id: 6, name: 'museum', description: 'Museum exhibition pieces' },
  { id: 7, name: 'rare', description: 'Rare and unique items' },
  { id: 8, name: 'valuable', description: 'High monetary value' },
];

// Crown tag relations data (中间表数据)
const crownTagRelationsData = [
  {
    id: 1,
    crown_id: 1,
    tag_id: 1, // Crown 1 has luxury tag
    created_at: 1704067200,
  },
  {
    id: 2,
    crown_id: 1,
    tag_id: 3, // Crown 1 has royal tag
    created_at: 1704067200,
  },
  {
    id: 3,
    crown_id: 2,
    tag_id: 2, // Crown 2 has antique tag
    created_at: 1704067200,
  },
  {
    id: 4,
    crown_id: 2,
    tag_id: 4, // Crown 2 has ceremonial tag
    created_at: 1704067200,
  },
  {
    id: 5,
    crown_id: 3,
    tag_id: 5, // Crown 3 has decorative tag
    created_at: 1704067200,
  },
];

// Crown Certificates model mock data (fk relation)
const crownCertificatesData = [
  {
    id: 1,
    crown_id: 1,
    certificate_type: 'authenticity',
    issuer: 'Royal Authentication Society',
    issue_date: 1705312800,
    expiry_date: 1768471200,
    certificate_number: 'RAS-2024-001',
    status: 'active',
  },
  {
    id: 2,
    crown_id: 1,
    certificate_type: 'appraisal',
    issuer: 'International Gem Institute',
    issue_date: 1705415400,
    expiry_date: 1737037800,
    certificate_number: 'IGI-2024-001',
    status: 'active',
  },
  {
    id: 3,
    crown_id: 2,
    certificate_type: 'authenticity',
    issuer: 'Royal Authentication Society',
    issue_date: 1705482000,
    expiry_date: 1768640400,
    certificate_number: 'RAS-2024-002',
    status: 'active',
  },
  {
    id: 4,
    crown_id: 3,
    certificate_type: 'heritage',
    issuer: 'Heritage Preservation Council',
    issue_date: 1705575600,
    expiry_date: 1863428400,
    certificate_number: 'HPC-2024-001',
    status: 'active',
  },
];

// Crown Insurance model mock data (o2o relation)
const crownInsuranceData = [
  {
    id: 1,
    crown_id: 1,
    policy_number: 'POL-2024-001',
    insurance_company: 'Royal Heritage Insurance Co.',
    coverage_amount: 15000000.0,
    premium_amount: 25000.0,
    start_date: 1704067200,
    end_date: 1735689599,
    policy_type: 'comprehensive',
    status: 'active',
  },
  {
    id: 2,
    crown_id: 2,
    policy_number: 'POL-2024-002',
    insurance_company: 'Premium Artifacts Insurance',
    coverage_amount: 25000000.0,
    premium_amount: 45000.0,
    start_date: 1704067200,
    end_date: 1735689599,
    policy_type: 'comprehensive',
    status: 'active',
  },
  {
    id: 3,
    crown_id: 3,
    policy_number: 'POL-2024-003',
    insurance_company: 'Heritage Protection Insurance',
    coverage_amount: 8000000.0,
    premium_amount: 15000.0,
    start_date: 1704067200,
    end_date: 1735689599,
    policy_type: 'basic',
    status: 'active',
  },
];

const crownModelDesc = {
  fields: {
    id: {
      field_type: 'IntegerField' as const,
      readonly: true,
      show: true,
      blank: false,
      choices: [],
      help_text: 'Unique identifier for the crown',
      default: null,
      name: 'ID',
    },
    name: {
      field_type: 'CharField' as const,
      readonly: false,
      show: true,
      blank: false,
      choices: [],
      help_text: 'Name of the crown',
      default: '',
      name: 'Name',
    },
    type: {
      field_type: 'CharField' as const,
      readonly: false,
      show: true,
      blank: false,
      choices: [
        ['gold', 'Gold'],
        ['diamond', 'Diamond'],
        ['jade', 'Jade'],
        ['crystal', 'Crystal'],
        ['ruby', 'Ruby'],
        ['sapphire', 'Sapphire'],
        ['rainbow', 'Rainbow'],
        ['antique', 'Antique'],
      ],
      help_text: 'Type of the crown',
      default: 'gold',
      name: 'Type',
    },
    level: {
      field_type: 'IntegerField' as const,
      readonly: false,
      show: false,
      blank: false,
      choices: [
        [1, 'Common'],
        [2, 'Excellent'],
        [3, 'Rare'],
        [4, 'Epic'],
        [5, 'Legendary'],
        [6, 'Mythic'],
        [7, 'Supreme'],
      ],
      help_text: 'Level of the crown (1-7)',
      default: 1,
      name: 'Level',
    },
    price: {
      field_type: 'FloatField' as const,
      readonly: false,
      show: true,
      blank: false,
      choices: [],
      help_text: 'Price of the crown',
      default: 0.0,
      name: 'Price',
    },
    description: {
      field_type: 'TextField' as const,
      readonly: false,
      show: true,
      blank: true,
      choices: [],
      help_text: 'Detailed description of the crown',
      default: '',
      name: 'Description',
    },
    is_active: {
      field_type: 'BooleanField' as const,
      readonly: false,
      show: true,
      blank: false,
      choices: [],
      help_text: 'Whether the crown is active',
      default: true,
      name: 'Active Status',
    },
    created_at: {
      field_type: 'DatetimeField' as const,
      readonly: true,
      show: true,
      blank: false,
      choices: [],
      help_text: 'Creation time',
      default: null,
      name: 'Created At',
    },
    updated_at: {
      field_type: 'DatetimeField' as const,
      readonly: true,
      show: true,
      blank: false,
      choices: [],
      help_text: 'Last update time',
      default: null,
      name: 'Updated At',
    },
    rich_description: {
      field_type: 'EditorField' as const,
      readonly: false,
      show: true,
      blank: true,
      choices: [],
      help_text: 'Detailed description with rich text formatting',
      default: '',
      name: 'Rich Description',
    },
    image_url: {
      field_type: 'ImageField' as const,
      readonly: false,
      show: true,
      blank: true,
      choices: [],
      help_text: 'Crown image URL for display',
      default: '',
      name: 'Crown Image',
    },
    owner: {
      field_type: 'CharField' as const,
      readonly: false,
      show: true,
      blank: true,
      choices: [],
      help_text: 'Owner of the crown',
      default: '',
      name: 'Owner',
    },
    weight: {
      field_type: 'FloatField' as const,
      readonly: false,
      show: true,
      blank: false,
      choices: [],
      help_text: 'Weight of the crown (in kg)',
      default: 0.0,
      name: 'Weight',
    },
    material: {
      field_type: 'CharField' as const,
      readonly: false,
      show: true,
      blank: false,
      choices: [
        ['gold', 'Gold'],
        ['silver', 'Silver'],
        ['platinum', 'Platinum'],
        ['bronze', 'Bronze'],
        ['jade', 'Jade'],
        ['crystal', 'Crystal'],
        ['mythril', 'Mythril'],
      ],
      help_text: 'Primary material of the crown',
      default: 'gold',
      name: 'Material',
    },
    region: {
      field_type: 'CharField' as const,
      readonly: false,
      show: true,
      blank: true,
      choices: [
        ['Europe', 'Europe'],
        ['Asia', 'Asia'],
        ['Africa', 'Africa'],
        ['America', 'America'],
        ['Oceania', 'Oceania'],
        ['Arctic', 'Arctic'],
        ['Middle East', 'Middle East'],
        ['Ancient', 'Ancient'],
        ['Fantasy', 'Fantasy'],
      ],
      help_text: 'Region of origin',
      default: '',
      name: 'Region',
    },
    status: {
      field_type: 'CharField' as const,
      readonly: false,
      show: true,
      blank: false,
      choices: [
        ['available', 'Available'],
        ['reserved', 'Reserved'],
        ['sold', 'Sold'],
        ['maintenance', 'Maintenance'],
        ['museum', 'Museum'],
        ['legendary', 'Legendary'],
      ],
      help_text: 'Current status of the crown',
      default: 'available',
      name: 'Status',
    },
    metadata: {
      field_type: 'JsonField' as const,
      readonly: false,
      show: true,
      blank: true,
      choices: [],
      help_text:
        'Additional metadata in JSON format (e.g. dimensions, certifications)',
      default: null,
      name: 'Metadata',
    },
    specifications: {
      field_type: 'JsonField' as const,
      readonly: false,
      show: true,
      blank: true,
      choices: [],
      help_text: 'Technical specifications (dimensions, materials breakdown)',
      default: null,
      name: 'Specifications',
    },
  },
  actions: {
    // Empty input + Toast output - 直接执行并显示消息
    activate: {
      name: 'activate',
      label: 'Activate Crowns',
      output: 'toast',
      input: 'empty',
      confirm: true,
      description: 'Activate selected crowns',
      batch: true,
      extra: {},
    },
    deactivate: {
      name: 'deactivate',
      label: 'Deactivate Crowns',
      output: 'toast',
      input: 'empty',
      confirm: true,
      description: 'Deactivate selected crowns',
      batch: true,
      extra: {},
    },

    // Display output action - 显示表格数据
    view_details: {
      name: 'view_details',
      label: 'View Details',
      output: 'display',
      input: 'empty',
      confirm: false,
      description: 'View detailed information',
      batch: false,
      extra: {},
    },

    // String input + Toast output - 需要输入内容
    add_note: {
      name: 'add_note',
      label: 'Add Note',
      output: 'toast',
      input: 'string',
      confirm: false,
      description: 'Add a maintenance note to selected crowns',
      batch: false,
      extra: {},
    },
    set_owner: {
      name: 'set_owner',
      label: 'Change Owner',
      output: 'refresh',
      input: 'string',
      confirm: true,
      description: 'Change the owner of selected crowns',
      batch: true,
      extra: {},
    },

    // File input + Toast output - 需要上传文件
    upload_certificate: {
      name: 'upload_certificate',
      label: 'Upload Certificate',
      output: 'toast',
      input: 'file',
      confirm: false,
      description: 'Upload authenticity certificate for this crown',
      batch: false,
      extra: {},
    },

    // Empty input + Download output - 生成并下载文件
    export_excel: {
      name: 'export_excel',
      label: 'Export to Excel',
      output: 'download',
      input: 'empty',
      confirm: false,
      description: 'Export selected crowns data to Excel file',
      batch: true,
      extra: {},
    },
    export_pdf: {
      name: 'export_pdf',
      label: 'Export Report',
      output: 'download',
      input: 'string',
      confirm: false,
      description: 'Generate and download detailed report',
      batch: true,
      extra: {},
    },

    // Empty input + Table output - 显示分析结果
    analyze_value: {
      name: 'analyze_value',
      label: 'Value Analysis',
      output: 'display',
      input: 'empty',
      confirm: false,
      description: 'Analyze the market value of selected crowns',
      batch: true,
      extra: {},
    },

    // File input + Table output - 上传文件并显示分析结果
    upload_and_analyze: {
      name: 'upload_and_analyze',
      label: 'Upload & Analyze',
      output: 'display',
      input: 'file',
      confirm: false,
      description: 'Upload appraisal documents and get analysis results',
      batch: false,
      extra: {},
    },

    // Empty input + Refresh output - 执行后刷新页面
    recalculate_stats: {
      name: 'recalculate_stats',
      label: 'Recalculate Statistics',
      output: 'refresh',
      input: 'empty',
      confirm: true,
      description: 'Recalculate all crown statistics and market values',
      batch: true,
      extra: {},
    },
  },
  attrs: {
    help_text:
      'Crown Management System - Manage various types of crown information\nCrown Management System - Manage various types of crown information\nCrown Management System - Manage various types of crown information\nCrown Management System - Manage various types of crown information\nCrown Management System - Manage various types of crown information',
    can_search: true,
    can_add: true,
    can_delete: true,
    can_edit: true,
    list_per_page: 20,
    list_per_page_options: [10, 20, 50, 100, 200, 500, 1000],
    search_fields: ['name', 'type', 'owner', 'status', 'created_at'],
    search_range_fields: ['price', 'weight', 'created_at', 'updated_at'],
    list_sort: ['id', 'name', 'price', 'level', 'created_at', 'updated_at'],
    list_order: ['created_at', 'updated_at'],
    list_editable: ['name', 'type', 'price', 'owner', 'status'],
    list_filter: ['type', 'status', 'is_active', 'material', 'region'],
    list_search: ['name', 'owner'],
    list_display: [
      'id',
      'name',
      'type',
      'price',
      'owner',
      'status',
      'is_active',
      'created_at',
      'updated_at',
    ],
    detail_display: [
      'id',
      'name',
      'type',
      'level',
      'price',
      'description',
      'owner',
      'weight',
      'material',
      'region',
      'status',
      'is_active',
      'created_at',
      'updated_at',
    ],
    detail_order: ['owner', 'status', 'is_active'],
    detail_editable: ['type', 'price'],
  },
};

// User model description with comprehensive actions
const userModelDesc = {
  fields: {
    id: {
      field_type: 'IntegerField' as const,
      readonly: true,
      show: true,
      blank: false,
      choices: [],
      help_text: 'User ID',
      default: null,
      name: 'ID',
    },
    username: {
      field_type: 'CharField' as const,
      readonly: false,
      show: true,
      blank: false,
      choices: [],
      help_text: 'Username',
      default: null,
      name: 'Username',
    },
    email: {
      field_type: 'CharField' as const,
      readonly: false,
      show: true,
      blank: false,
      choices: [],
      help_text: 'Email address',
      default: null,
      name: 'Email',
    },
    first_name: {
      field_type: 'CharField' as const,
      readonly: false,
      show: true,
      blank: true,
      choices: [],
      help_text: 'First name',
      default: null,
      name: 'First Name',
    },
    last_name: {
      field_type: 'CharField' as const,
      readonly: false,
      show: true,
      blank: true,
      choices: [],
      help_text: 'Last name',
      default: null,
      name: 'Last Name',
    },
    is_active: {
      field_type: 'BooleanField' as const,
      readonly: false,
      show: true,
      blank: false,
      choices: [],
      help_text: 'Active status',
      default: true,
      name: 'Active',
    },
    is_staff: {
      field_type: 'BooleanField' as const,
      readonly: false,
      show: true,
      blank: false,
      choices: [],
      help_text: 'Staff status',
      default: false,
      name: 'Staff',
    },
    department: {
      field_type: 'CharField' as const,
      readonly: false,
      show: true,
      blank: true,
      choices: [
        ['IT', 'Information Technology'],
        ['HR', 'Human Resources'],
        ['Sales', 'Sales'],
        ['Finance', 'Finance'],
      ],
      help_text: 'Department',
      default: null,
      name: 'Department',
    },
    role: {
      field_type: 'CharField' as const,
      readonly: false,
      show: true,
      blank: false,
      choices: [
        ['admin', 'Administrator'],
        ['manager', 'Manager'],
        ['user', 'Regular User'],
      ],
      help_text: 'User role',
      default: 'user',
      name: 'Role',
    },
    created_at: {
      field_type: 'DatetimeField' as const,
      readonly: true,
      show: true,
      blank: false,
      choices: [],
      help_text: 'User creation time',
      default: null,
      name: 'Created At',
    },
    last_login: {
      field_type: 'DatetimeField' as const,
      readonly: true,
      show: true,
      blank: true,
      choices: [],
      help_text: 'Last login time',
      default: null,
      name: 'Last Login',
    },
  },
  actions: {
    // String input + Toast output
    send_message: {
      name: 'send_message',
      label: 'Send Message',
      output: 'toast',
      input: 'string',
      confirm: false,
      description: 'Send a message to selected users',
      batch: true,
      extra: {},
    },

    // File input + Toast output
    upload_avatar: {
      name: 'upload_avatar',
      label: 'Upload Avatar',
      output: 'toast',
      input: 'file',
      confirm: false,
      description: 'Upload profile picture',
      batch: false,
      extra: {},
    },

    // Empty input + Download output
    export_users: {
      name: 'export_users',
      label: 'Export Users',
      output: 'download',
      input: 'empty',
      confirm: false,
      description: 'Export user data to Excel',
      batch: true,
      extra: {},
    },

    // String input + Download output
    generate_report: {
      name: 'generate_report',
      label: 'Generate Report',
      output: 'download',
      input: 'string',
      confirm: false,
      description: 'Generate custom user report',
      batch: true,
      extra: {},
    },

    // Empty input + Table output
    analyze_users: {
      name: 'analyze_users',
      label: 'Analyze Users',
      output: 'display',
      input: 'empty',
      confirm: false,
      description: 'Analyze user statistics',
      batch: true,
      extra: {},
    },

    // File input + Table output
    import_analysis: {
      name: 'import_analysis',
      label: 'Import & Analyze',
      output: 'display',
      input: 'file',
      confirm: false,
      description: 'Import and analyze user data',
      batch: true,
      extra: {},
    },

    // Empty input + Refresh output
    reset_passwords: {
      name: 'reset_passwords',
      label: 'Reset Passwords',
      output: 'refresh',
      input: 'empty',
      confirm: true,
      description: 'Reset user passwords',
      batch: true,
      extra: {},
    },

    // String input + Refresh output
    change_department: {
      name: 'change_department',
      label: 'Change Department',
      output: 'refresh',
      input: 'string',
      confirm: true,
      description: 'Change user department',
      batch: true,
      extra: {},
    },
  },
  attrs: {
    help_text: 'User Management - Complete action examples',
    can_search: true,
    can_add: true,
    can_delete: true,
    can_edit: true,
    list_per_page: 20,
    list_per_page_options: [10, 20, 50, 100, 200, 500, 1000],
    search_fields: ['username', 'email'],
    search_range_fields: ['created_at', 'last_login'],
    list_sort: ['id', 'username', 'created_at'],
    list_order: ['-id'],
    list_filter: ['is_active', 'is_staff', 'department', 'role'],
    list_search: ['username', 'email'],
    list_display: [
      'id',
      'username',
      'email',
      'is_active',
      'is_staff',
      'department',
      'role',
      'created_at',
    ],
    detail_display: [
      'id',
      'username',
      'email',
      'first_name',
      'last_name',
      'is_active',
      'is_staff',
      'department',
      'role',
    ],
  },
};

// Crown actions处理函数
const handleCrownActions = async (
  _req: Request,
  res: Response,
  action: string,
  form_data: any,
  input_data: any,
  search_condition: any[],
) => {
  // 模拟根据条件计算影响的记录数
  const getAffectedCount = () => {
    if (!search_condition || search_condition.length === 0)
      return crownData.length;

    // 简单模拟：根据条件类型返回不同数量
    const hasIdCondition = search_condition.some((c: any) => c.field === 'id');
    if (hasIdCondition) return 1;

    // 其他条件模拟返回部分记录
    return Math.floor(crownData.length * 0.3);
  };

  const affectedCount = getAffectedCount();

  // 根据不同action返回不同类型的响应
  let result: any = null;
  let responseMessage = 'success';

  switch (action) {
    // Toast output actions
    case 'activate':
      responseMessage = `Successfully activated ${affectedCount} crown(s)`;
      result = { affected: affectedCount };
      break;

    case 'deactivate':
      responseMessage = `Successfully deactivated ${affectedCount} crown(s)`;
      result = { affected: affectedCount };
      break;

    case 'add_note': {
      const note = input_data?.note || form_data?.note || 'No note provided';
      responseMessage = `Added note "${note}" to ${affectedCount} crown(s)`;
      result = { affected: affectedCount, note };
      break;
    }

    case 'view_details':
      responseMessage = 'Details retrieved successfully';
      result = [
        {
          id: 1,
          property: 'Name',
          value: 'Golden Crown',
          type: 'string',
        },
        {
          id: 2,
          property: 'Material',
          value: 'Gold & Diamonds',
          type: 'string',
        },
        {
          id: 3,
          property: 'Weight',
          value: '2.5kg',
          type: 'number',
        },
        {
          id: 4,
          property: 'Status',
          value: 'Active',
          type: 'status',
        },
        {
          id: 5,
          property: 'Last Updated',
          value: 1705276800,
          type: 'date',
        },
      ];
      break;

    case 'upload_certificate': {
      const files = input_data?.files || form_data?.files || [];
      responseMessage = `Successfully uploaded ${files.length} certificate file(s) for ${affectedCount} crown(s)`;
      result = { affected: affectedCount, uploaded_files: files.length };
      break;
    }

    // Refresh output actions
    case 'set_owner': {
      const newOwner = input_data?.owner || form_data?.owner || 'Unknown Owner';
      responseMessage = `Changed owner to "${newOwner}" for ${affectedCount} crown(s)`;
      result = { affected: affectedCount, new_owner: newOwner };
      break;
    }

    case 'recalculate_stats':
      responseMessage = `Recalculated statistics for ${affectedCount} crown(s)`;
      result = {
        affected: affectedCount,
        statistics: {
          total_value: 1250000.0,
          average_price: 15625.0,
          highest_value: 35000.0,
          lowest_value: 999.99,
        },
      };
      break;

    // Download output actions
    case 'export_excel':
      responseMessage = 'Excel export file generated successfully';
      result = {
        affected: affectedCount,
        url: '/api/download/crown_export.xlsx',
        filename: `crown_export_${Date.now()}.xlsx`,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
      break;

    case 'export_pdf': {
      const reportTitle =
        input_data?.title || form_data?.title || 'Crown Report';
      responseMessage = 'PDF report generated successfully';
      result = {
        affected: affectedCount,
        url: '/api/download/crown_report.pdf',
        filename: `crown_report_${Date.now()}.pdf`,
        contentType: 'application/pdf',
        report_title: reportTitle,
      };
      break;
    }

    // Table output actions
    case 'analyze_value':
      responseMessage = 'Value analysis completed';
      result = [
        {
          id: 1,
          crown_name: 'Golden Crown',
          current_value: 9999.99,
          market_estimate: 12500.0,
          appreciation: '+25.0%',
          risk_level: 'Low',
          recommendation: 'Hold',
        },
        {
          id: 2,
          crown_name: 'Diamond Crown',
          current_value: 19999.99,
          market_estimate: 22000.0,
          appreciation: '+10.0%',
          risk_level: 'Medium',
          recommendation: 'Buy',
        },
        {
          id: 3,
          crown_name: 'Jade Crown',
          current_value: 8888.88,
          market_estimate: 9500.0,
          appreciation: '+6.9%',
          risk_level: 'Low',
          recommendation: 'Hold',
        },
        {
          id: 4,
          crown_name: 'Ruby Crown',
          current_value: 15555.55,
          market_estimate: 14000.0,
          appreciation: '-10.0%',
          risk_level: 'High',
          recommendation: 'Sell',
        },
        {
          id: 5,
          crown_name: 'Platinum Crown',
          current_value: 25999.99,
          market_estimate: 28000.0,
          appreciation: '+7.7%',
          risk_level: 'Medium',
          recommendation: 'Hold',
        },
      ];
      break;

    case 'upload_and_analyze': {
      const uploadedFiles = input_data?.files || form_data?.files || [];
      responseMessage = `Analyzed ${uploadedFiles.length} appraisal document(s)`;
      result = [
        {
          document_name: uploadedFiles[0]?.name || 'Unknown Document',
          analysis_result: 'Authentic',
          confidence: '94%',
          estimated_value: 18500.0,
          appraisal_date: 1705276800,
          notes: 'High quality gemstones, excellent condition',
        },
        {
          document_name: uploadedFiles[1]?.name || 'Secondary Analysis',
          analysis_result: 'Verified',
          confidence: '89%',
          estimated_value: 17800.0,
          appraisal_date: 1705190400,
          notes: 'Minor wear consistent with age',
        },
      ];
      break;
    }

    default:
      res.send({
        code: 1,
        message: `Unknown action: ${action}`,
        data: null,
      });
      return;
  }

  res.send({
    code: 0,
    message: responseMessage,
    data: result,
  });
};

// Crown History actions处理函数
const handleCrownHistoryActions = async (
  _req: Request,
  res: Response,
  action: string,
  form_data: any,
  input_data: any,
  search_condition: any[],
) => {
  // 模拟根据条件计算影响的记录数
  const getAffectedCount = () => {
    if (!search_condition || search_condition.length === 0)
      return crownHistoryData.length;

    // 简单模拟：根据条件类型返回不同数量
    const hasIdCondition = search_condition.some((c: any) => c.field === 'id');
    if (hasIdCondition) return 1;

    // 其他条件模拟返回部分记录
    return Math.floor(crownHistoryData.length * 0.4);
  };

  const affectedCount = getAffectedCount();

  // 根据不同action返回不同类型的响应
  let result: any = null;
  let responseMessage = 'success';

  switch (action) {
    // 批量操作
    case 'export_history':
      responseMessage = `Successfully exported ${affectedCount} history record(s)`;
      result = {
        download: {
          url: '/api/download/crown_history_export.xlsx',
          filename: `crown_history_${Date.now()}.xlsx`,
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      };
      break;

    case 'mark_verified':
      responseMessage = `Successfully marked ${affectedCount} history record(s) as verified`;
      result = {
        affected: affectedCount,
        verified_at: new Date().toISOString(),
      };
      break;

    case 'bulk_delete':
      responseMessage = `Successfully deleted ${affectedCount} history record(s)`;
      result = { affected: affectedCount, deleted_count: affectedCount };
      break;

    // 单条记录操作
    case 'view_details':
      responseMessage = 'History details retrieved successfully';
      result = [
        {
          id: 1,
          property: 'Event Type',
          value: 'Created',
          type: 'string',
        },
        {
          id: 2,
          property: 'Event Date',
          value: 1705285800,
          type: 'datetime',
        },
        {
          id: 3,
          property: 'Description',
          value: 'Crown was initially created and catalogued',
          type: 'text',
        },
        {
          id: 4,
          property: 'Verification Status',
          value: 'Verified',
          type: 'status',
        },
        {
          id: 5,
          property: 'Location',
          value: 'Royal Treasury',
          type: 'string',
        },
      ];
      break;

    case 'add_note': {
      const note = input_data?.note || form_data?.note || 'No note provided';
      responseMessage = `Added note "${note}" to history record`;
      result = { affected: 1, note, added_at: new Date().toISOString() };
      break;
    }

    case 'upload_evidence': {
      const files = input_data?.files || form_data?.files || [];
      responseMessage = `Successfully uploaded ${files.length} evidence file(s) for history record`;
      result = { affected: 1, uploaded_files: files.length, files_info: files };
      break;
    }

    case 'generate_report':
      responseMessage = 'History report generated successfully';
      result = {
        download: {
          url: '/api/download/history_report.pdf',
          filename: `history_report_${Date.now()}.pdf`,
          contentType: 'application/pdf',
          report_title: 'Crown History Detailed Report',
        },
      };
      break;

    case 'duplicate_event':
      responseMessage = 'History event duplicated successfully';
      result = {
        affected: 1,
        new_record_id: Math.floor(Math.random() * 1000) + 100,
        duplicated_at: new Date().toISOString(),
      };
      break;

    default:
      responseMessage = `Unknown action: ${action}`;
      result = null;
      res.send({
        code: 1,
        message: responseMessage,
        data: result,
      });
      return;
  }

  res.send({
    code: 0,
    message: responseMessage,
    data: result,
  });
};

// Tools actions处理函数
const handleToolsActions = async (
  _req: Request,
  res: Response,
  action: string,
  form_data: any,
  input_data: any,
  _search_condition: any[],
) => {
  let responseMessage = '';
  let result: any = null;

  switch (action) {
    case 'preview':
      responseMessage = 'Report preview generated successfully';
      result = {
        preview_data: {
          title: `${form_data?.report_type || input_data?.report_type || 'Daily'} Crown Management Report`,
          date_range: `${form_data?.start_date || input_data?.start_date || 1704067200} to ${form_data?.end_date || input_data?.end_date || 1706659200}`,
          summary: {
            total_crowns: 156,
            active_crowns: 142,
            pending_transfers: 8,
            maintenance_required: 6,
          },
          preview_content: [
            'Executive Summary',
            'Crown Inventory Status',
            'Recent Activities',
            'Security Reports',
            'Recommendations',
          ],
        },
      };
      break;

    case 'generate': {
      responseMessage = 'Report generated and ready for download';
      const reportType =
        form_data?.report_type || input_data?.report_type || 'daily';
      const exportFormat =
        form_data?.export_format || input_data?.export_format || 'pdf';
      result = {
        download: {
          url: `/api/download/crown_report_${reportType}_${Date.now()}.${exportFormat}`,
          filename: `crown_report_${reportType}_${new Date().toISOString().split('T')[0]}.${exportFormat}`,
          contentType:
            exportFormat === 'excel'
              ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              : exportFormat === 'csv'
                ? 'text/csv'
                : 'application/pdf',
          size: Math.floor(Math.random() * 5000) + 1000, // Random size in KB
          generated_at: new Date().toISOString(),
        },
      };
      break;
    }

    case 'send_email': {
      const recipients =
        form_data?.email_recipients ||
        input_data?.email_recipients ||
        'admin@example.com';
      const recipientList = recipients
        .split(',')
        .map((email: string) => email.trim())
        .filter(Boolean);
      responseMessage = `Report successfully sent to ${recipientList.length} recipient(s)`;
      result = {
        email_sent: true,
        recipients: recipientList,
        sent_at: new Date().toISOString(),
        email_id: `EMAIL_${Date.now()}`,
        report_type:
          form_data?.report_type || input_data?.report_type || 'daily',
      };
      break;
    }

    case 'schedule': {
      responseMessage = 'Report scheduling configured successfully';
      const emailRecipients =
        form_data?.email_recipients || input_data?.email_recipients;
      result = {
        scheduled: true,
        schedule_id: `SCHEDULE_${Date.now()}`,
        report_type:
          form_data?.report_type || input_data?.report_type || 'daily',
        frequency: form_data?.frequency || input_data?.frequency || 'daily',
        next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        recipients: emailRecipients
          ? emailRecipients.split(',').map((email: string) => email.trim())
          : ['admin@example.com'],
        export_format:
          form_data?.export_format || input_data?.export_format || 'pdf',
        include_details:
          form_data?.include_details || input_data?.include_details || false,
      };
      break;
    }

    default:
      responseMessage = `Unknown action: ${action}`;
      result = null;
      res.send({
        code: 1,
        message: responseMessage,
        data: result,
      });
      return;
  }

  res.send({
    code: 0,
    message: responseMessage,
    data: result,
  });
};

export default {
  // 获取模型描述
  'POST /api/admin/model-desc': async (req: Request, res: Response) => {
    const { name } = req.body;
    await waitTime(500);

    if (name === 'crown') {
      res.send({
        code: 0,
        message: 'success',
        data: crownModelDesc,
      });
    } else if (name === 'user') {
      res.send({
        code: 0,
        message: 'success',
        data: userModelDesc,
      });
    } else if (name === 'tools') {
      // AdminToolSerializeModel mock data
      res.send({
        code: 0,
        message: 'success',
        data: {
          fields: {
            report_type: {
              field_type: 'CharField' as const,
              readonly: false,
              show: true,
              blank: false,
              choices: [
                ['daily', 'Daily Report'],
                ['weekly', 'Weekly Report'],
                ['monthly', 'Monthly Report'],
                ['yearly', 'Yearly Report'],
              ],
              help_text: 'Select the type of report to generate',
              default: 'daily',
              name: 'Report Type',
            },
            start_date: {
              field_type: 'DateField' as const,
              readonly: false,
              show: true,
              blank: false,
              choices: [],
              help_text: 'Start date for the report period',
              default: null,
              name: 'Start Date',
            },
            end_date: {
              field_type: 'DateField' as const,
              readonly: false,
              show: true,
              blank: false,
              choices: [],
              help_text: 'End date for the report period',
              default: null,
              name: 'End Date',
            },
            include_details: {
              field_type: 'BooleanField' as const,
              readonly: false,
              show: true,
              blank: true,
              choices: [],
              help_text: 'Include detailed breakdown in the report',
              default: false,
              name: 'Include Details',
            },
            export_format: {
              field_type: 'CharField' as const,
              readonly: false,
              show: true,
              blank: false,
              choices: [
                ['pdf', 'PDF'],
                ['excel', 'Excel'],
                ['csv', 'CSV'],
              ],
              help_text: 'Choose the format for exporting the report',
              default: 'pdf',
              name: 'Export Format',
            },
            email_recipients: {
              field_type: 'TextField' as const,
              readonly: false,
              show: true,
              blank: true,
              choices: [],
              help_text: 'Email addresses to send the report (comma-separated)',
              default: '',
              name: 'Email Recipients',
            },
          },
          actions: {
            preview: {
              name: 'preview',
              label: 'Preview Report',
              output: 'display' as const,
              input: 'empty' as const,
              confirm: false,
              description: 'Preview the report before generating',
              batch: false,
              extra: {},
            },
            generate: {
              name: 'generate',
              label: 'Generate Report',
              output: 'download' as const,
              input: 'string' as const,
              confirm: true,
              description: 'Generate and download the report',
              batch: false,
              extra: {},
            },
            send_email: {
              name: 'send_email',
              label: 'Send via Email',
              output: 'toast' as const,
              input: 'string' as const,
              confirm: true,
              description: 'Generate report and send via email',
              batch: false,
              extra: {},
            },
            schedule: {
              name: 'schedule',
              label: 'Schedule Report',
              output: 'toast' as const,
              input: 'string' as const,
              confirm: false,
              description: 'Schedule this report for automatic generation',
              batch: false,
              extra: {},
            },
          },
          attrs: {
            help_text: 'Crown Management Reporting Tools',
            output_field: 'report_data',
          },
        },
      });
    } else if (name === 'crown_history') {
      res.send({
        code: 0,
        message: 'success',
        data: {
          fields: {
            id: {
              field_type: 'IntegerField' as const,
              readonly: true,
              show: true,
              blank: false,
              choices: [],
              help_text: 'History record ID',
              default: null,
              name: 'ID',
            },
            crown_id: {
              field_type: 'IntegerField' as const,
              readonly: false,
              show: true,
              blank: false,
              choices: [],
              help_text: 'Associated crown ID',
              default: null,
              name: 'Crown ID',
            },
            event_type: {
              field_type: 'CharField' as const,
              readonly: false,
              show: true,
              blank: false,
              choices: [
                ['created', 'Created'],
                ['transferred', 'Transferred'],
                ['maintenance', 'Maintenance'],
                ['reserved', 'Reserved'],
                ['sold', 'Sold'],
                ['appraised', 'Appraised'],
                ['inspection', 'Inspection'],
                ['exhibition', 'Exhibition'],
              ],
              help_text: 'Type of historical event',
              default: 'created',
              name: 'Event Type',
            },
            description: {
              field_type: 'TextField' as const,
              readonly: false,
              show: true,
              blank: true,
              choices: [],
              help_text: 'Detailed description of the event',
              default: null,
              name: 'Description',
            },
            event_date: {
              field_type: 'DatetimeField' as const,
              readonly: false,
              show: true,
              blank: false,
              choices: [],
              help_text: 'When the event occurred',
              default: null,
              name: 'Event Date',
            },
            created_at: {
              field_type: 'DatetimeField' as const,
              readonly: true,
              show: true,
              blank: false,
              choices: [],
              help_text: 'Record creation time',
              default: null,
              name: 'Created At',
            },
            updated_at: {
              field_type: 'DatetimeField' as const,
              readonly: true,
              show: true,
              blank: false,
              choices: [],
              help_text: 'Record last update time',
              default: null,
              name: 'Updated At',
            },
          },
          actions: {},
          attrs: {
            help_text: 'Crown History Records',
            can_search: true,
            can_add: true,
            can_delete: true,
            can_edit: true,
            list_per_page: 10,
            list_per_page_options: [10, 20, 50, 100, 200, 500, 1000],
            search_fields: ['event_type', 'description'],
            search_range_fields: ['event_date'],
            list_sort: ['event_date'],
            list_order: ['-event_date'],
            detail_display: [
              'id',
              'crown_id',
              'event_type',
              'description',
              'event_date',
              'created_at',
              'updated_at',
            ],
          },
        },
      });
    } else {
      res.send({
        code: 1,
        message: `Model ${name} not found`,
        data: null,
      });
    }
  },

  // 获取模型数据
  'POST /api/admin/model-data': async (req: Request, res: Response) => {
    const { name, page = 1, size = 20, cond = [] } = req.body;
    await waitTime(300);

    let filteredData: any[] = [];

    if (name === 'crown') {
      filteredData = [...crownData];
    } else if (name === 'user') {
      filteredData = [...userData];
    } else if (name === 'crown_history') {
      filteredData = [...crownHistoryData];
    } else if (name === 'crown_tags') {
      filteredData = [...crownTagsData];
    } else if (name === 'crown_tag_relations') {
      filteredData = [...crownTagRelationsData];
    } else if (name === 'crown_certificates') {
      filteredData = [...crownCertificatesData];
    } else if (name === 'crown_insurance') {
      filteredData = [...crownInsuranceData];
    } else {
      res.send({
        code: 1,
        message: `Model ${name} not found`,
        data: null,
      });
      return;
    }

    // 应用搜索条件
    if (cond && cond.length > 0) {
      cond.forEach((condition: any) => {
        const { field, eq, lt, lte, gt, gte, contains, icontains } = condition;
        const inValues = condition.in; // Handle 'in' operator

        filteredData = filteredData.filter((item) => {
          const value = (item as any)[field];

          if (eq !== undefined && eq !== null) {
            return value === eq || String(value) === String(eq);
          }
          if (
            inValues !== undefined &&
            inValues !== null &&
            Array.isArray(inValues)
          ) {
            return inValues.some(
              (v: any) => value === v || String(value) === String(v),
            );
          }
          if (lt !== undefined && lt !== null) {
            return value < lt;
          }
          if (lte !== undefined && lte !== null) {
            return value <= lte;
          }
          if (gt !== undefined && gt !== null) {
            return value > gt;
          }
          if (gte !== undefined && gte !== null) {
            return value >= gte;
          }
          if (contains !== undefined && contains !== null) {
            return String(value).includes(String(contains));
          }
          if (icontains !== undefined && icontains !== null) {
            return String(value)
              .toLowerCase()
              .includes(String(icontains).toLowerCase());
          }

          return true;
        });
      });
    }

    // 分页
    const total = filteredData.length;
    const startIndex = (page - 1) * size;
    const endIndex = Math.min(startIndex + size, total);
    const paginatedData = filteredData.slice(startIndex, endIndex);

    res.send({
      code: 0,
      message: 'success',
      data: {
        count: total,
        data: paginatedData,
      },
    });
  },

  // 模型操作
  'POST /api/admin/model-action': async (req: Request, res: Response) => {
    const {
      name,
      action,
      search_condition = [],
      form_data = {},
      input_data = {},
    } = req.body;
    await waitTime(800);

    if (name === 'crown') {
      return handleCrownActions(
        req,
        res,
        action,
        form_data,
        input_data,
        search_condition,
      );
    } else if (name === 'crown_history') {
      return handleCrownHistoryActions(
        req,
        res,
        action,
        form_data,
        input_data,
        search_condition,
      );
    } else if (name === 'tools') {
      return handleToolsActions(
        req,
        res,
        action,
        form_data,
        input_data,
        search_condition,
      );
    } else {
      res.send({
        code: 1,
        message: `Model ${name} not found`,
        data: null,
      });
      return;
    }
  },

  // Crown 模型删除
  'POST /api/admin/model-delete': async (req: Request, res: Response) => {
    const { name, data } = req.body;
    await waitTime(600);

    if (name === 'crown') {
      const deletedCount = Array.isArray(data) ? data.length : 1;

      res.send({
        code: 0,
        message: 'success',
        data: {
          message: `Successfully deleted ${deletedCount} crown record(s)`,
          deleted_count: deletedCount,
        },
      });
    } else if (name === 'crown_history') {
      const deletedCount = Array.isArray(data) ? data.length : 1;

      // 模拟从数据源删除记录
      if (Array.isArray(data)) {
        data.forEach((record: any) => {
          const index = crownHistoryData.findIndex(
            (item) => item.id === record.id,
          );
          if (index > -1) {
            crownHistoryData.splice(index, 1);
          }
        });
      } else {
        const index = crownHistoryData.findIndex((item) => item.id === data.id);
        if (index > -1) {
          crownHistoryData.splice(index, 1);
        }
      }

      res.send({
        code: 0,
        message: 'success',
        data: {
          message: `Successfully deleted ${deletedCount} crown history record(s)`,
          deleted_count: deletedCount,
        },
      });
    } else if (name === 'crown_tag_relations') {
      // Crown tag relations 删除操作 (M2M 中间表)
      // Support deletion by id OR by crown_id + tag_id conditions
      let deletedCount = 0;

      if (Array.isArray(data)) {
        data.forEach((record: any) => {
          const index = crownTagRelationsData.findIndex((item) => {
            if (record.id) {
              return item.id === record.id;
            }
            // Find by crown_id and tag_id
            return (
              item.crown_id === record.crown_id && item.tag_id === record.tag_id
            );
          });
          if (index > -1) {
            crownTagRelationsData.splice(index, 1);
            deletedCount++;
          }
        });
      } else {
        const index = crownTagRelationsData.findIndex((item) => {
          if (data.id) {
            return item.id === data.id;
          }
          // Find by crown_id and tag_id
          return item.crown_id === data.crown_id && item.tag_id === data.tag_id;
        });
        if (index > -1) {
          crownTagRelationsData.splice(index, 1);
          deletedCount = 1;
        }
      }

      res.send({
        code: 0,
        message: 'success',
        data: {
          message: `Successfully deleted ${deletedCount} crown tag relation(s)`,
          deleted_count: deletedCount,
        },
      });
    } else if (name === 'crown_certificates') {
      // Crown certificates 删除操作
      const deletedCount = Array.isArray(data) ? data.length : 1;

      // 模拟从数据源删除记录
      if (Array.isArray(data)) {
        data.forEach((record: any) => {
          const index = crownCertificatesData.findIndex(
            (item) => item.id === record.id,
          );
          if (index > -1) {
            crownCertificatesData.splice(index, 1);
          }
        });
      } else {
        const index = crownCertificatesData.findIndex(
          (item) => item.id === data.id,
        );
        if (index > -1) {
          crownCertificatesData.splice(index, 1);
        }
      }

      res.send({
        code: 0,
        message: 'success',
        data: {
          message: `Successfully deleted ${deletedCount} certificate(s)`,
          deleted_count: deletedCount,
        },
      });
    } else if (name === 'crown_insurance') {
      // Crown insurance 删除操作
      const deletedCount = Array.isArray(data) ? data.length : 1;

      // 模拟从数据源删除记录
      if (Array.isArray(data)) {
        data.forEach((record: any) => {
          const index = crownInsuranceData.findIndex(
            (item) => item.id === record.id,
          );
          if (index > -1) {
            crownInsuranceData.splice(index, 1);
          }
        });
      } else {
        const index = crownInsuranceData.findIndex(
          (item) => item.id === data.id,
        );
        if (index > -1) {
          crownInsuranceData.splice(index, 1);
        }
      }

      res.send({
        code: 0,
        message: 'success',
        data: {
          message: `Successfully deleted ${deletedCount} insurance record(s)`,
          deleted_count: deletedCount,
        },
      });
    } else {
      res.send({
        code: 1,
        message: `Model ${name} not found`,
        data: null,
      });
    }
  },

  // Crown 模型保存
  'POST /api/admin/model-save': async (req: Request, res: Response) => {
    const { name, data } = req.body;
    await waitTime(800);

    if (name === 'crown') {
      // Simulate save operation
      const isUpdate = data.id;
      const savedData = {
        ...data,
        id: data.id || Math.max(...crownData.map((item) => item.id)) + 1,
        updated_at: new Date().toISOString(),
        created_at: data.created_at || new Date().toISOString(),
      };

      res.send({
        code: 0,
        message: 'success',
        data: {
          message: isUpdate
            ? 'Crown information updated successfully'
            : 'New crown created successfully',
          saved_data: savedData,
          is_update: isUpdate,
        },
      });
    } else if (name === 'crown_history') {
      // Crown History 保存操作
      const isUpdate = data.id;
      let savedData: any = null;

      if (isUpdate) {
        // 更新现有记录
        const index = crownHistoryData.findIndex((item) => item.id === data.id);
        if (index > -1) {
          savedData = {
            ...crownHistoryData[index],
            ...data,
            updated_at: new Date().toISOString(),
          };
          crownHistoryData[index] = savedData;
        } else {
          savedData = {
            ...data,
            updated_at: new Date().toISOString(),
          };
        }
      } else {
        // 创建新记录
        savedData = {
          ...data,
          id: Math.max(...crownHistoryData.map((item) => item.id)) + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        crownHistoryData.push(savedData);
      }

      res.send({
        code: 0,
        message: 'success',
        data: {
          message: isUpdate
            ? 'Crown history record updated successfully'
            : 'New crown history record created successfully',
          saved_data: savedData,
          is_update: isUpdate,
        },
      });
    } else if (name === 'crown_tag_relations') {
      // Crown tag relations 保存操作 (M2M 中间表)
      // Support both single record and array of records (batch save)
      const records = Array.isArray(data) ? data : [data];
      const savedRecords: any[] = [];

      records.forEach((record: any) => {
        const newRecord = {
          ...record,
          id: Date.now() + Math.random(),
          created_at: new Date().toISOString(),
        };
        crownTagRelationsData.push(newRecord);
        savedRecords.push(newRecord);
      });

      res.send({
        code: 0,
        message: 'success',
        data: {
          message: `${savedRecords.length} crown tag relation(s) saved successfully`,
          saved_data:
            savedRecords.length === 1 ? savedRecords[0] : savedRecords,
        },
      });
    } else if (name === 'crown_certificates') {
      // Crown certificates 保存操作
      const isUpdate = data.id && data.id !== -1;
      let savedData: any = null;

      if (isUpdate) {
        // 更新现有记录
        const index = crownCertificatesData.findIndex(
          (item) => item.id === data.id,
        );
        if (index > -1) {
          savedData = {
            ...crownCertificatesData[index],
            ...data,
            updated_at: new Date().toISOString(),
          };
          crownCertificatesData[index] = savedData;
        } else {
          savedData = {
            ...data,
            updated_at: new Date().toISOString(),
          };
        }
      } else {
        // 创建新记录
        savedData = {
          ...data,
          id: Math.max(...crownCertificatesData.map((item) => item.id), 0) + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        crownCertificatesData.push(savedData);
      }

      res.send({
        code: 0,
        message: 'success',
        data: {
          message: isUpdate
            ? 'Certificate updated successfully'
            : 'New certificate created successfully',
          saved_data: savedData,
          is_update: isUpdate,
        },
      });
    } else if (name === 'crown_insurance') {
      // Crown insurance 保存操作
      const isUpdate = data.id && data.id !== -1;
      let savedData: any = null;

      if (isUpdate) {
        // 更新现有记录
        const index = crownInsuranceData.findIndex(
          (item) => item.id === data.id,
        );
        if (index > -1) {
          savedData = {
            ...crownInsuranceData[index],
            ...data,
            updated_at: new Date().toISOString(),
          };
          crownInsuranceData[index] = savedData;
        } else {
          savedData = {
            ...data,
            updated_at: new Date().toISOString(),
          };
        }
      } else {
        // 创建新记录
        savedData = {
          ...data,
          id: Math.max(...crownInsuranceData.map((item) => item.id), 0) + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        crownInsuranceData.push(savedData);
      }

      res.send({
        code: 0,
        message: 'success',
        data: {
          message: isUpdate
            ? 'Insurance record updated successfully'
            : 'New insurance record created successfully',
          saved_data: savedData,
          is_update: isUpdate,
        },
      });
    } else {
      res.send({
        code: 1,
        message: `Model ${name} not found`,
        data: null,
      });
    }
  },

  // Crown 模型批量保存
  'POST /api/admin/batch-model-save': async (req: Request, res: Response) => {
    const { name, data } = req.body;
    await waitTime(800);

    if (!Array.isArray(data)) {
      res.send({
        code: 1,
        message: 'data must be a list',
        data: null,
      });
      return;
    }

    if (name === 'crown_history') {
      const savedList: any[] = [];
      data.forEach((item: any) => {
        const isUpdate = typeof item.id === 'number' && item.id > 0;
        if (isUpdate) {
          const index = crownHistoryData.findIndex((row) => row.id === item.id);
          if (index > -1) {
            const next = {
              ...crownHistoryData[index],
              ...item,
              updated_at: new Date().toISOString(),
            };
            crownHistoryData[index] = next;
            savedList.push(next);
          } else {
            const next = {
              ...item,
              updated_at: new Date().toISOString(),
            };
            crownHistoryData.push(next);
            savedList.push(next);
          }
        } else {
          const next = {
            ...item,
            id: Math.max(...crownHistoryData.map((row) => row.id), 0) + 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          crownHistoryData.push(next);
          savedList.push(next);
        }
      });

      res.send({
        code: 0,
        message: 'success',
        data: {
          message: `${savedList.length} crown history record(s) batch saved successfully`,
          saved_data: savedList,
        },
      });
      return;
    }

    res.send({
      code: 0,
      message: 'success',
      data: {
        message: `${data.length} record(s) batch saved successfully`,
        saved_data: data,
      },
    });
  },

  // Crown 模型内联信息
  'POST /api/admin/model-inlines': async (req: Request, res: Response) => {
    const { name } = req.body;
    await waitTime(500);

    if (name !== 'crown') {
      res.send({
        code: 1,
        message: `Model ${name} not found`,
        data: null,
      });
      return;
    }
    // 模拟返回内联模型信息
    res.send({
      code: 0,
      message: 'success',
      data: {
        // fk关系：皇冠历史记录 (一对多)
        crown_history: {
          fields: {
            id: {
              field_type: 'IntegerField' as const,
              readonly: true,
              show: true,
              blank: false,
              choices: [],
              help_text: 'History record ID',
              default: null,
              name: 'ID',
            },
            crown_id: {
              field_type: 'IntegerField' as const,
              readonly: false,
              show: false,
              blank: false,
              choices: [],
              help_text: 'Crown foreign key',
              default: null,
              name: 'Crown ID',
            },
            event_type: {
              field_type: 'CharField' as const,
              readonly: false,
              show: true,
              blank: false,
              choices: [
                ['created', 'Created'],
                ['transferred', 'Transferred'],
                ['maintenance', 'Maintenance'],
                ['sold', 'Sold'],
                ['reserved', 'Reserved'],
                ['appraised', 'Appraised'],
                ['inspection', 'Inspection'],
                ['exhibition', 'Exhibition'],
              ],
              help_text: 'Type of historical event',
              default: 'created',
              name: 'Event Type',
            },
            description: {
              field_type: 'TextField' as const,
              readonly: false,
              show: true,
              blank: true,
              choices: [],
              help_text: 'Event description',
              default: '',
              name: 'Description',
            },
            event_date: {
              field_type: 'DatetimeField' as const,
              readonly: false,
              show: true,
              blank: false,
              choices: [],
              help_text: 'When the event occurred',
              default: null,
              name: 'Event Date',
            },
            created_at: {
              field_type: 'DatetimeField' as const,
              readonly: true,
              show: true,
              blank: false,
              choices: [],
              help_text: 'Record creation time',
              default: null,
              name: 'Created At',
            },
            updated_at: {
              field_type: 'DatetimeField' as const,
              readonly: true,
              show: true,
              blank: false,
              choices: [],
              help_text: 'Record last update time',
              default: null,
              name: 'Updated At',
            },
            level_type: {
              field_type: 'IntegerField' as const,
              readonly: false,
              show: true,
              blank: false,
              choices: [
                [1, 'One'],
                [2, 'Two'],
              ],
              help_text: '',
              default: null,
              name: 'Level',
            },
          },
          actions: {
            // 批量操作
            export_history: {
              name: 'export_history',
              label: 'Export History',
              description: 'Export selected history records to Excel',
              batch: true,
              input: 'empty',
              output: 'download',
            },
            mark_verified: {
              name: 'mark_verified',
              label: 'Mark as Verified',
              description: 'Mark selected history records as verified',
              batch: true,
              input: 'empty',
              output: 'toast',
            },
            bulk_delete: {
              name: 'bulk_delete',
              label: 'Bulk Delete',
              description: 'Delete multiple history records at once',
              batch: true,
              input: 'empty',
              output: 'refresh',
            },
            // 单条记录操作
            view_details: {
              name: 'view_details',
              label: 'View Details',
              description:
                'View detailed information about this history record',
              batch: false,
              input: 'empty',
              output: 'display',
            },
            add_note: {
              name: 'add_note',
              label: 'Add Note',
              description: 'Add a note to this history record',
              batch: false,
              input: 'string',
              output: 'toast',
            },
            upload_evidence: {
              name: 'upload_evidence',
              label: 'Upload Evidence',
              description: 'Upload supporting documents for this event',
              batch: false,
              input: 'file',
              output: 'toast',
            },
            generate_report: {
              name: 'generate_report',
              label: 'Generate Report',
              description: 'Generate a detailed report for this history event',
              batch: false,
              input: 'empty',
              output: 'download',
            },
            duplicate_event: {
              name: 'duplicate_event',
              label: 'Duplicate Event',
              description:
                'Create a copy of this history event with current date',
              batch: false,
              input: 'empty',
              output: 'refresh',
            },
          },
          attrs: {
            help_text: 'Crown History Records',
            can_search: true,
            can_add: true,
            can_delete: true,
            can_edit: true,
            list_per_page: 10,
            list_per_page_options: [10, 20, 50, 100, 200, 500, 1000],
            search_fields: ['id', 'description'],
            search_range_fields: ['event_date'],
            list_sort: ['event_date'],
            list_order: ['-event_date'],
            max_num: 50,
            min_num: 0,
          },
          relation: {
            target: 'crown_history',
            source_field: 'id',
            target_field: 'crown_id',
            target_field_nullable: false,
            relation: 'bk_fk' as const,
          },
        },
        // fk关系：皇冠证书 (一对多)
        crown_certificates: {
          fields: {
            id: {
              field_type: 'IntegerField' as const,
              readonly: true,
              show: true,
              blank: false,
              choices: [],
              help_text: 'Certificate ID',
              default: null,
              name: 'ID',
            },
            crown_id: {
              field_type: 'IntegerField' as const,
              readonly: false,
              show: false,
              blank: false,
              choices: [],
              help_text: 'Crown foreign key',
              default: null,
              name: 'Crown ID',
            },
            certificate_type: {
              field_type: 'CharField' as const,
              readonly: false,
              show: true,
              blank: false,
              choices: [
                ['authenticity', 'Authenticity'],
                ['appraisal', 'Appraisal'],
                ['heritage', 'Heritage'],
                ['insurance', 'Insurance'],
              ],
              help_text: 'Type of certificate',
              default: 'authenticity',
              name: 'Certificate Type',
            },
            issuer: {
              field_type: 'CharField' as const,
              readonly: false,
              show: true,
              blank: false,
              choices: [],
              help_text: 'Certificate issuing authority',
              default: null,
              name: 'Issuer',
            },
            certificate_number: {
              field_type: 'CharField' as const,
              readonly: false,
              show: true,
              blank: false,
              choices: [],
              help_text: 'Unique certificate number',
              default: null,
              name: 'Certificate Number',
            },
            issue_date: {
              field_type: 'DatetimeField' as const,
              readonly: false,
              show: true,
              blank: false,
              choices: [],
              help_text: 'Certificate issue date',
              default: null,
              name: 'Issue Date',
            },
            expiry_date: {
              field_type: 'DatetimeField' as const,
              readonly: false,
              show: true,
              blank: true,
              choices: [],
              help_text: 'Certificate expiry date',
              default: null,
              name: 'Expiry Date',
            },
            status: {
              field_type: 'CharField' as const,
              readonly: false,
              show: true,
              blank: false,
              choices: [
                ['active', 'Active'],
                ['expired', 'Expired'],
                ['revoked', 'Revoked'],
              ],
              help_text: 'Certificate status',
              default: 'active',
              name: 'Status',
            },
            created_at: {
              field_type: 'DatetimeField' as const,
              readonly: true,
              show: true,
              blank: false,
              choices: [],
              help_text: 'Record creation time',
              default: null,
              name: 'Created At',
            },
            updated_at: {
              field_type: 'DatetimeField' as const,
              readonly: true,
              show: true,
              blank: false,
              choices: [],
              help_text: 'Record last update time',
              default: null,
              name: 'Updated At',
            },
          },
          actions: {},
          attrs: {
            help_text: 'Crown Certificates',
            can_search: true,
            can_add: true,
            can_delete: true,
            can_edit: true,
            list_per_page: 10,
            list_per_page_options: [10, 20, 50, 100, 200, 500, 1000],
            search_fields: ['certificate_type', 'issuer'],
            search_range_fields: ['issue_date', 'expiry_date'],
            list_sort: ['issue_date'],
            list_order: ['-issue_date'],
            max_num: 20,
            min_num: 0,
          },
          relation: {
            target: 'crown_certificates',
            source_field: 'id',
            target_field: 'crown_id',
            target_field_nullable: true,
            relation: 'bk_fk' as const,
          },
        },
        // o2o关系：皇冠保险 (一对一)
        crown_insurance: {
          fields: {
            id: {
              field_type: 'IntegerField' as const,
              readonly: true,
              show: true,
              blank: false,
              choices: [],
              help_text: 'Insurance ID',
              default: null,
              name: 'ID',
            },
            crown_id: {
              field_type: 'IntegerField' as const,
              readonly: false,
              show: false,
              blank: false,
              choices: [],
              help_text: 'Crown foreign key',
              default: null,
              name: 'Crown ID',
            },
            policy_number: {
              field_type: 'CharField' as const,
              readonly: false,
              show: true,
              blank: false,
              choices: [],
              help_text: 'Insurance policy number',
              default: null,
              name: 'Policy Number',
            },
            insurance_company: {
              field_type: 'CharField' as const,
              readonly: false,
              show: true,
              blank: false,
              choices: [],
              help_text: 'Insurance company name',
              default: null,
              name: 'Insurance Company',
            },
            coverage_amount: {
              field_type: 'FloatField' as const,
              readonly: false,
              show: true,
              blank: false,
              choices: [],
              help_text: 'Insurance coverage amount',
              default: null,
              name: 'Coverage Amount',
            },
            premium_amount: {
              field_type: 'FloatField' as const,
              readonly: false,
              show: true,
              blank: false,
              choices: [],
              help_text: 'Insurance premium amount',
              default: null,
              name: 'Premium Amount',
            },
            start_date: {
              field_type: 'DatetimeField' as const,
              readonly: false,
              show: true,
              blank: false,
              choices: [],
              help_text: 'Policy start date',
              default: null,
              name: 'Start Date',
            },
            end_date: {
              field_type: 'DatetimeField' as const,
              readonly: false,
              show: true,
              blank: false,
              choices: [],
              help_text: 'Policy end date',
              default: null,
              name: 'End Date',
            },
            policy_type: {
              field_type: 'CharField' as const,
              readonly: false,
              show: true,
              blank: false,
              choices: [
                ['basic', 'Basic'],
                ['comprehensive', 'Comprehensive'],
                ['premium', 'Premium'],
              ],
              help_text: 'Type of insurance policy',
              default: 'basic',
              name: 'Policy Type',
            },
            status: {
              field_type: 'CharField' as const,
              readonly: false,
              show: true,
              blank: false,
              choices: [
                ['active', 'Active'],
                ['expired', 'Expired'],
                ['cancelled', 'Cancelled'],
                ['pending', 'Pending'],
              ],
              help_text: 'Insurance policy status',
              default: 'active',
              name: 'Status',
            },
            created_at: {
              field_type: 'DatetimeField' as const,
              readonly: true,
              show: true,
              blank: false,
              choices: [],
              help_text: 'Record creation time',
              default: null,
              name: 'Created At',
            },
            updated_at: {
              field_type: 'DatetimeField' as const,
              readonly: true,
              show: true,
              blank: false,
              choices: [],
              help_text: 'Record last update time',
              default: null,
              name: 'Updated At',
            },
          },
          actions: {},
          attrs: {
            help_text: 'Crown Insurance',
            can_search: true,
            can_add: true,
            can_delete: true,
            can_edit: true,
            list_per_page: 10,
            list_per_page_options: [10, 20, 50, 100, 200, 500, 1000],
            search_fields: ['policy_number', 'insurance_company'],
            search_range_fields: [
              'coverage_amount',
              'premium_amount',
              'start_date',
              'end_date',
            ],
            list_sort: ['start_date'],
            list_order: ['-start_date'],
            max_num: 1,
            min_num: 0,
          },
          relation: {
            target: 'crown_insurance',
            source_field: 'id',
            target_field: 'crown_id',
            target_field_nullable: false,
            relation: 'bk_o2o' as const,
          },
        },
        // m2m关系：皇冠标签 (多对多)
        crown_tags: {
          fields: {
            id: {
              field_type: 'IntegerField' as const,
              readonly: true,
              show: true,
              blank: false,
              choices: [],
              help_text: 'Tag ID',
              default: null,
              name: 'ID',
            },
            name: {
              field_type: 'CharField' as const,
              readonly: false,
              show: true,
              blank: false,
              choices: [],
              help_text: 'Tag name',
              default: null,
              name: 'Name',
            },
            description: {
              field_type: 'TextField' as const,
              readonly: false,
              show: true,
              blank: true,
              choices: [],
              help_text: 'Tag description',
              default: null,
              name: 'Description',
            },
          },
          actions: {},
          attrs: {
            help_text: 'Crown Tags',
            can_search: true,
            can_add: true,
            can_delete: true,
            can_edit: true,
            list_per_page: 10,
            list_per_page_options: [10, 20, 50, 100, 200, 500, 1000],
            search_fields: ['name', 'description'],
            search_range_fields: [],
            list_sort: ['name'],
            list_order: ['name'],
            max_num: 0,
            min_num: 0,
          },
          relation: {
            target: 'crown_tags',
            source_field: 'id',
            target_field: 'id',
            target_field_nullable: false,
            relation: 'm2m' as const,
            through: {
              through: 'crown_tag_relations',
              source_field: 'id',
              source_to_through_field: 'crown_id',
              target_field: 'id',
              target_to_through_field: 'tag_id',
            },
          },
        },
      },
    });
  },
};
