const runsTbody = document.querySelector('#runsTable tbody');
const runDetails = document.querySelector('#runDetails');
let selectedRunId = null;

async function loadRuns() {
  const status = document.getElementById('statusFilter').value;
  const response = await fetch(`/api/runs${status ? `?status=${encodeURIComponent(status)}` : ''}`);
  const data = await response.json();

  runsTbody.innerHTML = '';
  for (const run of data.runs) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${run.id}</td>
      <td><span class="pill">${run.status}</span></td>
      <td>${run.phase}</td>
      <td>M:${run.manual_spec_score ?? 0} / P:${run.production_openapi3_score ?? 0} / C:${run.live_verified_coverage_score ?? 0}</td>
      <td>${run.created_at}</td>
      <td>
        <button data-open="${run.id}">Open</button>
        <a href="/api/runs/${run.id}/export.csv">CSV</a>
      </td>`;
    runsTbody.appendChild(tr);
  }

  document.querySelectorAll('[data-open]').forEach((btn) =>
    btn.addEventListener('click', () => {
      selectedRunId = btn.getAttribute('data-open');
      loadRunDetails();
    })
  );
}

async function loadRunDetails() {
  if (!selectedRunId) return;
  const progress = await (await fetch(`/api/runs/${selectedRunId}/progress`)).json();
  const results = await (await fetch(`/api/runs/${selectedRunId}/results`)).json();

  runDetails.innerHTML = `
    <h3>Run ${selectedRunId}</h3>
    <p>Status: ${progress.run?.status} / Phase: ${progress.run?.phase}</p>
    <p>Operations: ${progress.run?.completed_operations ?? 0}/${progress.run?.total_operations ?? 0}</p>
    <h4>Recent Events</h4>
    <ul>${(progress.events || []).map((e) => `<li>${e.timestamp} [${e.phase}] ${e.message}</li>`).join('')}</ul>
    <h4>Endpoint Results</h4>
    <table><thead><tr><th>Scenario</th><th>Step</th><th>Method</th><th>Path</th><th>Status</th><th>Issues</th></tr></thead>
      <tbody>${(results.rows || [])
        .map(
          (r) => `<tr><td>${r.scenario}</td><td>${r.step_key}</td><td>${r.method}</td><td>${r.path}</td><td>${r.status}</td><td>${r.issue_codes || ''}</td></tr>`
        )
        .join('')}</tbody>
    </table>
    <p><a href="/api/runs/${selectedRunId}/report" target="_blank">Open Markdown Summary</a></p>
  `;
}

setInterval(() => {
  loadRuns();
  loadRunDetails();
}, 4000);

document.getElementById('startRun').addEventListener('click', async () => {
  await fetch('/api/runs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      label: document.getElementById('label').value,
      allowMutating: document.getElementById('allowMutating').checked
    })
  });
  await loadRuns();
});

document.getElementById('refresh').addEventListener('click', () => {
  loadRuns();
  loadRunDetails();
});

loadRuns();
