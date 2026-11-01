import hashlib
import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
SCRIPT=ROOT/'scripts/sprite_pipeline.py'

class PipelineTests(unittest.TestCase):
    def setUp(self):
        (ROOT/'work').mkdir(exist_ok=True)
        self.temp=tempfile.TemporaryDirectory(prefix='pipeline-test-',dir=ROOT/'work')
        self.dir=Path(self.temp.name)
        self.seed=Image.new('RGBA',(32,32));ImageDraw.Draw(self.seed).rectangle((10,10,21,29),fill='#334455')
        self.seed.save(self.dir/'seed.png')
        strip=Image.new('RGBA',(192,64))
        for n in range(3):
            ImageDraw.Draw(strip).rectangle((n*64+20,18,n*64+43,57),fill=(51,68,85,253))
        ImageDraw.Draw(strip).rectangle((80,32,83,39),fill=(52,68,85,255))
        strip.save(self.dir/'raw.png')
        (self.dir/'palette.json').write_text(json.dumps({'colors':['#334455','#172332']}))
        self.raw_hash=hashlib.sha256((self.dir/'raw.png').read_bytes()).hexdigest()

    def tearDown(self):
        self.assertEqual(self.raw_hash,hashlib.sha256((self.dir/'raw.png').read_bytes()).hexdigest())
        self.temp.cleanup()

    def run_pipeline(self,*extra,output=None):
        args=['python',str(SCRIPT),'normalize','--input',str(self.dir/'raw.png'),'--seed',str(self.dir/'seed.png'),'--palette',str(self.dir/'palette.json'),'--output',str(output or self.dir/'candidate'),'--frames','3','--width','32','--height','32','--direction','front','--lock-frame1',*extra]
        return subprocess.run(args,capture_output=True,text=True)

    def test_shared_scale_origin_palette_alpha_and_exact_seed(self):
        result=self.run_pipeline();self.assertEqual(result.returncode,0,result.stderr)
        a=Image.open(self.dir/'candidate/front_01.png').convert('RGBA')
        b=Image.open(self.dir/'candidate/front_02.png').convert('RGBA')
        self.assertEqual(a.tobytes(),self.seed.tobytes())
        self.assertEqual(b.getpixel((8,18)),(51,68,85,255)) # Asymmetric arm retains its offset.
        self.assertEqual(b.getpixel((10,10)),(51,68,85,255))
        self.assertEqual(b.getpixel((21,29)),(51,68,85,255))
        report=json.loads((self.dir/'candidate/candidate.json').read_text())
        self.assertEqual(report['shared_scale'],.5)
        self.assertEqual(report['shared_target_anchor'],[16,30])
        self.assertGreater(report['repairs']['alpha_pixels'],0)
        self.assertGreater(report['repairs']['palette_pixels'],0)
        self.assertEqual(report['direction_order'],['front','back','left','right'])

    def test_refuses_master_output_and_existing_candidates(self):
        result=self.run_pipeline(output=ROOT/'public/art/candidate')
        self.assertNotEqual(result.returncode,0);self.assertFalse((ROOT/'public/art/candidate').exists())
        out=self.dir/'existing';out.mkdir();(out/'keep.txt').write_text('preserve')
        result=self.run_pipeline(output=out);self.assertNotEqual(result.returncode,0)
        self.assertEqual((out/'keep.txt').read_text(),'preserve')

    def test_rejects_clipping_before_writing_any_frame(self):
        im=Image.open(self.dir/'raw.png');ImageDraw.Draw(im).rectangle((128,0,191,63),fill='#334455');im.save(self.dir/'raw.png')
        self.raw_hash=hashlib.sha256((self.dir/'raw.png').read_bytes()).hexdigest()
        result=self.run_pipeline();self.assertNotEqual(result.returncode,0)
        self.assertIn('would clip',result.stderr);self.assertFalse((self.dir/'candidate').exists())

    def test_rejects_unapproved_seed_palette(self):
        ImageDraw.Draw(self.seed).rectangle((10,10,21,29),fill='#ff0000');self.seed.save(self.dir/'seed.png')
        result=self.run_pipeline();self.assertNotEqual(result.returncode,0)
        self.assertIn('Seed must pass',result.stderr)

if __name__=='__main__':
    unittest.main()
