"""Verify the compiled APK against the complete offline game tree before release."""
from pathlib import Path
import argparse, hashlib, json, re, zipfile

parser=argparse.ArgumentParser()
parser.add_argument('apk',type=Path)
parser.add_argument('--signature',type=Path,required=True)
parser.add_argument('--badging',type=Path,required=True)
parser.add_argument('--out',type=Path,required=True)
args=parser.parse_args()
root=Path(__file__).resolve().parents[2]
web=root/'nivel-01'/'web'
data=args.apk.read_bytes()
signature=args.signature.read_text()
badging=args.badging.read_text()
assert 'Verifies' in signature, 'APK signature verification did not succeed'
certificate=re.search(r'certificate SHA-256 digest: ([0-9a-fA-F]+)',signature).group(1).lower()
assert "name='com.parkut.game'" in badging
assert "versionCode='4'" in badging and "versionName='0.4.0'" in badging
assert "application-label:'Jumping in the City'" in badging
assert "sdkVersion:'26'" in badging
files=[]
with zipfile.ZipFile(args.apk) as archive:
    for file in sorted(web.rglob('*')):
        if not file.is_file():continue
        relative=file.relative_to(web).as_posix()
        original=file.read_bytes()
        assert archive.read('assets/'+relative)==original, 'APK resource mismatch: '+relative
        files.append({'file':relative,'bytes':len(original),'sha256':hashlib.sha256(original).hexdigest()})
    assert any(name.startswith('res/drawable-nodpi') and name.endswith('/launcher_art.png') for name in archive.namelist())
    assert any(name.startswith('res/mipmap-anydpi-v26') and name.endswith('/ic_launcher.xml') for name in archive.namelist())
report={'version':'0.4.0','versionCode':4,'applicationId':'com.parkut.game','applicationLabel':'Jumping in the City','minSdk':26,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'signatureVerified':True,'certificateSha256':certificate,'sameCertificateAsV03':certificate=='8c1afcdc53b1f8ab49ea82878c6948187dc2f9a05783956392ffcdffb03f9ee7','approvedIconSourceSha256':hashlib.sha256((root/'arte-ciudad/icono-jumping-in-the-city/jumping-in-the-city-icon-final.png').read_bytes()).hexdigest(),'embeddedResourcesVerified':len(files),'files':files}
args.out.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({key:value for key,value in report.items() if key!='files'}))
