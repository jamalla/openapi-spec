const columns = [
  'run_id',
  'scenario',
  'step_key',
  'method',
  'path',
  'operation_id',
  'execution_mode',
  'status',
  'severity',
  'endpoint_score',
  'openapi3_compatibility_score',
  'generation_readiness',
  'issue_count',
  'likely_source',
  'issue_codes',
  'issue_report_r2_key'
];

const esc = (v: unknown) => `"${String(v ?? '').replaceAll('"', '""')}"`;

export function buildCsvExport(rows: Array<Record<string, unknown>>) {
  const header = columns.join(',');
  const body = rows
    .map((row) =>
      columns
        .map((c) =>
          esc(
            c === 'run_id'
              ? row.run_id ?? row.runId
              : row[c] ?? row[c.replace('issue_report_r2_key', 'issue_markdown_r2_key')]
          )
        )
        .join(',')
    )
    .join('\n');
  return `${header}\n${body}`;
}
