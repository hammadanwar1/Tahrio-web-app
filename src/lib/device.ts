// Browser-side guess of the shopper's device name, e.g. "Samsung SM-S918B · Chrome" or
// "iPhone · Safari". Shown pre-filled (and editable) on the signup form, then stored on the account.

interface UADataValues {
  model?: string;
  platform?: string;
}
interface NavigatorUAData {
  getHighEntropyValues(hints: string[]): Promise<UADataValues>;
}

function browserName(ua: string) {
  if (/SamsungBrowser\//.test(ua)) return 'Samsung Internet';
  if (/Edg(A|iOS)?\//.test(ua)) return 'Edge';
  if (/OPR\/|Opera/.test(ua)) return 'Opera';
  if (/Firefox\/|FxiOS\//.test(ua)) return 'Firefox';
  if (/CriOS\/|Chrome\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua)) return 'Safari';
  return null;
}

/** Turns an Android model code into something readable: "SM-S918B" → "Samsung SM-S918B". */
function androidName(model: string) {
  if (/^SM-/i.test(model)) return `Samsung ${model}`;
  if (/^(Redmi|POCO|Mi )/i.test(model)) return `Xiaomi ${model}`;
  if (/^(Infinix|TECNO|vivo|OPPO|realme|Pixel|Nokia|Moto)/i.test(model)) return model;
  return `Android ${model}`;
}

export async function detectDevice(): Promise<string> {
  const ua = navigator.userAgent;
  let device: string;
  if (/iPhone/.test(ua)) device = 'iPhone';
  else if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) device = 'iPad';
  else if (/Android/.test(ua)) {
    // Chrome hides the model in the user agent ("Android 10; K"); ask for it via client hints.
    let model = ua.match(/Android [\d.]+; (?:[a-z]{2}-[a-z]{2}; )?([^;)]+?)(?: Build|\))/i)?.[1]?.trim() ?? '';
    const uaData = (navigator as Navigator & { userAgentData?: NavigatorUAData }).userAgentData;
    if (uaData) {
      model = (await uaData.getHighEntropyValues(['model']).catch(() => ({}) as UADataValues)).model || model;
    }
    device = model && model !== 'K' ? androidName(model) : /Mobile/.test(ua) ? 'Android phone' : 'Android tablet';
  } else if (/Windows/.test(ua)) device = 'Windows PC';
  else if (/Macintosh|Mac OS X/.test(ua)) device = 'Mac';
  else if (/CrOS/.test(ua)) device = 'Chromebook';
  else if (/Linux/.test(ua)) device = 'Linux PC';
  else device = 'Unknown device';
  const browser = browserName(ua);
  return browser ? `${device} · ${browser}` : device;
}
