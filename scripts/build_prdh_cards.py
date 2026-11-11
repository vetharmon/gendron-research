#!/usr/bin/env python3
"""Build original-format research cards from the private recovery export.
Usage: python3 scripts/build_prdh_cards.py /path/to/recovered-prdh-cards.json
The input export and source screenshots are deliberately not committed.
"""
import json,re,sys
from pathlib import Path
import yaml
ROOT=Path(__file__).resolve().parents[1]
source=json.loads(Path(sys.argv[1]).read_text())
def tidy(s):return re.sub(r'\s+',' ',s or '').strip()
def meta(p):return yaml.safe_load(p.read_text().split('---',2)[1])
def field(c,label,value):
 value=tidy(value)
 if value:c['facts'].append({'label':label,'value':value})
def best(c):return max(c['transcripts'],key=lambda t:(t['method']=='copied',len(t['text'])),default={'text':''})['text']
labels={'individual':'Individual','family':'Family','act':'Event certificate','couple':'Couple'}
cards={}
for old in source['cards']:
 c={k:old[k] for k in ['key','kind','id','url','recovery','candidates','sources']}
 c.update(title=labels[c['kind']],facts=[],notes=[],participants=[],children=[],marriages=[])
 s=best(old);fields=old.get('fields',{})
 if c['kind']=='individual':
  c['title']=old['title'] if old['recovery'] in ['copied','ocr'] else 'Individual record'
  for k,label in [('father','Father'),('mother','Mother'),('birth','Birth'),('baptism','Baptism'),('death','Death'),('burial','Burial')]:field(c,label,fields.get(k))
  marriage_matches=list(re.finditer(r'(?:(?:Premier|Deuxième|Troisième|Quatrième|Cinquième|First|Second|Third|Fourth|Fifth)\s+)?(?:mariage|marriage)\s*:?\s*((?:\d|Vers|About)[^\n]+)',s,re.I))
  for i,match in enumerate(marriage_matches):
   block=s[match.end():marriage_matches[i+1].start() if i+1<len(marriage_matches) else len(s)]
   spouse=re.search(r'(?:avec|with)\s*\n([^\n]+)',block,re.I)
   union={'date_place':tidy(match[1]),'spouse':tidy(spouse[1]) if spouse else ''}
   for k,pat in [('father',r'(?:Père|Father)\s*:\s*([^\n]+)'),('mother',r'(?:Mère|Mother)\s*:\s*([^\n]+)')]:
    m=re.search(pat,block,re.I)
    if m:union[k]=tidy(m[1])
   c['marriages'].append(union)
 elif c['kind']=='family':
  parents=fields.get('parents',[])
  if parents:c['title']=' & '.join(parents);field(c,'Parents',' & '.join(parents))
  m=re.search(r'(?:Marriage|Mariage)\s*:\s*([^\n]+)',s,re.I)
  if m:field(c,'Marriage',m[1])
  for role in ['Father','Mother']:
   m=re.search(role+r'\s*:\s*(.+?)\s*'+role+r'\s*:\s*([^\n]+)',s,re.I)
   if m:
    field(c,role+' of first parent',m[1]);field(c,role+' of second parent',m[2])
  if re.search(r'Children|Enfants',s,re.I):c['notes'].append('The saved family table has not yet been fully structured or proofread. Only separately documented children are listed here.')
 elif c['kind']=='act':
  m=re.search(r'\b(Baptême|Baptism|Sépulture|Burial|Mariage|Marriage)\b',s,re.I)
  c['event']= {'baptême':'Baptism','baptism':'Baptism','sépulture':'Burial','burial':'Burial','mariage':'Marriage','marriage':'Marriage'}.get(m[1].lower(),'Event') if m else 'Event'
  c['title']=c['event']+' certificate'
  if old['recovery']=='copied':
   lines=s.splitlines()
   for i,line in enumerate(lines):
    if line.startswith('MRC:') and i:field(c,'Place and event date',lines[i-1]);break
   for name,label in [('Naissance','Birth'),('Décès','Death')]:
    m=re.search(name+r'\s*:\s*([^\n]+)',s)
    if m:field(c,label,m[1])
   matches=list(re.finditer(r'^\s*(\d{2})\t([^\n]+)',s,re.M))
   for i,m in enumerate(matches):
    block=s[m.end():matches[i+1].start() if i+1<len(matches) else len(s)]
    name=tidy(m[2].split('\t')[0]);role='Subject' if m[1]=='01' else 'Participant'
    if re.search('PÈRE',block):role='Father'
    elif re.search('MÈRE',block):role='Mother'
    elif re.search('ÉPOUX|EPOUX',block):role='Husband'
    elif re.search('ÉPOUSE|EPOUSE',block):role='Wife'
    person={'name':name,'role':role,'rank':m[1]}
    columns=m[2].split('\t')
    if len(columns)>1 and tidy(columns[1]) not in ['', '---', '—']:person['age']=tidy(columns[1])
    job=re.search(r'Profession\s*:\s*([^\n]+)',block)
    if job:person['occupation']=tidy(job[1])
    c['participants'].append(person)
   if c['participants']:c['title']=c['event']+' · '+c['participants'][0]['name']
  else:
   # Do not turn noisy OCR certificate tables into asserted participants.
   c['notes'].append('Certificate text survives as OCR; participant and date fields need visual review before they are added here.') if s else None
 if old['recovery']=='ocr':c['notes'].insert(0,'Recovered from a screenshot. Names, dates, card ID, and associations await visual review; content may be cropped.')
 if old['recovery']=='partial':c['notes'].append('Only an earlier spreadsheet summary survives. The card itself has not been recovered.')
 if old['recovery']=='reference':c['notes'].append('Source reference found; card contents have not been recovered.')
 if len(old['transcripts'])>1:c['notes'].append('Multiple saved text versions exist in the private recovery archive. They have not been treated as independent evidence.')
 if c['key']=='individual:2587975':
  c['facts']=[f for f in c['facts'] if f['label'] not in ['Death','Burial']]
  c['warning']='Disputed historical linkage: the saved PRDH card attached an 1851 Chambly death/burial to this individual. That linkage is not adopted here. See the candidate write-up and C140.'
 if c['key']=='family:134575':c['warning']='The saved family table carried the same disputed 1851 burial link for François (C127). It is not used as a death date in these cards.'
 cards[c['key']]=c
coverage=[]
for p in sorted((ROOT/'_candidates').glob('*.md')):
 m=meta(p);cid=m['id'];prior=next((r for r in source['coverage'] if r['candidate']==cid),{})
 r={**prior,'candidate':cid,'name':m['title'],'date':str(m['date_record']),'category':m['category'],'place':m['place'],'cards':list(prior.get('cards',[]))}
 # Include only currently referenced baptism acts if the candidate page changed.
 act=str(m.get('act',''));r['baptism_act']=act
 if 'act:'+act not in cards:cards['act:'+act]=dict(key='act:'+act,kind='act',id=act,url='https://www.prdh-igd.com/Membership/fr/PRDH/Acte/'+act,recovery='reference',candidates=[cid],sources=[p.name],title='Baptism certificate',event='Baptism',facts=[],notes=['Source reference found; card contents have not been recovered.'],participants=[],children=[])
 if 'act:'+act not in r['cards']:r['cards'].append('act:'+act)
 r['cards']=[k for k in r['cards'] if k in cards]
 coverage.append(r)
# Current, documented family dossier; preserve its explicit list without additional database views.
family=meta(ROOT/'_families/gendron-chatigny-st-clement.md');body=(ROOT/'_families/gendron-chatigny-st-clement.md').read_text().split('---',2)[2]
c=cards.setdefault('family:139402',dict(key='family:139402',kind='family',id='139402',url='https://www.prdh-igd.com/Membership/fr/PRDH/Famille/139402',candidates=[],sources=[],facts=[],notes=[],participants=[],children=[]))
c.update(title='Jean Baptiste Gendron & Claire Chatigny',recovery='research',facts=[{'label':'Marriage','value':family['marriage']},{'label':'Father of Jean Baptiste','value':'Jean Baptiste Gendron'},{'label':'Mother of Jean Baptiste','value':'Marie Marguerite Poirier'},{'label':'Father of Claire','value':'Charles Chatigny'},{'label':'Mother of Claire','value':'Catherine Crete'}],notes=['Structured from the existing family dossier, recorded as verified on 11 November 2026. No new PRDH card was opened.'],dossier='/families/gendron-chatigny-st-clement/',children=[])
c['sources']=sorted(set(c['sources']+['_families/gendron-chatigny-st-clement.md']));c['candidates']=sorted(set(c['candidates']+['C138','C226']))
for line in body.splitlines():
 if not line.startswith('| ') or '---' in line or 'Child |' in line:continue
 cells=[v.strip().replace('**','') for v in line.strip('|').split('|')]
 if len(cells)==3:c['children'].append(dict(name=cells[0],baptism=cells[1],later=cells[2]))
for r in coverage:
 if r['candidate'] in ['C138','C226']:
  if c['key'] not in r['cards']:r['cards'].append(c['key'])
  r['parental_family']=c['key'];r['family_link_basis']='Existing family dossier records the candidate among this couple’s children.'
# Family cards identify related research candidates, not a falsely complete child list.
for c in cards.values():
 c.setdefault('marriages',[])
 c['related_candidates']=[{'candidate':r['candidate'],'name':r['name'],'baptism':r['date']} for r in coverage if r.get('parental_family')==c['key']]
 if c['kind']=='act' and c.get('event') in [None,'Event']:
  if any(r['baptism_act']==c['id'] for r in coverage):c['event']='Baptism';c['title']='Baptism certificate'
 for k in ['individual_link_basis','family_link_basis']:
  pass
out={'schema_version':1,'updated':'2026-11-11','description':'Original-format research abstracts. No screenshots or copied card layouts. PRDH database assertions are distinguished from original-register verification.','cards':sorted(cards.values(),key=lambda c:(c['kind'],int(c['id']))),'coverage':coverage}
(ROOT/'assets/data/prdh-research-cards.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(f"Built {len(cards)} indexed cards; {len(coverage)} candidate rows.")
