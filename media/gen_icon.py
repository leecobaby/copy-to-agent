#!/usr/bin/env python3
"""Generate a 128x128 marketplace icon without third-party deps."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

SIZE = 128


def chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def write_png(path: Path, pixels: bytearray) -> None:
    raw = b"".join(b"\x00" + pixels[y * SIZE * 4 : (y + 1) * SIZE * 4] for y in range(SIZE))
    payload = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )
    path.write_bytes(payload)


def mix(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))  # type: ignore[return-value]


def rounded_rect(px: int, py: int, w: int, h: int, r: int, x: int, y: int) -> bool:
    if x < px or y < py or x >= px + w or y >= py + h:
        return False
    dx = min(x - px, px + w - 1 - x)
    dy = min(y - py, py + h - 1 - y)
    if dx < r and dy < r:
        return (r - dx) ** 2 + (r - dy) ** 2 <= r * r
    return True


def main() -> None:
    bg = (22, 22, 28)
    card = (245, 246, 248)
    clip = (124, 106, 247)
    line = (124, 106, 247)
    pixels = bytearray(SIZE * SIZE * 4)

    for y in range(SIZE):
        for x in range(SIZE):
            color = bg
            if rounded_rect(4, 4, 120, 120, 28, x, y):
                color = (18, 18, 24)
            if rounded_rect(36, 28, 56, 76, 10, x, y):
                color = card
            if rounded_rect(50, 18, 28, 18, 6, x, y):
                color = clip
            if rounded_rect(54, 22, 20, 10, 4, x, y):
                color = card
            for i, ly in enumerate((48, 62, 76)):
                if 48 <= x <= 80 and ly <= y <= ly + 5:
                    color = mix(line, card, 0.15 * i)
            if (x - 96) ** 2 + (y - 96) ** 2 <= 10**2:
                color = clip
            idx = (y * SIZE + x) * 4
            pixels[idx : idx + 4] = bytes((*color, 255))

    out = Path(__file__).resolve().parent / "icon.png"
    write_png(out, pixels)
    print(f"wrote {out} ({out.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
