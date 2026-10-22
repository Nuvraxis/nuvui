// Makes the models the tests, the docs and the website show, from shapes
// built here: boxes, cylinders, shapes turned on a lathe and outlines
// pushed out into solids. Nothing is downloaded. The glTF files are written
// by hand from their specification, the Meshopt ones are compressed with
// meshoptimizer, and the KTX2 textures are encoded with ktx2-encoder.
//
//   node packages/3d/scripts/make-models.mjs <out>
//
// <out>/fixtures has the small models the tests load, and <out>/site the
// ones the docs and the website serve.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";
import { encodeToKTX2 } from "ktx2-encoder";
import { MeshoptEncoder } from "meshoptimizer/encoder";

const out = process.argv[2];
if (!out) throw new Error("Say where to write the models.");

// ---------------------------------------------------------------- shapes
// A shape is positions, normals and texture coordinates, three, three and
// two numbers a corner, and the corners of its triangles, counterclockwise
// seen from outside.

function shape() {
  return { positions: [], normals: [], uvs: [], indices: [] };
}

function corner(into, position, normal, uv) {
  into.positions.push(...position);
  into.normals.push(...normal);
  into.uvs.push(...uv);
  return into.positions.length / 3 - 1;
}

/** Puts `part`, moved by `offset`, into `into`. */
function add(into, part, [dx, dy, dz] = [0, 0, 0]) {
  const start = into.positions.length / 3;
  for (let i = 0; i < part.positions.length; i += 3) {
    into.positions.push(
      part.positions[i] + dx,
      part.positions[i + 1] + dy,
      part.positions[i + 2] + dz,
    );
  }
  into.normals.push(...part.normals);
  into.uvs.push(...part.uvs);
  into.indices.push(...part.indices.map((index) => index + start));
  return into;
}

/** A box of the given width, height and depth, centered on the origin. */
function box(width, height, depth) {
  const into = shape();
  const [x, y, z] = [width / 2, height / 2, depth / 2];
  // Each face: its normal, and the axes along it to the right and up.
  const faces = [
    [
      [0, 0, 1],
      [1, 0, 0],
      [0, 1, 0],
    ],
    [
      [0, 0, -1],
      [-1, 0, 0],
      [0, 1, 0],
    ],
    [
      [1, 0, 0],
      [0, 0, -1],
      [0, 1, 0],
    ],
    [
      [-1, 0, 0],
      [0, 0, 1],
      [0, 1, 0],
    ],
    [
      [0, 1, 0],
      [1, 0, 0],
      [0, 0, -1],
    ],
    [
      [0, -1, 0],
      [1, 0, 0],
      [0, 0, 1],
    ],
  ];
  const half = [x, y, z];
  for (const [normal, right, up] of faces) {
    const at = (u, v) =>
      [0, 1, 2].map(
        (axis) => (normal[axis] + right[axis] * u + up[axis] * v) * half[axis],
      );
    const a = corner(into, at(-1, -1), normal, [0, 0]);
    const b = corner(into, at(1, -1), normal, [1, 0]);
    const c = corner(into, at(1, 1), normal, [1, 1]);
    const d = corner(into, at(-1, 1), normal, [0, 1]);
    into.indices.push(a, b, c, a, c, d);
  }
  return into;
}

/**
 * A solid turned on a lathe: `profile` is [radius, height] points from
 * the bottom up. A point with radius 0 closes the solid there.
 */
function lathe(profile, segments) {
  const into = shape();
  const rings = profile.length;
  // A normal for each point of the profile, from the edges either side.
  const normals = profile.map((_, i) => {
    const before = profile[Math.max(i - 1, 0)];
    const after = profile[Math.min(i + 1, rings - 1)];
    const dr = after[0] - before[0];
    const dy = after[1] - before[1];
    const length = Math.hypot(dr, dy) || 1;
    return [dy / length, -dr / length];
  });
  for (let i = 0; i < rings; i++) {
    const [radius, height] = profile[i];
    const [nr, ny] = normals[i];
    for (let s = 0; s <= segments; s++) {
      const angle = (s / segments) * Math.PI * 2;
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);
      corner(
        into,
        [radius * sin, height, radius * cos],
        [nr * sin, ny, nr * cos],
        [s / segments, i / (rings - 1)],
      );
    }
  }
  const across = segments + 1;
  for (let i = 0; i < rings - 1; i++) {
    for (let s = 0; s < segments; s++) {
      const a = i * across + s;
      const b = a + 1;
      const c = a + across;
      const d = c + 1;
      into.indices.push(a, b, d, a, d, c);
    }
  }
  return into;
}

/**
 * A smooth curve through [radius, height] points, eight steps between each
 * two, for a profile that's turned on a lathe. Each step is a Catmull-Rom
 * spline's point, which passes through every point given.
 */
function curve(points, steps = 8) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push(
        [0, 1].map(
          (k) =>
            0.5 *
            (2 * p1[k] +
              (-p0[k] + p2[k]) * t +
              (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
              (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3),
        ),
      );
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

/** A cylinder, or a cone with a top radius of 0, standing on the origin. */
function cylinder(bottom, top, height, segments) {
  // Points at the middle close the ends, with an edge either side so the
  // ends are flat and the side is round.
  return lathe(
    [
      [0, 0],
      [bottom, 0],
      [bottom, 0],
      [top, height],
      [top, height],
      [0, height],
    ],
    segments,
  );
}

/** A ring of a tube, around the vertical axis. */
function torus(radius, tube, segments, sides, arc = Math.PI * 2, start = 0) {
  const into = shape();
  for (let s = 0; s <= segments; s++) {
    const angle = start + (s / segments) * arc;
    for (let t = 0; t <= sides; t++) {
      const around = (t / sides) * Math.PI * 2;
      const normal = [
        Math.cos(around) * Math.cos(angle),
        Math.sin(around),
        Math.cos(around) * Math.sin(angle),
      ];
      corner(
        into,
        [
          (radius + tube * Math.cos(around)) * Math.cos(angle),
          tube * Math.sin(around),
          (radius + tube * Math.cos(around)) * Math.sin(angle),
        ],
        normal,
        [s / segments, t / sides],
      );
    }
  }
  const across = sides + 1;
  for (let s = 0; s < segments; s++) {
    for (let t = 0; t < sides; t++) {
      const a = s * across + t;
      const b = a + across;
      into.indices.push(a, a + 1, b + 1, a, b + 1, b);
    }
  }
  return into;
}

/**
 * An outline pushed up into a solid `depth` high. The outline is [x, z]
 * points counterclockwise seen from above, and every one of them can be
 * seen from `middle`. With `hole`, a round hole of that radius goes
 * through at the middle, and the outline needs as many points as the hole
 * has, one for each.
 */
function extrude(outline, depth, middle = [0, 0], hole = 0) {
  const into = shape();
  const count = outline.length;
  const inner = outline.map((_, i) => {
    const angle = Math.atan2(
      outline[i][1] - middle[1],
      outline[i][0] - middle[0],
    );
    return [
      middle[0] + hole * Math.cos(angle),
      middle[1] + hole * Math.sin(angle),
    ];
  });
  for (const [y, normal] of [
    [depth, [0, 1, 0]],
    [0, [0, -1, 0]],
  ]) {
    const up = normal[1] > 0;
    const ring = outline.map(([x, z]) =>
      corner(into, [x, y, z], normal, [x, z]),
    );
    if (hole > 0) {
      const holes = inner.map(([x, z]) =>
        corner(into, [x, y, z], normal, [x, z]),
      );
      for (let i = 0; i < count; i++) {
        const j = (i + 1) % count;
        if (up)
          into.indices.push(
            ring[i],
            ring[j],
            holes[j],
            ring[i],
            holes[j],
            holes[i],
          );
        else
          into.indices.push(
            ring[i],
            holes[j],
            ring[j],
            ring[i],
            holes[i],
            holes[j],
          );
      }
    } else {
      const center = corner(into, [middle[0], y, middle[1]], normal, middle);
      for (let i = 0; i < count; i++) {
        const j = (i + 1) % count;
        if (up) into.indices.push(center, ring[i], ring[j]);
        else into.indices.push(center, ring[j], ring[i]);
      }
    }
  }
  // The walls, flat between each two points of the outline, facing out,
  // and those of the hole facing in.
  const wall = (points, outward) => {
    for (let i = 0; i < count; i++) {
      const [x1, z1] = points[i];
      const [x2, z2] = points[(i + 1) % count];
      const length = Math.hypot(x2 - x1, z2 - z1) || 1;
      const sign = outward ? 1 : -1;
      const normal = [
        (sign * (z1 - z2)) / length,
        0,
        (sign * (x2 - x1)) / length,
      ];
      const a = corner(into, [x1, 0, z1], normal, [0, 0]);
      const b = corner(into, [x2, 0, z2], normal, [1, 0]);
      const c = corner(into, [x2, depth, z2], normal, [1, 1]);
      const d = corner(into, [x1, depth, z1], normal, [0, 1]);
      if (outward) into.indices.push(a, b, c, a, c, d);
      else into.indices.push(a, c, b, a, d, c);
    }
  };
  wall(outline, true);
  if (hole > 0) wall(inner, false);
  return into;
}

/** The same shape with its corners turned about the vertical axis. */
function turn(part, angle) {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const spin = (values) => {
    const result = [...values];
    for (let i = 0; i < values.length; i += 3) {
      const x = values[i];
      const z = values[i + 2];
      result[i] = x * cos + z * sin;
      result[i + 2] = -x * sin + z * cos;
    }
    return result;
  };
  return {
    ...part,
    positions: spin(part.positions),
    normals: spin(part.normals),
  };
}

/** The same shape lying down: its height along z, turned about x. */
function layDown(part) {
  const flip = (values) => {
    const result = [...values];
    for (let i = 0; i < values.length; i += 3) {
      result[i + 1] = -values[i + 2];
      result[i + 2] = values[i + 1];
    }
    return result;
  };
  return {
    ...part,
    positions: flip(part.positions),
    normals: flip(part.normals),
  };
}

// ---------------------------------------------------------------- images

/** A PNG of RGBA pixels, `width` by `height`. */
function png(width, height, pixels) {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (bytes) => {
    let c = 0xffffffff;
    for (const byte of bytes) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([length, body, sum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bits a channel
  header[9] = 6; // RGBA
  const rows = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    rows[y * (width * 4 + 1)] = 0;
    Buffer.from(
      pixels.buffer,
      pixels.byteOffset + y * width * 4,
      width * 4,
    ).copy(rows, y * (width * 4 + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** RGBA pixels from a function of x and y that gives [r, g, b] from 0 to 255. */
function paint(size, color) {
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b] = color(x, y);
      pixels.set([r, g, b, 255], (y * size + x) * 4);
    }
  }
  return pixels;
}

const checker = (size, cells, one, other) =>
  paint(size, (x, y) =>
    (Math.floor((x * cells) / size) + Math.floor((y * cells) / size)) % 2
      ? one
      : other,
  );

// Boards of wood across a crate's side, each a little darker or lighter,
// with a grain and a gap between them.
const planks = (size) =>
  paint(size, (x, y) => {
    const board = Math.floor((y / size) * 4);
    const inBoard = ((y / size) * 4) % 1;
    const gap = inBoard < 0.04 || inBoard > 0.96;
    const shade = [0.92, 1, 0.86, 0.97][board];
    const grain =
      0.9 + 0.1 * Math.sin(x * 0.35 + board * 7 + Math.sin(y * 0.2) * 2);
    const edge = x < size * 0.04 || x > size * 0.96 ? 0.7 : 1;
    const k = gap ? 0.45 : shade * grain * edge;
    return [Math.round(196 * k), Math.round(148 * k), Math.round(96 * k)];
  });

async function ktx2(size, pixels) {
  return Buffer.from(
    await encodeToKTX2(new Uint8Array(0), {
      isUASTC: false,
      enableDebug: false,
      generateMipmap: true,
      isSetKTX2SRGBTransferFunc: true,
      qualityLevel: 128,
      imageDecoder: async () => ({ width: size, height: size, data: pixels }),
    }),
  );
}

// ---------------------------------------------------------------- glTF

const FLOAT = 5126;
const UNSIGNED_SHORT = 5123;
const UNSIGNED_INT = 5125;
const ARRAY_BUFFER = 34962;
const ELEMENT_ARRAY_BUFFER = 34963;

const align = (n) => Math.ceil(n / 4) * 4;

// The colors here are written as they look, in sRGB, and a glTF holds
// its colors as linear light.
const linear = (value) =>
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

/**
 * A glTF from a list of parts, each a shape with a material and a place.
 *
 * - `materials`: [{ name, color: [r, g, b] from 0 to 1, metal, rough, image }],
 *   where `image` is the index of one of `images`.
 * - `images`: [{ name, png } or { name, ktx2 }].
 * - `layout`: "glb", "separate" (a .gltf, a .bin and the images beside
 *   it) or "embedded" (all of it in the .gltf).
 * - `meshopt`: compresses the shapes with EXT_meshopt_compression.
 *
 * Returns the files to write, by name.
 */
function gltf(
  name,
  { parts, materials, images = [] },
  { layout, meshopt = false },
) {
  const views = [];
  const accessors = [];
  const chunks = [];
  let length = 0;
  // Compressed data, when Meshopt is on, goes in a buffer of its own.
  const packed = [];
  let packedLength = 0;

  const view = (bytes, target, stride, count, mode) => {
    const offset = length;
    chunks.push(bytes);
    length += bytes.byteLength;
    const pad = align(length) - length;
    if (pad) {
      chunks.push(new Uint8Array(pad));
      length += pad;
    }
    const entry = {
      buffer: 0,
      byteOffset: offset,
      byteLength: bytes.byteLength,
      ...(stride ? { byteStride: stride } : {}),
      ...(target ? { target } : {}),
    };
    if (meshopt && mode) {
      const data = MeshoptEncoder.encodeGltfBuffer(
        new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength),
        count,
        stride,
        mode,
      );
      entry.extensions = {
        EXT_meshopt_compression: {
          buffer: 0,
          byteOffset: packedLength,
          byteLength: data.byteLength,
          byteStride: stride,
          count,
          mode,
        },
      };
      // The view's own place is in the buffer that holds nothing.
      entry.buffer = 1;
      packed.push(data);
      packedLength += data.byteLength;
      const padPacked = align(packedLength) - packedLength;
      if (padPacked) {
        packed.push(new Uint8Array(padPacked));
        packedLength += padPacked;
      }
    }
    views.push(entry);
    return views.length - 1;
  };

  const meshes = parts.map((part) => {
    const { geometry } = part;
    const count = geometry.positions.length / 3;
    const positions = new Float32Array(geometry.positions);
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < positions.length; i++) {
      min[i % 3] = Math.min(min[i % 3], positions[i]);
      max[i % 3] = Math.max(max[i % 3], positions[i]);
    }
    const attribute = (values, size, extra = {}) => {
      const index = view(values, ARRAY_BUFFER, size * 4, count, "ATTRIBUTES");
      accessors.push({
        bufferView: index,
        componentType: FLOAT,
        count,
        type: `VEC${size}`,
        ...extra,
      });
      return accessors.length - 1;
    };
    const POSITION = attribute(positions, 3, { min, max });
    const NORMAL = attribute(new Float32Array(geometry.normals), 3);
    const TEXCOORD_0 = attribute(new Float32Array(geometry.uvs), 2);
    const wide = count > 65535;
    const indices = wide
      ? new Uint32Array(geometry.indices)
      : new Uint16Array(geometry.indices);
    const indexView = view(
      indices,
      ELEMENT_ARRAY_BUFFER,
      meshopt ? (wide ? 4 : 2) : 0,
      geometry.indices.length,
      "TRIANGLES",
    );
    // Only vertex attributes have a stride. Meshopt's own copy keeps it.
    delete views[indexView].byteStride;
    accessors.push({
      bufferView: indexView,
      componentType: wide ? UNSIGNED_INT : UNSIGNED_SHORT,
      count: geometry.indices.length,
      type: "SCALAR",
    });
    return {
      name: part.name,
      primitives: [
        {
          attributes: { POSITION, NORMAL, TEXCOORD_0 },
          indices: accessors.length - 1,
          material: part.material,
        },
      ],
    };
  });

  const files = {};
  const usesKtx2 = images.some((image) => image.ktx2);
  const imageEntries = images.map((image) => {
    const bytes = image.png ?? image.ktx2;
    const mimeType = image.png ? "image/png" : "image/ktx2";
    if (layout === "separate") {
      const file = `${image.name}.${image.png ? "png" : "ktx2"}`;
      files[file] = bytes;
      return { uri: file };
    }
    if (layout === "embedded") {
      return { uri: `data:${mimeType};base64,${bytes.toString("base64")}` };
    }
    return { bufferView: view(new Uint8Array(bytes), 0), mimeType };
  });

  const binary = Buffer.concat(
    chunks.map((chunk) =>
      Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength),
    ),
  );
  const packedBinary = Buffer.concat(
    packed.map((chunk) =>
      Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength),
    ),
  );
  const extensions = [
    ...(meshopt ? ["EXT_meshopt_compression"] : []),
    ...(usesKtx2 ? ["KHR_texture_basisu"] : []),
  ];

  let buffers;
  if (meshopt) {
    // Buffer 0 holds the compressed data, and buffer 1 is where it goes
    // once it's decoded, and holds nothing in the file.
    buffers = [
      { byteLength: packedBinary.length },
      {
        byteLength: binary.length,
        extensions: { EXT_meshopt_compression: { fallback: true } },
      },
    ];
    // Images aren't compressed, and stay where they are: move them into
    // the packed buffer so buffer 1 is empty.
    for (const entry of views) {
      if (entry.extensions || entry.buffer !== 0) continue;
      const bytes = binary.subarray(
        entry.byteOffset,
        entry.byteOffset + entry.byteLength,
      );
      entry.byteOffset = packedBinary.length + packedTail.length;
      packedTail.push(...bytes);
      while (packedTail.length % 4) packedTail.push(0);
    }
    buffers[0].byteLength = packedBinary.length + packedTail.length;
  } else {
    buffers = [{ byteLength: binary.length }];
  }
  const body = meshopt
    ? Buffer.concat([packedBinary, Buffer.from(packedTail.splice(0))])
    : binary;

  const json = {
    asset: { version: "2.0", generator: "nuvui make-models" },
    ...(extensions.length
      ? { extensionsUsed: extensions, extensionsRequired: extensions }
      : {}),
    scene: 0,
    scenes: [{ nodes: parts.map((_, i) => i) }],
    nodes: parts.map((part, i) => ({
      name: part.name,
      mesh: i,
      ...(part.at ? { translation: part.at } : {}),
    })),
    meshes,
    materials: materials.map((material) => ({
      name: material.name,
      pbrMetallicRoughness: {
        baseColorFactor: [...material.color.map(linear), 1],
        metallicFactor: material.metal ?? 0,
        roughnessFactor: material.rough ?? 0.6,
        ...(material.image !== undefined
          ? { baseColorTexture: { index: material.image } }
          : {}),
      },
    })),
    ...(images.length
      ? {
          samplers: [
            { magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 },
          ],
          images: imageEntries,
          textures: images.map((image, i) =>
            image.ktx2
              ? {
                  sampler: 0,
                  extensions: { KHR_texture_basisu: { source: i } },
                }
              : { sampler: 0, source: i },
          ),
        }
      : {}),
    bufferViews: views,
    accessors,
    buffers,
  };

  if (layout === "glb") {
    const text = Buffer.from(JSON.stringify(json));
    const jsonChunk = Buffer.concat([
      text,
      Buffer.alloc(align(text.length) - text.length, 0x20),
    ]);
    const binChunk = Buffer.concat([
      body,
      Buffer.alloc(align(body.length) - body.length),
    ]);
    const header = Buffer.alloc(12);
    header.writeUInt32LE(0x46546c67, 0);
    header.writeUInt32LE(2, 4);
    header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);
    const chunkHeader = (size, type) => {
      const bytes = Buffer.alloc(8);
      bytes.writeUInt32LE(size, 0);
      bytes.writeUInt32LE(type, 4);
      return bytes;
    };
    files[`${name}.glb`] = Buffer.concat([
      header,
      chunkHeader(jsonChunk.length, 0x4e4f534a),
      jsonChunk,
      chunkHeader(binChunk.length, 0x004e4942),
      binChunk,
    ]);
    return files;
  }
  if (layout === "separate") {
    files[`${name}.bin`] = body;
    json.buffers[0].uri = `${name}.bin`;
  } else {
    json.buffers[0].uri = `data:application/octet-stream;base64,${body.toString("base64")}`;
  }
  files[`${name}.gltf`] = Buffer.from(`${JSON.stringify(json, null, 2)}\n`);
  return files;
}
// Image bytes that move into the packed buffer of a Meshopt file.
const packedTail = [];

// ---------------------------------------------------------------- STL

function triangles(part) {
  const list = [];
  for (let i = 0; i < part.indices.length; i += 3) {
    list.push(
      [0, 1, 2].map((k) => {
        const index = part.indices[i + k] * 3;
        return part.positions.slice(index, index + 3);
      }),
    );
  }
  return list;
}

function normalOf([a, b, c]) {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [
    u[1] * v[2] - u[2] * v[1],
    u[2] * v[0] - u[0] * v[2],
    u[0] * v[1] - u[1] * v[0],
  ];
  const length = Math.hypot(...n) || 1;
  return n.map((value) => value / length);
}

function stlBinary(name, part) {
  const list = triangles(part);
  const bytes = Buffer.alloc(84 + list.length * 50);
  bytes.write(`nuvui ${name}`.padEnd(80, " "), 0, "ascii");
  bytes.writeUInt32LE(list.length, 80);
  list.forEach((triangle, i) => {
    const at = 84 + i * 50;
    [normalOf(triangle), ...triangle].flat().forEach((value, k) => {
      bytes.writeFloatLE(value, at + k * 4);
    });
  });
  return bytes;
}

function stlText(name, part) {
  const number = (value) => Number(value.toFixed(6)).toString();
  const lines = [`solid ${name}`];
  for (const triangle of triangles(part)) {
    lines.push(
      `  facet normal ${normalOf(triangle).map(number).join(" ")}`,
      "    outer loop",
    );
    for (const point of triangle)
      lines.push(`      vertex ${point.map(number).join(" ")}`);
    lines.push("    endloop", "  endfacet");
  }
  lines.push(`endsolid ${name}`, "");
  return Buffer.from(lines.join("\n"));
}

// ---------------------------------------------------------------- models

const write = (dir, files) => {
  mkdirSync(dir, { recursive: true });
  for (const [file, bytes] of Object.entries(files))
    writeFileSync(join(dir, file), bytes);
};

await MeshoptEncoder.ready;

// The tests' models, small, with sizes and counts the tests know.
const fixtures = join(out, "fixtures");
{
  // A box 2 wide, 1 high and half deep, in one painted material: 12
  // triangles, 1 mesh, 1 material, no textures.
  const painted = {
    parts: [{ name: "Box", geometry: box(2, 1, 0.5), material: 0 }],
    materials: [{ name: "Paint", color: [0.85, 0.35, 0.2], rough: 0.5 }],
  };
  write(fixtures, gltf("box", painted, { layout: "glb" }));
  write(
    fixtures,
    gltf("box-meshopt", painted, { layout: "glb", meshopt: true }),
  );

  // A cube with a checked texture: 1 texture.
  const checked = (image) => ({
    parts: [{ name: "Crate", geometry: box(1, 1, 1), material: 0 }],
    materials: [{ name: "Checks", color: [1, 1, 1], rough: 0.7, image: 0 }],
    images: [image],
  });
  const checks = checker(16, 4, [40, 40, 40], [230, 230, 230]);
  write(
    fixtures,
    gltf("crate", checked({ name: "crate", png: png(16, 16, checks) }), {
      layout: "separate",
    }),
  );
  write(
    fixtures,
    gltf(
      "crate-embedded",
      checked({ name: "crate", png: png(16, 16, checks) }),
      { layout: "embedded" },
    ),
  );
  const checks64 = checker(64, 4, [40, 40, 40], [230, 230, 230]);
  write(
    fixtures,
    gltf(
      "crate-ktx2",
      checked({ name: "crate", ktx2: await ktx2(64, checks64) }),
      { layout: "glb" },
    ),
  );

  // Names Draco and has nothing to decode: the viewer says it doesn't
  // read Draco before it reads anything else.
  write(fixtures, {
    "box-draco.gltf": Buffer.from(
      `${JSON.stringify(
        {
          asset: { version: "2.0", generator: "nuvui make-models" },
          extensionsUsed: ["KHR_draco_mesh_compression"],
          extensionsRequired: ["KHR_draco_mesh_compression"],
          scenes: [{ nodes: [] }],
          scene: 0,
        },
        null,
        2,
      )}\n`,
    ),
  });

  // A block 40 by 20 by 10 millimeters: 12 triangles and 8000 cubic
  // millimeters inside.
  const block = add(shape(), box(40, 10, 20));
  write(fixtures, {
    "block.stl": stlBinary("block", block),
    "block-ascii.stl": stlText("block", block),
  });
}

// The models the docs and the website show.
const site = join(out, "site");
{
  const steel = {
    name: "Steel",
    color: [0.72, 0.74, 0.77],
    metal: 1,
    rough: 0.35,
  };
  const black = {
    name: "Black plastic",
    color: [0.06, 0.06, 0.07],
    rough: 0.55,
  };

  // A desk lamp: a weighted base, two arms and a shade.
  const lamp = {
    parts: [
      { name: "Base", geometry: cylinder(0.11, 0.1, 0.03, 48), material: 1 },
      {
        name: "Arm",
        geometry: turn(add(shape(), box(0.02, 0.32, 0.02), [0, 0.16, 0]), 0),
        material: 0,
        at: [0, 0.03, 0],
      },
      {
        name: "Joint",
        geometry: layDown(cylinder(0.022, 0.022, 0.04, 24)),
        material: 1,
        at: [0, 0.35, 0.02],
      },
      {
        name: "Upper arm",
        geometry: add(shape(), box(0.26, 0.02, 0.02), [0.13, 0, 0]),
        material: 0,
        at: [0, 0.35, 0],
      },
      {
        name: "Shade",
        geometry: cylinder(0.08, 0.03, 0.1, 48),
        material: 2,
        at: [0.26, 0.26, 0],
      },
    ],
    materials: [
      steel,
      black,
      { name: "Shade paint", color: [0.95, 0.75, 0.2], rough: 0.4 },
    ],
  };
  write(site, gltf("lamp", lamp, { layout: "glb" }));

  // A chair: a seat, a back and four legs.
  const leg = cylinder(0.018, 0.014, 0.44, 24);
  const chair = {
    parts: [
      {
        name: "Seat",
        geometry: box(0.46, 0.04, 0.44),
        material: 0,
        at: [0, 0.46, 0],
      },
      {
        name: "Back",
        geometry: box(0.46, 0.44, 0.035),
        material: 0,
        at: [0, 0.7, -0.2],
      },
      ...[
        [-0.2, -0.19],
        [0.2, -0.19],
        [-0.2, 0.19],
        [0.2, 0.19],
      ].map(([x, z], i) => ({
        name: `Leg ${i + 1}`,
        geometry: leg,
        material: 1,
        at: [x, 0, z],
      })),
    ],
    materials: [{ name: "Oak", color: [0.62, 0.43, 0.26], rough: 0.65 }, steel],
  };
  write(site, gltf("chair", chair, { layout: "glb" }));
  // The same chair compressed, for the decoders' example.
  write(site, gltf("chair-meshopt", chair, { layout: "glb", meshopt: true }));

  // A mug: a body turned on a lathe, with a handle.
  const mug = {
    parts: [
      {
        name: "Body",
        geometry: lathe(
          [
            [0, 0],
            [0.04, 0],
            [0.042, 0.004],
            [0.042, 0.095],
            [0.039, 0.095],
            [0.038, 0.01],
            [0, 0.01],
          ],
          64,
        ),
        material: 0,
      },
      {
        name: "Handle",
        // Half a ring on the body's right, standing up.
        geometry: layDown(torus(0.026, 0.006, 32, 16, Math.PI, -Math.PI / 2)),
        material: 0,
        at: [0.042, 0.05, 0],
      },
    ],
    materials: [{ name: "Glaze", color: [0.18, 0.42, 0.62], rough: 0.25 }],
  };
  write(site, gltf("mug", mug, { layout: "glb" }));

  // A wooden crate, its boards in a KTX2 texture, and the same with a PNG.
  const boards = planks(256);
  const crate = (image) => ({
    parts: [{ name: "Crate", geometry: box(0.5, 0.5, 0.5), material: 0 }],
    materials: [{ name: "Pine", color: [1, 1, 1], rough: 0.8, image: 0 }],
    images: [image],
  });
  write(
    site,
    gltf("crate", crate({ name: "crate-boards", png: png(256, 256, boards) }), {
      layout: "separate",
    }),
  );
  write(
    site,
    gltf(
      "crate-ktx2",
      crate({ name: "crate-boards", ktx2: await ktx2(256, boards) }),
      { layout: "glb" },
    ),
  );

  // A pump on a plate, for notes on its parts: a plate, the body, the
  // motor, a flange and the pipe out of it.
  const pump = {
    parts: [
      {
        name: "Plate",
        geometry: box(0.6, 0.03, 0.32),
        material: 1,
        at: [0, 0.015, 0],
      },
      {
        name: "Motor",
        geometry: layDown(cylinder(0.09, 0.09, 0.26, 48)),
        material: 0,
        at: [-0.12, 0.13, -0.13],
      },
      {
        name: "Fan cover",
        geometry: layDown(cylinder(0.095, 0.095, 0.03, 48)),
        material: 1,
        at: [-0.12, 0.13, -0.16],
      },
      {
        name: "Pump body",
        geometry: cylinder(0.1, 0.1, 0.16, 48),
        material: 2,
        at: [0.15, 0.03, 0],
      },
      {
        name: "Flange",
        geometry: cylinder(0.06, 0.06, 0.02, 32),
        material: 1,
        at: [0.15, 0.19, 0],
      },
      {
        name: "Outlet",
        geometry: cylinder(0.035, 0.035, 0.12, 32),
        material: 0,
        at: [0.15, 0.21, 0],
      },
    ],
    materials: [
      steel,
      { name: "Cast iron", color: [0.2, 0.21, 0.23], metal: 0.6, rough: 0.6 },
      { name: "Blue paint", color: [0.12, 0.3, 0.6], rough: 0.45 },
    ],
  };
  write(site, gltf("pump", pump, { layout: "glb" }));

  // A vase turned on a lathe, for the library.
  const vase = {
    parts: [
      {
        name: "Vase",
        // Its outside is a smooth curve through the points, and its inside
        // and its base are straight.
        geometry: lathe(
          [
            [0, 0],
            ...curve([
              [0.05, 0],
              [0.08, 0.06],
              [0.085, 0.12],
              [0.06, 0.2],
              [0.035, 0.25],
              [0.045, 0.28],
            ]),
            [0.04, 0.28],
            [0.03, 0.25],
            [0, 0.25],
          ],
          64,
        ),
        material: 0,
      },
    ],
    materials: [{ name: "Terracotta", color: [0.72, 0.38, 0.24], rough: 0.85 }],
  };
  write(site, gltf("vase", vase, { layout: "glb" }));

  // An L-shaped bracket, 40 by 30 millimeters and 20 deep, to print.
  const bracketOutline = [
    [0, 0],
    [40, 0],
    [40, 6],
    [6, 6],
    [6, 30],
    [0, 30],
  ].map(([x, y]) => [x, -y]);
  const bracket = layDown(extrude(bracketOutline, 20, [3, -3]));
  write(site, { "bracket.stl": stlBinary("bracket", bracket) });

  // A gear with 18 teeth and a hole for its shaft, 50 millimeters across.
  const teeth = 18;
  const outline = [];
  for (let i = 0; i < teeth * 4; i++) {
    const angle = (i / (teeth * 4)) * Math.PI * 2;
    const radius = i % 4 === 1 || i % 4 === 2 ? 25 : 21.5;
    outline.push([radius * Math.cos(angle), -radius * Math.sin(angle)]);
  }
  const gear = extrude(outline, 8, [0, 0], 6);
  write(site, { "gear.stl": stlBinary("gear", gear) });
}

console.log(`Written to ${out}`);
