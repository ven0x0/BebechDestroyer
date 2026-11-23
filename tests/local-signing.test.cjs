'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const local=import('../admin/release-local.mjs');
const head='abc01234'.repeat(5);
const repo={id:13,owner:{id:7}};
const workflow={id:3};
const run={id:12,run_attempt:1,workflow_id:3,path:'.github/workflows/android.yml',repository:repo,head_repository:repo,head_branch:'master',head_sha:head,event:'push',actor:{id:7},triggering_actor:{id:7},status:'completed',conclusion:'success'};
test('local signing considers successful builds initiated by the owner on the current master only',async()=>{
const {eligibleRun}=await local;
assert.ok(eligibleRun(run,workflow,repo,head));assert.ok(eligibleRun({...run,event:'workflow_dispatch'},workflow,repo,head));
for(const patch of [{head_repository:{id:10}}, {workflow_id:11}, {actor:{id:9}}, {triggering_actor:{id:9}}, {event:'pull_request'}, {head_branch:'feature'}, {head_sha:'c'.repeat(40)}, {conclusion:'failure'}, {status:'in_progress'}])assert.equal(eligibleRun({...run,...patch},workflow,repo,head),false);
});
test('a signed release needs both known jobs on hosted runners and the archive from that exact run',async()=>{
const {verifyJobs,selectArtifact,verifyDownload}=await local;
const check=name=>({name,head_sha:head,run_id:run.id,status:'completed',conclusion:'success',labels:['ubuntu-24.04']});
const jobs=['testy-master','unsigned-android'].map(check);
assert.doesNotThrow(()=>verifyJobs(jobs,run));assert.throws(()=>verifyJobs(jobs.slice(1),run));
assert.throws(()=>verifyJobs([jobs[0],{...jobs[1],labels:['ubuntu-24.04','self-hosted']}],run));
const bytes=Buffer.from('CI sample'),artifact={id:34,expired:false,name:'unsigned-android-'+head,size_in_bytes:bytes.length,digest:'sha256:'+createHash('sha256').update(bytes).digest('hex'),workflow_run:{id:run.id,head_sha:head,head_branch:'master',repository_id:repo.id,head_repository_id:repo.id}};
assert.equal(selectArtifact([artifact],run,repo),artifact);assert.doesNotThrow(()=>verifyDownload(bytes,artifact));
assert.throws(()=>selectArtifact([{...artifact,workflow_run:{...artifact.workflow_run,head_repository_id:14}}],run,repo));
assert.throws(()=>selectArtifact([{...artifact,expired:true}],run,repo));
assert.throws(()=>verifyDownload(Buffer.from('CI samplE'),artifact));assert.throws(()=>verifyDownload(bytes.subarray(0,4),artifact));
});
