// mockApi.ts — treat this as the backend. Do not modify.
export type Status = 'PENDING' | 'APPROVED' | 'REJECTED';
export interface Application {
id: string;
applicantName: string;
email: string | null;
loanAmount: number; // in paise (1 rupee = 100 paise)
city: string;
status: Status;
createdAt: string; // ISO date string
version: number; // increments on every change
}
export interface ListParams {
search?: string;
status?: Status | 'ALL';
sortBy?: 'createdAt' | 'loanAmount';
sortDir?: 'asc' | 'desc';
page: number; // 1-based
pageSize: number;
}
export interface ListResponse {
items: Application[];
total: number;
}
const NAMES = ['Aarav Shah', 'Priya Nair', 'Rohan Mehta', 'Sneha Iyer',
'Vikram Rao', 'Ananya Gupta', 'Kabir Khan', 'Meera Joshi'];
const CITIES = ['Mumbai', 'Pune', 'Delhi', 'Bengaluru', 'Chennai',
'Hyderabad'];
const rand = (n: number) => Math.floor(Math.random() * n);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));


const db: Application[] = Array.from({ length: 5000 }, (_, i) => ({
id: `APP-${String(i + 1).padStart(5, '0')}`,
applicantName: i % 97 === 0
? `${NAMES[i % 8]} Venkataraghavan Subramaniam Krishnamurthy`
: NAMES[i % 8],
email: i % 13 === 0 ? null : `applicant${i + 1}@example.com`,
loanAmount: (rand(4990) + 10) * 100 * 100,
city: CITIES[i % CITIES.length],
status: (['PENDING', 'PENDING', 'APPROVED', 'REJECTED'] as Status[])
[rand(4)],
createdAt: new Date(Date.now() - rand(90) * 86400000 -
rand(86400000)).toISOString(),
version: 1,
}));
/** Latency 200–1500 ms. Fails about 10% of the time. */
export async function fetchApplications(p: ListParams): Promise<ListResponse>
{
await sleep(200 + rand(1300));
if (Math.random() < 0.1) throw new Error('NETWORK_ERROR');
let rows = db;
if (p.search) {
const q = p.search.toLowerCase();
rows = rows.filter((a) =>
a.applicantName.toLowerCase().includes(q) ||
a.id.toLowerCase().includes(q));
}
if (p.status && p.status !== 'ALL') rows = rows.filter((a) => a.status ===
p.status);
if (p.sortBy) {
const key = p.sortBy;
const dir = p.sortDir === 'asc' ? 1 : -1;
rows = [...rows].sort((a, b) => (a[key] > b[key] ? dir : a[key] < b[key]
? -dir : 0));
}
const start = (p.page - 1) * p.pageSize;
return { items: clone(rows.slice(start, start + p.pageSize)), total:
rows.length };
}
/**
* Latency 600–1200 ms. Fails about 25% of the time.
* Throws 'CONFLICT' if `version` is not the latest version of that
application.
*/

export async function updateStatus(
id: string, status: Status, version: number,
): Promise<Application> {
await sleep(600 + rand(600));
if (Math.random() < 0.25) throw new Error('SERVER_ERROR');
const app = db.find((a) => a.id === id);
if (!app) throw new Error('NOT_FOUND');
if (app.version !== version) throw new Error('CONFLICT');
app.status = status;
app.version += 1;
return clone(app);
}
/**
* Simulates other reviewers. Every 3 s a random PENDING application
* is approved or rejected. Returns an unsubscribe function.
*/
export function subscribe(onChange: (app: Application) => void): () => void {
const timer = setInterval(() => {
const pending = db.filter((a) => a.status === 'PENDING');
if (!pending.length) return;
const app = pending[rand(pending.length)];
app.status = Math.random() < 0.5 ? 'APPROVED' : 'REJECTED';
app.version += 1;
onChange(clone(app));
}, 10000);
return () => clearInterval(timer);
}