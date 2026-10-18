export interface Skill {name:string;description:string;applications:string[];related:string[];projects:string[];}
export interface SkillGroup {group:string;icon:string;items:Skill[];}
const skill=(name:string,description:string,applications:string[],related:string[],projects:string[]=[]):Skill=>({name,description,applications,related,projects});
const both=['causalscope','agentfence'];
export const skills:SkillGroup[]=[
  {group:'Programming',icon:'braces',items:[
    skill('C','Low-level programming with explicit memory management and an understanding of how software uses the machine.',['Pointers and memory','Procedural programming','Data structures'],['C++','HLD / LLD Fundamentals']),
    skill('C++','Performance-oriented programming that combines systems-level control with reusable abstractions.',['STL and algorithms','Object-oriented design','Competitive programming'],['C','Java']),
    skill('Python','Readable programming for automation, scripting, APIs, and exploring ideas quickly.',['Automation and scripting','Backend development','Data processing'],['FastAPI','PostgreSQL']),
    skill('Java','Strongly typed, object-oriented programming for structured applications and algorithmic problem solving.',['Object-oriented programming','Collections and algorithms','Application structure'],['C++','HLD / LLD Fundamentals']),
    skill('ECMAScript','The JavaScript language foundation for modules, asynchronous workflows, and browser and server runtimes.',['ES modules','Promises and async/await','Browser interactions'],['TypeScript','Node.js','React.js'],both),
    skill('TypeScript','Typed contracts that make application boundaries, API payloads, and state easier to understand and maintain.',['Shared API contracts','Strict frontend and backend types','SDKs and validation boundaries'],['ECMAScript','React.js','Node.js'],both),
  ]},
  {group:'Frontend',icon:'panels-top-left',items:[
    skill('React.js','Component-driven interfaces that turn application state into clear, interactive product workflows.',['Reusable components','State-driven product views','Interactive graphs and inspectors'],['TypeScript','HTML5','CSS3'],both),
    skill('Next.js','A React framework for organizing full-stack web experiences with routing and server rendering.',['File-based routing','Server-rendered pages','React application structure'],['React.js','TypeScript','Node.js']),
    skill('HTML5','Semantic document structure that makes interfaces understandable to browsers, keyboards, and assistive tools.',['Semantic landmarks','Accessible forms','Native controls'],['CSS3','React.js'],both),
    skill('CSS3','Responsive layouts and visual systems that balance expressive motion with readable, usable interfaces.',['Grid and flexbox','Responsive design','Transitions and transforms'],['HTML5','Tailwind CSS'],both),
    skill('Tailwind CSS','Utility-based styling for composing consistent layouts, spacing, and responsive states directly in components.',['Responsive utilities','Component styling','Consistent spacing and surfaces'],['CSS3','React.js'],['agentfence']),
  ]},
  {group:'Backend',icon:'network',items:[
    skill('FastAPI','Python API development built around typed request models, validation, and clear HTTP contracts.',['Typed Python endpoints','Request validation','API documentation'],['Python','PostgreSQL']),
    skill('Node.js','An asynchronous JavaScript runtime for APIs, ingestion processes, workers, and developer tooling.',['HTTP services','Background processing','Streaming and integrations'],['ECMAScript','TypeScript','Express.js'],both),
    skill('Express.js','Explicit HTTP routing and middleware for authentication, request validation, and application boundaries.',['Session APIs','Middleware and authorization','REST and SSE endpoints'],['Node.js','TypeScript','PostgreSQL'],both),
  ]},
  {group:'DevOps',icon:'git-branch',items:[
    skill('Docker','Reproducible service packaging and infrastructure definitions for multi-service applications.',['Container definitions','Compose service topology','Local and deployment environments'],['CI/CD','GitHub Actions'],both),
    skill('CI/CD','Repeatable pipelines that check changes, run tests, and prepare build artifacts before delivery.',['Automated checks','Build verification','Repeatable delivery'],['GitHub Actions','Docker'],both),
    skill('GitHub Actions','Repository workflows for running validation and build steps on a defined set of events.',['Workflow definitions','Automated test jobs','Build pipelines'],['CI/CD','Docker'],both),
  ]},
  {group:'System Design',icon:'boxes',items:[
    skill('HLD / LLD Fundamentals','Reasoning about a system at both the service-boundary level and the module-and-contract level.',['Service decomposition','Data flow and contracts','Module responsibilities'],['Scalability','Caching','Load Balancing'],both),
    skill('Scalability','Understanding how load, resource limits, and coordination choices affect a system as demand changes.',['Bounded work','Bottleneck analysis','Capacity tradeoffs'],['Load Balancing','Caching','Node.js'],['causalscope']),
    skill('Caching','Reducing repeated work while reasoning about freshness, invalidation, and failure behavior.',['Cache-aside reasoning','TTL and invalidation','Latency and freshness tradeoffs'],['Scalability','HLD / LLD Fundamentals']),
    skill('Load Balancing','Distributing work across instances while accounting for health, routing, and failure isolation.',['Request distribution','Health checks','Availability tradeoffs'],['Scalability','Docker','AWS Fundamentals']),
  ]},
  {group:'Cloud Platforms',icon:'network',items:[
    skill('AWS Fundamentals','Foundational understanding of cloud compute, storage, networking, and identity concepts.',['Compute and storage concepts','IAM fundamentals','Cloud deployment foundations'],['Docker','Load Balancing','PostgreSQL']),
  ]},
  {group:'Databases',icon:'database',items:[
    skill('MongoDB','Document-oriented data modeling for applications whose records benefit from flexible nested structures.',['Document schemas','Query and index design','Aggregation concepts'],['Node.js','Express.js']),
    skill('PostgreSQL','Relational modeling, constraints, and transactions for durable application data and consistent state changes.',['Relational schemas','Transactions and constraints','Prisma-backed persistence'],['Express.js','HLD / LLD Fundamentals'],both),
    skill('MySQL','Relational storage with structured schemas, SQL queries, and transactional application workflows.',['SQL queries and joins','Relational modeling','Indexes and transactions'],['PostgreSQL','HLD / LLD Fundamentals']),
  ]},
];
export const findSkill=(name:string)=>skills.flatMap(group=>group.items).find(item=>item.name===name);
