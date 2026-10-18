import {personalLinks} from './personal-links';
import type {Layer,Project} from './content';
const layer=(id:string,name:string,label:string,icon:string,responsibility:string,modules:[string,string][],inbound:string,outbound:string):Layer=>({id,name,label,icon,responsibility,modules:modules.map(([name,description])=>({name,description})),inbound,outbound});

/** Checked against the two local repositories and their engineering reports. */
export const projects:Project[]=[
  {
    id:'causalscope',name:'CausalScope',category:'Distributed incident investigation',
    description:'From symptoms to evidence. An incident investigation workspace that turns captured OpenTelemetry traces into service graphs, anomaly signals, and inspectable hypotheses.',
    stack:['TypeScript','React','Express','OpenTelemetry','SQLite','Prisma'],source:personalLinks.projects.causalscope.source,demo:personalLinks.projects.causalscope.demo,
    problem:'A timeout is a symptom, not an explanation. Investigators need to connect observed requests, service dependencies, timing, and logs without pretending a ranking proves causation.',
    approach:'Capture real OpenTelemetry SDK observations from eight instrumented HTTP services. Reconstruct dependencies and timing, compare observations, rank supported hypotheses, and inspect the traces behind each result.',
    highlights:['OTLP/HTTP protobuf ingestion with a verified native Collector path.','Service topology, trace waterfalls, incidents, window replay, and exported reports.','MAD, EWMA, and CUSUM signals with evidence-aware service ranking.','Controlled failure experiments and paired healthy/fault runs with separate fault labels.'],
    validation:'Local build, automated tests, browser workflows, Collector ingestion, and bounded live fault experiments were verified in the project.',
    boundary:'The verified local store is SQLite. PostgreSQL/ClickHouse adapters and Docker configuration are prepared; that full-storage path was not runtime-verified on this host. Rankings are hypotheses, not proof of causation.',
    wireLabels:['REST / queries','Analysis jobs','Telemetry writes','SSE / snapshots'],
    layers:[
      layer('workspace','Workspace','Investigation layer','panels-top-left','Makes captured observations explorable through topology, traces, incidents, and repeatable investigations.',[
        ['Overview','Inspect persisted operational observations.'],['Service map','Explore observed dependencies and service relationships.'],['Trace explorer','Inspect spans, waterfalls, parent relationships, and correlated logs.'],['Incidents','Maintain notes, lifecycle, and supporting evidence.'],['Replay','Inspect a persisted historical window.'],['Failure lab','Run controlled synthetic fault experiments.'],['Paired runs','Compare matching healthy and fault workloads.'],['Reports','Export deterministic Markdown and JSON evidence.']],
        'Session-authenticated API responses / SSE snapshots','Investigation queries / experiment requests'),
      layer('telemetry','Telemetry','Capture layer','activity','Captures genuine observations from instrumented requests and validates telemetry before persistence.',[
        ['Instrumented services','Eight real HTTP service listeners produce traces from bounded workloads.'],['Tracing SDK','OpenTelemetry SDKs export observed spans with W3C context.'],['Collector','Optional native Collector forwards OTLP/HTTP protobuf.'],['OTLP receiver','Authenticated receiver accepts gzip or uncompressed protobuf traces.'],['Correlated logs','A separate authenticated JSON path stores structured correlated logs.'],['Scope & redaction','Workspace scope, payload bounds, and sensitive-field filtering.']],
        'SDK protobuf traces / correlated log events','Normalized spans / authenticated structured logs'),
      layer('analysis','Analysis','Evidence layer','boxes','Reconstructs service relationships and derives interpretable signals without using injected fault labels as ranking inputs.',[
        ['Service graph','Observed client/server edges, reachability, SCCs, and condensation DAG.'],['Structural ordering','Span relationships, interval unions, local time, and ordering warnings.'],['Statistics','Window aggregation, percentiles, and relative-deviation baselines.'],['Anomaly detection','Median/MAD, EWMA, and one-sided CUSUM signals.'],['Service ranking','Evidence-aware hypotheses with an explicit unknown candidate.'],['Paired evaluation','Compare persisted healthy/fault source runs; evaluate predictions separately.']],
        'Persisted observations / bounded analysis requests','Derived signals / ranked hypotheses / source trace references'),
      layer('persistence','Persistence','Data layer','database','Retains observations and investigation state behind explicit local and prepared infrastructure adapters.',[
        ['Local SQLite','Verified persistent local adapter with WAL and scoped keys.'],['Investigation state','Incidents, notes, experiments, evaluations, and replay windows.'],['Span & log store','Queryable captured observations and correlated log records.'],['Full-store adapters','Prepared Prisma/PostgreSQL metadata and ClickHouse telemetry paths.']],
        'Telemetry writes / analysis results / investigator updates','Scoped query results / replay windows / SSE snapshots'),
    ],
  },
  {
    id:'agentfence',name:'AgentFence',category:'AI agent security control plane',
    description:'Every action. Verified. A deterministic gateway that puts scoped identities, policy checks, human approval, and signed evidence between an AI agent and its tools.',
    stack:['TypeScript','React','Express','PostgreSQL','Prisma','OPA / Rego'],source:personalLinks.projects.agentfence.source,demo:personalLinks.projects.agentfence.demo,
    problem:'An agent’s intent is not authorization. Tool execution needs enforceable identity, resource scope, review rules, and an inspectable record of what actually happened.',
    approach:'Route invocations through an authoritative backend gateway. Evaluate trusted structured inputs with OPA, recheck current authorization before execution, bind approvals to the exact payload, and commit synthetic connector changes with evidence.',
    highlights:['Scoped machine credentials, resource grants, and a default-deny policy boundary.','OPA/Rego policy evaluation with deny overriding permit.','Independent approval bound to payload, resource version, and expiry.','Transactional idempotency, signed audit links, policy simulation, and adversarial evaluation.'],
    validation:'Gateway security tests, Rego tests, browser acceptance workflows, compiled runtime checks, and measured local benchmarks are documented in the project.',
    boundary:'Connectors operate on synthetic CRM, payment, and document data. PostgreSQL-compatible PGlite is a development fallback. This is a portfolio security implementation, not a certified enterprise service.',
    wireLabels:['REST / invoke','OPA / policy','Audit / commit','SSE / refresh'],
    layers:[
      layer('workspace','Workspace','Operator layer','panels-top-left','Lets authorized operators inspect requests, author policies, review approvals, and follow execution evidence.',[
        ['Gateway playground','Preview and submit synthetic tool invocations.'],['Agent registry','Manage agents, credentials, and capability grants.'],['Policies','Draft, simulate, compare, and publish policy versions.'],['Approval center','Independent review of a payload-bound request.'],['Investigations','Search invocation records and verify the audit chain.'],['Security lab','Run isolated, reproducible adversarial gateway experiments.']],
        'Session-scoped API responses / persisted audit refresh','Preview / invoke / policy / review operations'),
      layer('gateway','Gateway','Enforcement layer','network','Authenticates callers and makes backend authorization authoritative for every invocation.',[
        ['Identity','Hashed machine credentials and human server-side sessions.'],['Scope checks','Tenant, capability, resource, and classification boundaries.'],['Request contracts','Bounded Zod schemas and validated invocation inputs.'],['Approval binding','Exact payload hash, resource version, expiry, and independent reviewer.'],['Idempotency','Transaction-bound payload/key matching and repeat execution handling.']],
        'Scoped agent SDK calls / session + CSRF operator actions','Trusted policy input / persisted invocation state'),
      layer('policy','Policy & tools','Decision layer','shield-check','Uses deterministic policy decisions and current-state rechecks to gate allowlisted synthetic connectors.',[
        ['OPA / Rego','Evaluate structured policy input with default deny and deny overrides.'],['Policy lifecycle','Version, simulate active/candidate behavior, and publish policies.'],['Authorization recheck','Revalidate current identity, grant, policy, and resource state.'],['CRM connector','Synthetic customer lookup and note operations.'],['Payment connector','Synthetic invoice settlement within checked transactions.'],['Document connector','Allowlisted document actions with scoped resource access.']],
        'Trusted gateway input / approved request references','Permit / deny / review decisions and synthetic execution results'),
      layer('evidence','Evidence','Persistence layer','database','Commits invocation results and signed audit records so decisions and state transitions remain inspectable.',[
        ['PostgreSQL / Prisma','Workspace-scoped relational models and versioned SQL migrations.'],['Signed audit links','HMAC-linked records and audit-chain verification.'],['Invocation history','Persist previews, approvals, stage timings, results, and idempotency binding.'],['SSE notifications','Refresh operators when the persisted audit head changes.']],
        'Authorized connector mutations / invocation and policy records','Stored evidence / trace queries / audit refresh notifications'),
    ],
  },
];
