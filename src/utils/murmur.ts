// @ts-nocheck
// welcome to very much cursed land.
// this is a specifically optimized murmurhash3_32bit implementation that runs _very_ fast on CPU

// Create a local object that'll be exported or referenced globally.
const library = {
  version: '3.0.0',
  x86: {},
  x64: {},
  inputValidation: true,
}

// PRIVATE FUNCTIONS
// -----------------

function _validBytes(bytes: number[]) {
  // check the input is an array or a typed array
  if (!Array.isArray(bytes) && !ArrayBuffer.isView(bytes)) {
    return false
  }

  // check all bytes are actually bytes
  for (let i = 0; i < bytes.length; i++) {
    if (!Number.isInteger(bytes[i]) || bytes[i] < 0 || bytes[i] > 255) {
      return false
    }
  }
  return true
}

function _x86Multiply(m: number, n: number) {
  //
  // Given two 32bit ints, returns the two multiplied together as a
  // 32bit int.
  //

  return (m & 0xffff) * n + ((((m >>> 16) * n) & 0xffff) << 16)
}

function _x86Rotl(m: number, n: number) {
  //
  // Given a 32bit int and an int representing a number of bit positions,
  // returns the 32bit int rotated left by that number of positions.
  //

  return (m << n) | (m >>> (32 - n))
}

function _x86Fmix(h: number) {
  //
  // Given a block, returns murmurHash3's final x86 mix of that block.
  //

  h ^= h >>> 16
  h = _x86Multiply(h, 0x85ebca6b)
  h ^= h >>> 13
  h = _x86Multiply(h, 0xc2b2ae35)
  h ^= h >>> 16

  return h
}

function _x64Add(m: any[], n: any[]) {
  //
  // Given two 64bit ints (as an array of two 32bit ints) returns the two
  // added together as a 64bit int (as an array of two 32bit ints).
  //

  m = [m[0] >>> 16, m[0] & 0xffff, m[1] >>> 16, m[1] & 0xffff]
  n = [n[0] >>> 16, n[0] & 0xffff, n[1] >>> 16, n[1] & 0xffff]
  const o = [0, 0, 0, 0]

  o[3] += m[3] + n[3]
  o[2] += o[3] >>> 16
  o[3] &= 0xffff

  o[2] += m[2] + n[2]
  o[1] += o[2] >>> 16
  o[2] &= 0xffff

  o[1] += m[1] + n[1]
  o[0] += o[1] >>> 16
  o[1] &= 0xffff

  o[0] += m[0] + n[0]
  o[0] &= 0xffff

  return [(o[0] << 16) | o[1], (o[2] << 16) | o[3]]
}

function _x64Multiply(m: any[], n: number[]) {
  //
  // Given two 64bit ints (as an array of two 32bit ints) returns the two
  // multiplied together as a 64bit int (as an array of two 32bit ints).
  //

  m = [m[0] >>> 16, m[0] & 0xffff, m[1] >>> 16, m[1] & 0xffff]
  n = [n[0] >>> 16, n[0] & 0xffff, n[1] >>> 16, n[1] & 0xffff]
  const o = [0, 0, 0, 0]

  o[3] += m[3] * n[3]
  o[2] += o[3] >>> 16
  o[3] &= 0xffff

  o[2] += m[2] * n[3]
  o[1] += o[2] >>> 16
  o[2] &= 0xffff

  o[2] += m[3] * n[2]
  o[1] += o[2] >>> 16
  o[2] &= 0xffff

  o[1] += m[1] * n[3]
  o[0] += o[1] >>> 16
  o[1] &= 0xffff

  o[1] += m[2] * n[2]
  o[0] += o[1] >>> 16
  o[1] &= 0xffff

  o[1] += m[3] * n[1]
  o[0] += o[1] >>> 16
  o[1] &= 0xffff

  o[0] += m[0] * n[3] + m[1] * n[2] + m[2] * n[1] + m[3] * n[0]
  o[0] &= 0xffff

  return [(o[0] << 16) | o[1], (o[2] << 16) | o[3]]
}

function _x64Rotl(m: any[], n: number) {
  //
  // Given a 64bit int (as an array of two 32bit ints) and an int
  // representing a number of bit positions, returns the 64bit int (as an
  // array of two 32bit ints) rotated left by that number of positions.
  //

  n %= 64

  if (n === 32) {
    return [m[1], m[0]]
  } else if (n < 32) {
    return [(m[0] << n) | (m[1] >>> (32 - n)), (m[1] << n) | (m[0] >>> (32 - n))]
  } else {
    n -= 32
    return [(m[1] << n) | (m[0] >>> (32 - n)), (m[0] << n) | (m[1] >>> (32 - n))]
  }
}

function _x64LeftShift(m: any[], n: number) {
  //
  // Given a 64bit int (as an array of two 32bit ints) and an int
  // representing a number of bit positions, returns the 64bit int (as an
  // array of two 32bit ints) shifted left by that number of positions.
  //

  n %= 64

  if (n === 0) {
    return m
  } else if (n < 32) {
    return [(m[0] << n) | (m[1] >>> (32 - n)), m[1] << n]
  } else {
    return [m[1] << (n - 32), 0]
  }
}

function _x64Xor(m: any[], n: any[]) {
  //
  // Given two 64bit ints (as an array of two 32bit ints) returns the two
  // xored together as a 64bit int (as an array of two 32bit ints).
  //

  return [m[0] ^ n[0], m[1] ^ n[1]]
}

function _x64Fmix(h: any[]) {
  //
  // Given a block, returns murmurHash3's final x64 mix of that block.
  // (`[0, h[0] >>> 1]` is a 33 bit unsigned right shift. This is the
  // only place where we need to right shift 64bit ints.)
  //

  h = _x64Xor(h, [0, h[0] >>> 1])
  h = _x64Multiply(h, [0xff51afd7, 0xed558ccd])
  h = _x64Xor(h, [0, h[0] >>> 1])
  h = _x64Multiply(h, [0xc4ceb9fe, 0x1a85ec53])
  h = _x64Xor(h, [0, h[0] >>> 1])

  return h
}

// PUBLIC FUNCTIONS
// ----------------

const hash32 = (bytes: number[], seed: number) => {
  //
  // Given a string and an optional seed as an int, returns a 32 bit hash
  // using the x86 flavor of MurmurHash3, as an unsigned int.
  //
  if (library.inputValidation && !_validBytes(bytes)) {
    return undefined
  }
  seed = seed || 0

  const remainder = bytes.length % 4
  const blocks = bytes.length - remainder

  let h1 = seed

  let k1 = 0

  const c1 = 0xcc9e2d51
  const c2 = 0x1b873593
  let i = 0

  for (i = 0; i < blocks; i = i + 4) {
    k1 = bytes[i] | (bytes[i + 1] << 8) | (bytes[i + 2] << 16) | (bytes[i + 3] << 24)

    k1 = _x86Multiply(k1, c1)
    k1 = _x86Rotl(k1, 15)
    k1 = _x86Multiply(k1, c2)

    h1 ^= k1
    h1 = _x86Rotl(h1, 13)
    h1 = _x86Multiply(h1, 5) + 0xe6546b64
  }

  k1 = 0

  switch (remainder) {
    case 3:
      k1 ^= bytes[i + 2] << 16
    case 2:
      k1 ^= bytes[i + 1] << 8
    case 1:
      k1 ^= bytes[i]
      k1 = _x86Multiply(k1, c1)
      k1 = _x86Rotl(k1, 15)
      k1 = _x86Multiply(k1, c2)
      h1 ^= k1
  }

  h1 ^= bytes.length
  h1 = _x86Fmix(h1)

  return h1 >>> 0
}

export const hash128x86 = (bytes: number[], seed: number) => {
  //
  // Given a string and an optional seed as an int, returns a 128 bit
  // hash using the x86 flavor of MurmurHash3, as an unsigned hex.
  //
  if (library.inputValidation && !_validBytes(bytes)) {
    return undefined
  }

  seed = seed || 0
  const remainder = bytes.length % 16
  const blocks = bytes.length - remainder

  let h1 = seed
  let h2 = seed
  let h3 = seed
  let h4 = seed

  let k1 = 0
  let k2 = 0
  let k3 = 0
  let k4 = 0

  const c1 = 0x239b961b
  const c2 = 0xab0e9789
  const c3 = 0x38b34ae5
  const c4 = 0xa1e38b93

  let i = 0
  for (i = 0; i < blocks; i = i + 16) {
    k1 = bytes[i] | (bytes[i + 1] << 8) | (bytes[i + 2] << 16) | (bytes[i + 3] << 24)
    k2 = bytes[i + 4] | (bytes[i + 5] << 8) | (bytes[i + 6] << 16) | (bytes[i + 7] << 24)
    k3 = bytes[i + 8] | (bytes[i + 9] << 8) | (bytes[i + 10] << 16) | (bytes[i + 11] << 24)
    k4 = bytes[i + 12] | (bytes[i + 13] << 8) | (bytes[i + 14] << 16) | (bytes[i + 15] << 24)

    k1 = _x86Multiply(k1, c1)
    k1 = _x86Rotl(k1, 15)
    k1 = _x86Multiply(k1, c2)
    h1 ^= k1

    h1 = _x86Rotl(h1, 19)
    h1 += h2
    h1 = _x86Multiply(h1, 5) + 0x561ccd1b

    k2 = _x86Multiply(k2, c2)
    k2 = _x86Rotl(k2, 16)
    k2 = _x86Multiply(k2, c3)
    h2 ^= k2

    h2 = _x86Rotl(h2, 17)
    h2 += h3
    h2 = _x86Multiply(h2, 5) + 0x0bcaa747

    k3 = _x86Multiply(k3, c3)
    k3 = _x86Rotl(k3, 17)
    k3 = _x86Multiply(k3, c4)
    h3 ^= k3

    h3 = _x86Rotl(h3, 15)
    h3 += h4
    h3 = _x86Multiply(h3, 5) + 0x96cd1c35

    k4 = _x86Multiply(k4, c4)
    k4 = _x86Rotl(k4, 18)
    k4 = _x86Multiply(k4, c1)
    h4 ^= k4

    h4 = _x86Rotl(h4, 13)
    h4 += h1
    h4 = _x86Multiply(h4, 5) + 0x32ac3b17
  }

  k1 = 0
  k2 = 0
  k3 = 0
  k4 = 0

  switch (remainder) {
    case 15:
      k4 ^= bytes[i + 14] << 16
    case 14:
      k4 ^= bytes[i + 13] << 8
    case 13:
      k4 ^= bytes[i + 12]
      k4 = _x86Multiply(k4, c4)
      k4 = _x86Rotl(k4, 18)
      k4 = _x86Multiply(k4, c1)
      h4 ^= k4
    case 12:
      k3 ^= bytes[i + 11] << 24
    case 11:
      k3 ^= bytes[i + 10] << 16
    case 10:
      k3 ^= bytes[i + 9] << 8
    case 9:
      k3 ^= bytes[i + 8]
      k3 = _x86Multiply(k3, c3)
      k3 = _x86Rotl(k3, 17)
      k3 = _x86Multiply(k3, c4)
      h3 ^= k3
    case 8:
      k2 ^= bytes[i + 7] << 24
    case 7:
      k2 ^= bytes[i + 6] << 16
    case 6:
      k2 ^= bytes[i + 5] << 8
    case 5:
      k2 ^= bytes[i + 4]
      k2 = _x86Multiply(k2, c2)
      k2 = _x86Rotl(k2, 16)
      k2 = _x86Multiply(k2, c3)
      h2 ^= k2
    case 4:
      k1 ^= bytes[i + 3] << 24
    case 3:
      k1 ^= bytes[i + 2] << 16
    case 2:
      k1 ^= bytes[i + 1] << 8
    case 1:
      k1 ^= bytes[i]
      k1 = _x86Multiply(k1, c1)
      k1 = _x86Rotl(k1, 15)
      k1 = _x86Multiply(k1, c2)
      h1 ^= k1
  }

  h1 ^= bytes.length
  h2 ^= bytes.length
  h3 ^= bytes.length
  h4 ^= bytes.length

  h1 += h2
  h1 += h3
  h1 += h4
  h2 += h1
  h3 += h1
  h4 += h1

  h1 = _x86Fmix(h1)
  h2 = _x86Fmix(h2)
  h3 = _x86Fmix(h3)
  h4 = _x86Fmix(h4)

  h1 += h2
  h1 += h3
  h1 += h4
  h2 += h1
  h3 += h1
  h4 += h1

  return (
    ('00000000' + (h1 >>> 0).toString(16)).slice(-8) +
    ('00000000' + (h2 >>> 0).toString(16)).slice(-8) +
    ('00000000' + (h3 >>> 0).toString(16)).slice(-8) +
    ('00000000' + (h4 >>> 0).toString(16)).slice(-8)
  )
}

export const hash128x64 = (bytes: number[], seed: number) => {
  //
  // Given a string and an optional seed as an int, returns a 128 bit
  // hash using the x64 flavor of MurmurHash3, as an unsigned hex.
  //
  if (library.inputValidation && !_validBytes(bytes)) {
    return undefined
  }
  seed = seed || 0

  const remainder = bytes.length % 16
  const blocks = bytes.length - remainder

  let h1 = [0, seed]
  let h2 = [0, seed]

  let k1 = [0, 0]
  let k2 = [0, 0]

  const c1 = [0x87c37b91, 0x114253d5]
  const c2 = [0x4cf5ad43, 0x2745937f]

  let i = 0
  for (i = 0; i < blocks; i = i + 16) {
    k1 = [
      bytes[i + 4] | (bytes[i + 5] << 8) | (bytes[i + 6] << 16) | (bytes[i + 7] << 24),
      bytes[i] | (bytes[i + 1] << 8) | (bytes[i + 2] << 16) | (bytes[i + 3] << 24),
    ]
    k2 = [
      bytes[i + 12] | (bytes[i + 13] << 8) | (bytes[i + 14] << 16) | (bytes[i + 15] << 24),
      bytes[i + 8] | (bytes[i + 9] << 8) | (bytes[i + 10] << 16) | (bytes[i + 11] << 24),
    ]

    k1 = _x64Multiply(k1, c1)
    k1 = _x64Rotl(k1, 31)
    k1 = _x64Multiply(k1, c2)
    h1 = _x64Xor(h1, k1)

    h1 = _x64Rotl(h1, 27)
    h1 = _x64Add(h1, h2)
    h1 = _x64Add(_x64Multiply(h1, [0, 5]), [0, 0x52dce729])

    k2 = _x64Multiply(k2, c2)
    k2 = _x64Rotl(k2, 33)
    k2 = _x64Multiply(k2, c1)
    h2 = _x64Xor(h2, k2)

    h2 = _x64Rotl(h2, 31)
    h2 = _x64Add(h2, h1)
    h2 = _x64Add(_x64Multiply(h2, [0, 5]), [0, 0x38495ab5])
  }

  k1 = [0, 0]
  k2 = [0, 0]

  switch (remainder) {
    case 15:
      k2 = _x64Xor(k2, _x64LeftShift([0, bytes[i + 14]], 48))
    case 14:
      k2 = _x64Xor(k2, _x64LeftShift([0, bytes[i + 13]], 40))
    case 13:
      k2 = _x64Xor(k2, _x64LeftShift([0, bytes[i + 12]], 32))
    case 12:
      k2 = _x64Xor(k2, _x64LeftShift([0, bytes[i + 11]], 24))
    case 11:
      k2 = _x64Xor(k2, _x64LeftShift([0, bytes[i + 10]], 16))
    case 10:
      k2 = _x64Xor(k2, _x64LeftShift([0, bytes[i + 9]], 8))
    case 9:
      k2 = _x64Xor(k2, [0, bytes[i + 8]])
      k2 = _x64Multiply(k2, c2)
      k2 = _x64Rotl(k2, 33)
      k2 = _x64Multiply(k2, c1)
      h2 = _x64Xor(h2, k2)
    case 8:
      k1 = _x64Xor(k1, _x64LeftShift([0, bytes[i + 7]], 56))
    case 7:
      k1 = _x64Xor(k1, _x64LeftShift([0, bytes[i + 6]], 48))
    case 6:
      k1 = _x64Xor(k1, _x64LeftShift([0, bytes[i + 5]], 40))
    case 5:
      k1 = _x64Xor(k1, _x64LeftShift([0, bytes[i + 4]], 32))
    case 4:
      k1 = _x64Xor(k1, _x64LeftShift([0, bytes[i + 3]], 24))
    case 3:
      k1 = _x64Xor(k1, _x64LeftShift([0, bytes[i + 2]], 16))
    case 2:
      k1 = _x64Xor(k1, _x64LeftShift([0, bytes[i + 1]], 8))
    case 1:
      k1 = _x64Xor(k1, [0, bytes[i]])
      k1 = _x64Multiply(k1, c1)
      k1 = _x64Rotl(k1, 31)
      k1 = _x64Multiply(k1, c2)
      h1 = _x64Xor(h1, k1)
  }

  h1 = _x64Xor(h1, [0, bytes.length])
  h2 = _x64Xor(h2, [0, bytes.length])

  h1 = _x64Add(h1, h2)
  h2 = _x64Add(h2, h1)

  h1 = _x64Fmix(h1)
  h2 = _x64Fmix(h2)

  h1 = _x64Add(h1, h2)
  h2 = _x64Add(h2, h1)

  return (
    ('00000000' + (h1[0] >>> 0).toString(16)).slice(-8) +
    ('00000000' + (h1[1] >>> 0).toString(16)).slice(-8) +
    ('00000000' + (h2[0] >>> 0).toString(16)).slice(-8) +
    ('00000000' + (h2[1] >>> 0).toString(16)).slice(-8)
  )
}

export const hash32String = (text: string, seed: number) => hash32([...new TextEncoder().encode(text)], seed)
