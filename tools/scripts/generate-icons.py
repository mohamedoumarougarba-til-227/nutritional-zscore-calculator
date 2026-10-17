"""Generate the missing geometric PWA icons with Python's standard library."""
import struct
import zlib
from pathlib import Path

target = Path(__file__).resolve().parents[2] / 'src' / 'assets' / 'icons'
target.mkdir(parents=True, exist_ok=True)

def chunk(kind, payload):
    return struct.pack('>I', len(payload)) + kind + payload + struct.pack('>I', zlib.crc32(kind + payload) & 0xffffffff)

for size in (72, 96, 128, 144, 152, 192, 384, 512):
    rows = bytearray()
    for y in range(size):
        rows.append(0)
        for x in range(size):
            nx, ny = x / size, y / size
            # Draw a white Z within the safe central region of a blue icon.
            white = (0.27 <= nx <= 0.73 and (0.27 <= ny <= 0.35 or 0.65 <= ny <= 0.73)) or (0.32 <= ny <= 0.68 and abs(nx + ny - 1) < 0.06)
            rows.extend((255, 255, 255) if white else (33, 150, 243))
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(rows)) + chunk(b'IEND', b'')
    (target / f'icon-{size}.png').write_bytes(png)
print('8 icônes PNG générées localement; aucun téléchargement.')
