// ----------------------------------------------------------------------

/**
 * Chuẩn hóa database schema cho bảng processed_images
 *
 * NAMING CONVENTION:
 * - *_url: URL từ external services (Runware API)
 * - *_supabase_url: URL từ Supabase Storage (nếu re-upload)
 * - status: trạng thái xử lý hiện tại
 */

/**
 * Database schema definition
 */
export const PROCESSED_IMAGES_SCHEMA = {
  // Primary fields
  id: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
  user_id: 'UUID REFERENCES auth.users(id) ON DELETE CASCADE',

  // Original image
  original_url: 'TEXT NOT NULL', // URL từ Supabase Storage
  original_filename: 'TEXT',
  original_size: 'BIGINT',
  original_mime_type: 'TEXT',

  // Background removal results
  mask_url: 'TEXT', // URL mask từ Runware API
  mask_supabase_url: 'TEXT', // URL mask từ Supabase (nếu re-upload)
  background_removed_url: 'TEXT', // URL ảnh đã xóa BG từ Runware (deprecated)

  // Final inpainting results
  final_url: 'TEXT', // URL ảnh cuối từ Runware API
  final_supabase_url: 'TEXT', // URL ảnh cuối từ Supabase (nếu re-upload)

  // Processing metadata
  status: `TEXT DEFAULT 'uploaded' CHECK (status IN (
    'uploaded',
    'processing_mask',
    'mask_generated', 
    'processing_inpainting',
    'completed',
    'error'
  ))`,

  // Prompts and settings used
  background_prompt: 'TEXT',
  negative_prompt: 'TEXT',
  style_selected: 'JSONB', // Style object nếu chọn preset

  // Processing costs and metadata
  total_cost: 'DECIMAL(10,4) DEFAULT 0',
  processing_time_seconds: 'INTEGER',
  runware_task_ids: 'JSONB', // Array các taskUUID từ Runware

  // Timestamps
  created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
  updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
  completed_at: 'TIMESTAMP WITH TIME ZONE',
};

/**
 * Status flow definition
 */
export const STATUS_FLOW = {
  UPLOADED: 'uploaded',
  PROCESSING_MASK: 'processing_mask',
  MASK_GENERATED: 'mask_generated',
  PROCESSING_INPAINTING: 'processing_inpainting',
  COMPLETED: 'completed',
  ERROR: 'error',
};

/**
 * Status transitions (valid next states)
 */
export const STATUS_TRANSITIONS = {
  [STATUS_FLOW.UPLOADED]: [STATUS_FLOW.PROCESSING_MASK, STATUS_FLOW.ERROR],
  [STATUS_FLOW.PROCESSING_MASK]: [STATUS_FLOW.MASK_GENERATED, STATUS_FLOW.ERROR],
  [STATUS_FLOW.MASK_GENERATED]: [STATUS_FLOW.PROCESSING_INPAINTING, STATUS_FLOW.ERROR],
  [STATUS_FLOW.PROCESSING_INPAINTING]: [STATUS_FLOW.COMPLETED, STATUS_FLOW.ERROR],
  [STATUS_FLOW.COMPLETED]: [], // Final state
  [STATUS_FLOW.ERROR]: [STATUS_FLOW.PROCESSING_MASK], // Can retry from mask generation
};

/**
 * Required indexes for performance
 */
export const REQUIRED_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_processed_images_user_id ON processed_images(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_processed_images_status ON processed_images(status)',
  'CREATE INDEX IF NOT EXISTS idx_processed_images_created_at ON processed_images(created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_processed_images_user_created ON processed_images(user_id, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_processed_images_user_status ON processed_images(user_id, status)',
];

/**
 * Row Level Security policies
 */
export const RLS_POLICIES = [
  `CREATE POLICY "Users can view own images" ON processed_images
   FOR SELECT USING (auth.uid() = user_id)`,

  `CREATE POLICY "Users can insert own images" ON processed_images  
   FOR INSERT WITH CHECK (auth.uid() = user_id)`,

  `CREATE POLICY "Users can update own images" ON processed_images
   FOR UPDATE USING (auth.uid() = user_id)`,

  `CREATE POLICY "Users can delete own images" ON processed_images
   FOR DELETE USING (auth.uid() = user_id)`,
];

/**
 * Migration SQL để cập nhật schema hiện tại
 */
export const MIGRATION_SQL = `
-- Add new columns if they don't exist
ALTER TABLE processed_images 
ADD COLUMN IF NOT EXISTS mask_url TEXT,
ADD COLUMN IF NOT EXISTS mask_supabase_url TEXT,
ADD COLUMN IF NOT EXISTS final_supabase_url TEXT,
ADD COLUMN IF NOT EXISTS original_filename TEXT,
ADD COLUMN IF NOT EXISTS original_size BIGINT,
ADD COLUMN IF NOT EXISTS original_mime_type TEXT,
ADD COLUMN IF NOT EXISTS background_prompt TEXT,
ADD COLUMN IF NOT EXISTS negative_prompt TEXT,
ADD COLUMN IF NOT EXISTS style_selected JSONB,
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_time_seconds INTEGER,
ADD COLUMN IF NOT EXISTS runware_task_ids JSONB,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Update status constraint to include new statuses
ALTER TABLE processed_images DROP CONSTRAINT IF EXISTS processed_images_status_check;
ALTER TABLE processed_images ADD CONSTRAINT processed_images_status_check 
CHECK (status IN ('uploaded', 'processing_mask', 'mask_generated', 'processing_inpainting', 'completed', 'error'));

-- Create indexes
${REQUIRED_INDEXES.join(';\n')};

-- Enable RLS if not already enabled
ALTER TABLE processed_images ENABLE ROW LEVEL SECURITY;

-- Create policies (will skip if already exist)
${RLS_POLICIES.join(';\n')};

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_processed_images_updated_at ON processed_images;
CREATE TRIGGER update_processed_images_updated_at
    BEFORE UPDATE ON processed_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`;

/**
 * Helper functions for status management
 */
export const isValidStatusTransition = (currentStatus, newStatus) => {
  const validNextStates = STATUS_TRANSITIONS[currentStatus] || [];
  return validNextStates.includes(newStatus);
};

export const getNextValidStatuses = (currentStatus) => STATUS_TRANSITIONS[currentStatus] || [];

export const isTerminalStatus = (status) =>
  status === STATUS_FLOW.COMPLETED || status === STATUS_FLOW.ERROR;

/**
 * Field mapping for backward compatibility
 */
export const FIELD_MAPPING = {
  // Old field name -> New field name
  background_removed_url: 'mask_url', // Background removal now returns mask
  background_removed_supabase_url: 'mask_supabase_url',
  final_url: 'final_url', // Unchanged
  final_supabase_url: 'final_supabase_url', // New field
};

/**
 * Validation functions
 */
export const validateProcessedImageRecord = (record) => {
  const errors = [];

  // Required fields
  if (!record.user_id) errors.push('user_id is required');
  if (!record.original_url) errors.push('original_url is required');

  // Status validation
  if (!Object.values(STATUS_FLOW).includes(record.status)) {
    errors.push(`Invalid status: ${record.status}`);
  }

  // URL validation
  const urlFields = [
    'original_url',
    'mask_url',
    'final_url',
    'mask_supabase_url',
    'final_supabase_url',
  ];
  urlFields.forEach((field) => {
    if (record[field] && !isValidUrl(record[field])) {
      errors.push(`Invalid URL format for ${field}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

/**
 * Export all constants and functions
 */
export default {
  PROCESSED_IMAGES_SCHEMA,
  STATUS_FLOW,
  STATUS_TRANSITIONS,
  REQUIRED_INDEXES,
  RLS_POLICIES,
  MIGRATION_SQL,
  FIELD_MAPPING,
  isValidStatusTransition,
  getNextValidStatuses,
  isTerminalStatus,
  validateProcessedImageRecord,
};
