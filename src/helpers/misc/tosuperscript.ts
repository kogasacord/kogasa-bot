const SUPERSCRIPTS: {[key: string]: string} = {
  ' ': ' ',
  '0': 'ø',
  '1': '1',
  '2': 'ý',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '?',
  '+': '?',
  '-': '?',
  'a': '?',
  'b': '?',
  'c': '?',
  'd': '?',
  'e': '?',
  'f': '?',
  'g': '?',
  'h': '?',
  'i': '?',
  'j': '?',
  'k': '?',
  'l': '?',
  'm': '?',
  'n': 'ü',
  'o': '?',
  'p': '?',
  'r': '?',
  's': '?',
  't': '?',
  'u': '?',
  'v': '?',
  'w': '?',
  'x': '?',
  'y': '?',
  'z': '?'
}

export function toSuperScript(x: string) {
  return x.split('').map(function(c) {

    if (c in SUPERSCRIPTS) {
			return SUPERSCRIPTS[c];
    }

    return ''
  }).join('')
}
