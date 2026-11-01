#!/usr/bin/env python3
"""Read-only master audit and candidate-only, seed-anchored strip normalization.

Combines the pinned pixel-art audit with sprite-pipeline's approved-seed,
whole-strip, shared-scale workflow. Never writes into public/art.
"""
import argparse
import hashlib
import importlib.util
import json
import re
from functools import lru_cache
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('pixel_quality', ROOT / '.agents/skills/pixel-art/scripts/quality_audit.py')
quality = importlib.util.module_from_spec(spec)
spec.loader.exec_module(quality)
DIRECTIONS = ['front', 'back', 'left', 'right']


def pixel_data(image):
    return image.get_flattened_data() if hasattr(image, "get_flattened_data") else image.getdata()


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def palette_at(path):
    data = json.loads(Path(path).read_text())
    values = data.get('colors', data.get('palette', {}).get('colors', []))
    if not values or len(values) > 256 or any(not re.fullmatch(r'#[0-9a-fA-F]{6}', c) for c in values):
        raise ValueError('Lock a palette of 1–256 hex RGB colors before normalizing')
    return [tuple(bytes.fromhex(c[1:])) for c in values]


def audit_image(image, max_colors, palette=None):
    report = {'antialiasing': quality.audit_antialiasing(image),
              'orphans': quality.audit_orphan_pixels(image),
              'palette': quality.audit_palette(image, max_colors)}
    if palette is not None:
        allowed = set(palette)
        report['palette']['outside_locked_palette'] = sum(1 for r, g, b, a in pixel_data(image) if a and (r, g, b) not in allowed)
    report['passed'] = all(report[key]['clean'] for key in ['antialiasing', 'orphans', 'palette']) and not report['palette'].get('outside_locked_palette')
    return report


def audit(args):
    manifest = json.loads((ROOT / 'public/art/quality-manifest.json').read_text())
    known = {entry['legacySha256'] for entry in manifest['sources'] if entry.get('quality')=='legacy-reference'}
    path = Path(args.input)
    files = sorted(path.rglob('*.png')) if path.is_dir() else [path]
    if not files:
        raise ValueError('No PNG files to audit')
    palette = palette_at(args.palette) if args.palette else None
    results = []
    for file in files:
        image = Image.open(file).convert('RGBA')
        result = audit_image(image, args.max_colors, palette)
        legacy = digest(file) in known
        result.update(file=str(file), size=list(image.size), sha256=digest(file), legacy=legacy,
                      status='pass' if result['passed'] else 'legacy-issues' if legacy else 'fail')
        results.append(result)
    failed = [r for r in results if not r['passed'] and (args.strict_all or not r['legacy'])]
    report = {'status': 'fail' if failed else 'legacy-issues' if any(not r['passed'] for r in results) else 'pass', 'results': results}
    write_report(args.report, report)
    print(f"Audit: {sum(r['passed'] for r in results)} strict passes; {sum(r['status']=='legacy-issues' for r in results)} preserved masters with issues; {len(failed)} blocking failures")
    return 1 if failed else 0


def write_report(path, report):
    target = Path(path).resolve()
    protect_output(target)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')


def protect_output(path):
    # All generated content is kept outside the shipped masters and saved data.
    if not path.resolve().is_relative_to((ROOT / 'work').resolve()):
        raise ValueError('Outputs must stay under ignored work/; masters and player data are read-only')


def normalize(args):
    out = Path(args.output).resolve()
    protect_output(out)
    if out.exists():
        raise ValueError('Choose a new candidate directory; existing output will not be overwritten')
    if args.frames < 1 or args.width < 1 or args.height < 1 or not 1 <= args.fps <= 60:
        raise ValueError('Frame count and dimensions must be positive')
    palette = palette_at(args.palette)
    strip = Image.open(args.input).convert('RGBA')
    seed = Image.open(args.seed).convert('RGBA')
    if seed.size != (args.width, args.height):
        raise ValueError('Approved seed must already have the target frame size')
    if not audit_image(seed, len(palette), palette)['passed']:
        raise ValueError('Seed must pass the locked-palette/binary-alpha audit; preserve legacy masters and review a derivative seed first')
    if strip.width % args.frames:
        raise ValueError('Strip width must contain exactly equal frame slots')
    slot_width = strip.width // args.frames
    slots = [strip.crop((n * slot_width, 0, (n + 1) * slot_width, strip.height)) for n in range(args.frames)]
    repairs = {'alpha_pixels': 0, 'palette_pixels': 0}

    @lru_cache(maxsize=262144)
    def nearest(rgb):
        return min(palette, key=lambda c: sum((a-b)**2 for a, b in zip(c, rgb)))

    prepared = []
    allowed = set(palette)
    for image in slots:
        pixels = []
        for r, g, b, a in pixel_data(image):
            if a not in (0, 255):
                repairs['alpha_pixels'] += 1
            if a < args.alpha_threshold:
                pixels.append((0, 0, 0, 0))
            else:
                rgb = (r, g, b)
                if rgb not in allowed:
                    repairs['palette_pixels'] += 1
                    rgb = nearest(rgb)
                pixels.append((*rgb, 255))
        image.putdata(pixels)
        prepared.append(image)
    bounds = [im.getchannel('A').getbbox() for im in prepared]
    if any(b is None for b in bounds):
        raise ValueError('Empty frame: review the strip rather than silently importing a missing pose')
    first, anchor = bounds[0], seed.getchannel('A').getbbox()
    sx = (anchor[2]-anchor[0])/(first[2]-first[0])
    sy = (anchor[3]-anchor[1])/(first[3]-first[1])
    if max(sx, sy)/min(sx, sy) > 1.05:
        raise ValueError('Seed silhouette proportions differ from frame 01')
    scale = min(sx, sy)
    source_anchor = [(first[0]+first[2])/2, first[3]]
    target_anchor = [(anchor[0]+anchor[2])/2, anchor[3]]
    offset = [round(target_anchor[n]-source_anchor[n]*scale) for n in range(2)]
    # The same full-slot origin and scale are used for EVERY frame. Independent
    # trimming would recenter asymmetric arms and make the feet slide.
    exports = []
    for index, (image, box) in enumerate(zip(prepared, bounds)):
        transformed = [box[0]*scale+offset[0], box[1]*scale+offset[1], box[2]*scale+offset[0], box[3]*scale+offset[1]]
        if min(transformed[:2]) < -0.5 or transformed[2] > args.width+0.5 or transformed[3] > args.height+0.5:
            raise ValueError(f'Frame {index+1} would clip at the approved scale; enlarge the canvas, not shrink individual poses')
        frame = Image.new('RGBA', (args.width, args.height))
        frame.alpha_composite(image.resize((max(1,round(image.width*scale)), max(1,round(image.height*scale))), Image.Resampling.NEAREST), tuple(offset))
        if index == 0 and args.lock_frame1:
            frame = seed.copy()
        if not audit_image(frame, len(palette), palette)['passed']:
            raise ValueError(f'Frame {index+1} failed the post-normalization audit; no candidate has been written')
        exports.append(frame)
    out.mkdir(parents=True)
    for index, image in enumerate(exports):
        image.save(out / f'{args.direction}_{index+1:02d}.png')
    sheet = Image.new('RGBA', (args.width*args.frames, args.height))
    for index, image in enumerate(exports):
        sheet.alpha_composite(image, (index*args.width, 0))
    sheet.save(out / 'strip.png')
    report = {'status':'candidate-passed', 'source_sha256':digest(args.input), 'seed_sha256':digest(args.seed), 'palette_sha256':digest(args.palette),
              'direction':args.direction,'direction_order':DIRECTIONS,'frames':args.frames,'fps':args.fps,'frame_size':[args.width,args.height],
              'shared_scale':scale,'shared_source_anchor':source_anchor,'shared_target_anchor':target_anchor,
              'frame1_locked':args.lock_frame1,'repairs':repairs,'review':'Inspect native-scale, animated and mounted previews before updating the asset manifest/index.'}
    write_report(out / 'candidate.json', report)
    print(f'Candidate: {args.frames} {args.direction} frames, shared scale {scale:.4f}, anchor {target_anchor}; repaired {repairs}; originals untouched')
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    a = commands.add_parser('audit', help='Read-only audit; preserve and report known legacy quality debt')
    a.add_argument('--input', default=str(ROOT/'public/art'))
    a.add_argument('--report', default=str(ROOT/'work/asset-audit/report.json'))
    a.add_argument('--palette')
    a.add_argument('--max-colors', type=int, default=256)
    a.add_argument('--strict-all', action='store_true')
    n = commands.add_parser('normalize', help='Normalize a complete strip into a NEW work/ candidate directory')
    for key in ['input','seed','palette','output']:
        n.add_argument('--'+key, required=True)
    n.add_argument('--frames', type=int, required=True)
    n.add_argument('--width', type=int, required=True)
    n.add_argument('--height', type=int, required=True)
    n.add_argument('--direction', choices=DIRECTIONS, required=True)
    n.add_argument('--fps', type=int, default=10)
    n.add_argument('--alpha-threshold', type=int, default=128)
    n.add_argument('--lock-frame1', action='store_true')
    args = parser.parse_args()
    if getattr(args,'alpha_threshold',128) not in range(1,256):
        parser.error('alpha threshold must be 1–255')
    try:
        return audit(args) if args.command=='audit' else normalize(args)
    except (ValueError, OSError) as error:
        parser.exit(1, str(error)+'\n')

if __name__ == '__main__':
    raise SystemExit(main())
