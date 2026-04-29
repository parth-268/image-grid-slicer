// Re-export module so the registry can dynamic-import the converter
// without pulling JSZip / file-saver into the initial bundle.
export { ConvertLayout as default } from '@/components/ConvertPanel'
