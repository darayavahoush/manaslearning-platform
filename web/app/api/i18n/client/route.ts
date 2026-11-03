import {LANGS} from '@/lib/i18n/languages'
import {CLIENT_BODY} from '@/lib/i18n/client-script'
import {AUDIO_BODY} from '@/lib/i18n/audio-script'
import {CLIP_TRANSCRIPTS} from '@/lib/i18n/transcripts'

// Public registry only: names, scripts and whether a voice exists. No keys or voice names leave the server.
const cfg = {
  langs: LANGS.map((l) => ({code: l.code, name: l.name, native: l.native, rtl: !!l.rtl, font: l.font || '', locale: l.tts?.locale || '', tts: !!l.tts})),
  clips: CLIP_TRANSCRIPTS,
}
const SCRIPT = '(function(){var CFG=' + JSON.stringify(cfg) + ';' + CLIENT_BODY + AUDIO_BODY + '})();'

export function GET() {
  return new Response(SCRIPT, {headers: {'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=300'}})
}
