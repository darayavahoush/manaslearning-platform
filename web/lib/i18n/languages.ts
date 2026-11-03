// Single source of truth for the site languages: 22 scheduled Indian languages + French + German (+ English).
// mt = which machine-translation provider handles the language. Azure Translator covers 20 of the 22 Indian
// languages; Sanskrit and Santali go to Sarvam Translate. tts = the Azure neural voice used for audio.
// approx = no native voice exists, so the closest voice that can read the same script is used.
export type Lang = {
  code: string
  name: string
  native: string
  rtl?: boolean
  mt: 'azure' | 'sarvam'
  mtCode: string
  font?: string
  tts?: {voice: string; locale: string; approx?: boolean}
}

const DEV = 'Noto Sans Devanagari'
const HI = {voice: 'hi-IN-SwaraNeural', locale: 'hi-IN'}
const UR = {voice: 'ur-IN-GulNeural', locale: 'ur-IN'}

export const LANGS: Lang[] = [
  {code: 'en', name: 'English', native: 'English', mt: 'azure', mtCode: 'en', tts: {voice: 'en-IN-NeerjaNeural', locale: 'en-IN'}},
  {code: 'as', name: 'Assamese', native: 'অসমীয়া', mt: 'azure', mtCode: 'as', font: 'Noto Sans Bengali', tts: {voice: 'as-IN-YashicaNeural', locale: 'as-IN'}},
  {code: 'bn', name: 'Bengali', native: 'বাংলা', mt: 'azure', mtCode: 'bn', font: 'Noto Sans Bengali', tts: {voice: 'bn-IN-TanishaaNeural', locale: 'bn-IN'}},
  {code: 'brx', name: 'Bodo', native: 'बड़ो', mt: 'azure', mtCode: 'brx', font: DEV, tts: {...HI, approx: true}},
  {code: 'doi', name: 'Dogri', native: 'डोगरी', mt: 'azure', mtCode: 'doi', font: DEV, tts: {...HI, approx: true}},
  {code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', mt: 'azure', mtCode: 'gu', font: 'Noto Sans Gujarati', tts: {voice: 'gu-IN-DhwaniNeural', locale: 'gu-IN'}},
  {code: 'hi', name: 'Hindi', native: 'हिन्दी', mt: 'azure', mtCode: 'hi', font: DEV, tts: HI},
  {code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', mt: 'azure', mtCode: 'kn', font: 'Noto Sans Kannada', tts: {voice: 'kn-IN-SapnaNeural', locale: 'kn-IN'}},
  {code: 'ks', name: 'Kashmiri', native: 'کٲشُر', rtl: true, mt: 'azure', mtCode: 'ks', font: 'Noto Naskh Arabic', tts: {...UR, approx: true}},
  {code: 'kok', name: 'Konkani', native: 'कोंकणी', mt: 'azure', mtCode: 'gom', font: DEV, tts: {...HI, approx: true}},
  {code: 'mai', name: 'Maithili', native: 'मैथिली', mt: 'azure', mtCode: 'mai', font: DEV, tts: {...HI, approx: true}},
  {code: 'ml', name: 'Malayalam', native: 'മലയാളം', mt: 'azure', mtCode: 'ml', font: 'Noto Sans Malayalam', tts: {voice: 'ml-IN-SobhanaNeural', locale: 'ml-IN'}},
  {code: 'mni', name: 'Manipuri (Meitei)', native: 'ꯃꯩꯇꯩꯂꯣꯟ', mt: 'azure', mtCode: 'mni', font: 'Noto Sans Meetei Mayek'},
  {code: 'mr', name: 'Marathi', native: 'मराठी', mt: 'azure', mtCode: 'mr', font: DEV, tts: {voice: 'mr-IN-AarohiNeural', locale: 'mr-IN'}},
  {code: 'ne', name: 'Nepali', native: 'नेपाली', mt: 'azure', mtCode: 'ne', font: DEV, tts: {voice: 'ne-NP-HemkalaNeural', locale: 'ne-NP'}},
  {code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', mt: 'azure', mtCode: 'or', font: 'Noto Sans Oriya', tts: {voice: 'or-IN-SubhasiniNeural', locale: 'or-IN'}},
  {code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', mt: 'azure', mtCode: 'pa', font: 'Noto Sans Gurmukhi', tts: {voice: 'pa-IN-VaaniNeural', locale: 'pa-IN'}},
  {code: 'sa', name: 'Sanskrit', native: 'संस्कृतम्', mt: 'sarvam', mtCode: 'sa-IN', font: DEV, tts: {...HI, approx: true}},
  {code: 'sat', name: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ', mt: 'sarvam', mtCode: 'sat-IN', font: 'Noto Sans Ol Chiki'},
  {code: 'sd', name: 'Sindhi', native: 'سنڌي', rtl: true, mt: 'azure', mtCode: 'sd', font: 'Noto Naskh Arabic', tts: {...UR, approx: true}},
  {code: 'ta', name: 'Tamil', native: 'தமிழ்', mt: 'azure', mtCode: 'ta', font: 'Noto Sans Tamil', tts: {voice: 'ta-IN-PallaviNeural', locale: 'ta-IN'}},
  {code: 'te', name: 'Telugu', native: 'తెలుగు', mt: 'azure', mtCode: 'te', font: 'Noto Sans Telugu', tts: {voice: 'te-IN-ShrutiNeural', locale: 'te-IN'}},
  {code: 'ur', name: 'Urdu', native: 'اردو', rtl: true, mt: 'azure', mtCode: 'ur', font: 'Noto Naskh Arabic', tts: UR},
  {code: 'fr', name: 'French', native: 'Français', mt: 'azure', mtCode: 'fr', tts: {voice: 'fr-FR-DeniseNeural', locale: 'fr-FR'}},
  {code: 'de', name: 'German', native: 'Deutsch', mt: 'azure', mtCode: 'de', tts: {voice: 'de-DE-KatjaNeural', locale: 'de-DE'}},
]

export const byCode = (code: string) => LANGS.find((l) => l.code === code)
