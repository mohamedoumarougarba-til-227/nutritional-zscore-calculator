'use strict';
// Public, offline numerical regression. No network, R installation or patient records.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');process.chdir(root);
const {GrowthEngine}=require('../../src/js/services/growth-engine.js');
const {ClinicalEngine}=require('../../src/js/services/clinical-engine.js');
const read=p=>fs.readFileSync(path.join(__dirname,p));
const provenance=JSON.parse(read('provenance.json'));
for(const entry of provenance.files){const bytes=read(entry.file);assert.equal(bytes.length,entry.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256,'Changed fixture: '+entry.file);}
const engine=new GrowthEngine(JSON.parse(fs.readFileSync('src/data/who-official.json')),JSON.parse(fs.readFileSync('src/data/who-2007.json')),JSON.parse(fs.readFileSync('src/data/who-additional.json')));
const young=JSON.parse(read('who2006-fixtures.json'));assert.equal(young.sourceCommit,provenance.who2006Commit);assert.equal(young.fixtures.length,provenance.expectedYoungCases);
let comparisons=0,policyChecks=0;
for(const fixture of young.fixtures){
 const input={...fixture.input,measurementDate:fixture.input.ageDays===1826?'2024-10-14':'2026-10-19'};
 const {result}=engine.calculate(input);
 assert.ok(Math.abs(result.correctedHeight-fixture.correctedHeight)<1e-8);
 for(const key of ['weightForAge','heightForAge','weightForHeight']){
  const value=result[key],expected=fixture.expected[key];
  if(fixture.infantPosition&&key!=='weightForAge'){assert.equal(value.error,'infantPosition');assert.equal(value.zscore,null);policyChecks++;continue;}
  assert.equal(value.zscore,expected.zscore,`WHO2006 ${key}`);
  if(expected.flagged!==null)assert.equal(value.flagged,expected.flagged);comparisons++;
 }
}
function csv(bytes){const [header,...lines]=bytes.toString().trim().split(/\r?\n/),keys=header.split(',');return lines.map(line=>Object.fromEntries(line.split(',').map((v,i)=>[keys[i],v])));}
const older=csv(read('who2007-oracle.csv'));assert.equal(older.length,provenance.expectedOlderCases);
const optional=v=>v===''?null:Number(v);let maxRawError=0;
for(const row of older){
 const got=engine.older.compute({sex:row.sex==='1'?'M':'F',ageInMonths:Number(row.age),heightCm:optional(row.height),weightKg:optional(row.weight),oedema:row.oedema});
 for(const [key,z,flag,raw] of [['weightForAge','zwfa','fwfa','raw_wfa'],['heightForAge','zhfa','fhfa','raw_hfa'],['bmiForAge','zbfa','fbfa','raw_bfa']]){
  const value=got.scores[key];assert.equal(value.zscore,optional(row[z]),`WHO2007 ${row.id} ${key}`);assert.equal(value.flagged===null?null:Number(value.flagged),optional(row[flag]));
  if(row[raw]!==''){const error=Math.abs(value.zscoreRaw-Number(row[raw]));assert.ok(Number.isFinite(error)&&error<2e-10);maxRawError=Math.max(maxRawError,error);}comparisons++;
 }
}
const centiles=read('normal-cdf.csv').toString().trim().split(/\r?\n/).slice(1);assert.equal(centiles.length,provenance.expectedCentileCases);
for(const line of centiles){const [z,p]=line.split(',').map(Number);assert.ok(Math.abs(ClinicalEngine.percentile(z)-p)<3e-11);}
const {SupplementaryGrowth}=require('../../src/js/services/supplementary-growth.js');
const additional=JSON.parse(read('who-additional-decimal.json'));
assert.equal(additional.fixtures.length,provenance.expectedAdditionalDecimalCases);
for(const row of additional.fixtures){
 const field=SupplementaryGrowth.definitions[row.key].field;
 const result=engine.calculate({ageMode:'days',ageDays:row.day,gender:row.sex,weight:8500,height:75,position:'L',oedema:'n',[field]:row.measure}).result.additionalGrowth.indicators[row.key];
 assert.ok(Math.abs(result.zscoreRaw-row.expectedRaw)<2e-10,'Additional WHO '+row.key);
}
const {CDCReference}=require('../../src/js/services/reference-cdc.js');
const cdc=new CDCReference(JSON.parse(fs.readFileSync('src/data/cdc-growth.json'))),cdcCases=JSON.parse(read('cdc-decimal.json'));
assert.equal(cdcCases.fixtures.length,provenance.expectedCDCDecimalCases);assert.equal(cdcCases.normalTail.length,provenance.expectedCDCNormalCases);assert.equal(cdcCases.referenceCurves.length,provenance.expectedCDCCurveCases);
let maxCDCError=0;
for(const row of cdcCases.fixtures){
 const value=cdc.score(row.key,row.measure,row.sex,row.age),want=row.expected;
 const delta=Math.abs(value.zscoreRaw-want.zscoreRaw);assert.ok(Number.isFinite(delta)&&delta<2e-10);maxCDCError=Math.max(maxCDCError,delta);
 assert.ok(Math.abs(value.modifiedZscore-want.modifiedZscore)<2e-10);assert.equal(value.flagged,want.flagged);assert.equal(value.method,want.method);
 if(row.key==='bmiForAge'){assert.ok(Math.abs(value.p95-want.p95)<2e-10);assert.ok(Math.abs(value.sigma-want.sigma)<2e-10);}
}
for(const row of cdcCases.normalTail)assert.ok(Math.abs(CDCReference.survival(row.z)-row.survival)<Math.max(2e-15,row.survival*2e-13));
for(const row of cdcCases.referenceCurves){const value=cdc.valueAtZ(row.key,row.sex,row.age,row.z);if(row.measure===null)assert.equal(value,null);else assert.ok(Number.isFinite(value)&&Math.abs(value-row.measure)<2e-8);}
console.log(JSON.stringify({technicalPassed:true,additionalDecimalCases:additional.fixtures.length,additionalMethod:provenance.additionalMethod,cdc:{cases:cdcCases.fixtures.length,normalCases:cdcCases.normalTail.length,curveCases:cdcCases.referenceCurves.length,maxRawError:maxCDCError,method:provenance.cdcMethod.replace('; UI not yet activated.','.'),uiStatus:'Not assessed by numerical verification; see profile tests and manual validation.'},scope:'Offline numerical regression; not clinical or physical validation',application:require('../../src/js/workspace-app.js').WorkspaceApp.version,engine:GrowthEngine.version,who2006Cases:young.fixtures.length,who2007Cases:older.length,centileCases:centiles.length,scoreComparisons:comparisons,documentedInfantPolicyChecks:policyChecks,maxRawError},null,2));
